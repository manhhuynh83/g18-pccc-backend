import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Facility, RiskLevel, SafetyStatus } from './facility.entity';
import {
  Inspection,
  InspectionType,
  InspectionStatus,
  InspectionConclusion,
} from './inspection.entity';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
    @InjectRepository(Inspection)
    private readonly inspectionRepo: Repository<Inspection>,
  ) {}

  // 1. Tính khoảng cách Haversine (mét)
  private calculateHaversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000;
    const toRad = (angle: number) => (angle * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // 2. Kiểm tra ngày dự kiến có cách hôm nay ít nhất 3 ngày làm việc (không tính T7, CN)
  private isAtLeast3WorkingDaysAhead(targetDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(today);
    let workingDaysAdded = 0;

    while (workingDaysAdded < 3) {
      checkDate.setDate(checkDate.getDate() + 1);
      const dayOfWeek = checkDate.getDay();
      // Bỏ qua Thứ 7 (6) và Chủ Nhật (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysAdded++;
      }
    }

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    return target >= checkDate;
  }

  // 3. Tạo cơ sở mới (phục vụ test và liên kết thiết bị)
  async createFacility(data: {
    name: string;
    riskLevel?: RiskLevel;
    latitude?: number;
    longitude?: number;
    nextInspectionDate?: string;
  }): Promise<Facility> {
    const facility = this.facilityRepo.create({
      name: data.name,
      riskLevel: data.riskLevel ?? RiskLevel.MEDIUM,
      status: SafetyStatus.SAFE,
      latitude: data.latitude ?? 10.8523,
      longitude: data.longitude ?? 106.6289,
      nextInspectionDate: data.nextInspectionDate
        ? new Date(data.nextInspectionDate)
        : undefined,
    });
    return this.facilityRepo.save(facility);
  }

  // 4. Lập lịch kiểm tra (POST /api/inspections)
  async scheduleInspection(data: {
    facilityId: string;
    inspectorId: string;
    inspectionType: InspectionType;
    scheduledDate: string;
  }): Promise<Inspection> {
    const facility = await this.facilityRepo.findOne({
      where: { id: data.facilityId },
    });
    if (!facility) {
      throw new NotFoundException('Không tìm thấy cơ sở cần lập lịch');
    }

    const scheduledDate = new Date(data.scheduledDate);

    // Bắt buộc báo trước 3 ngày làm việc với kiểm tra định kỳ (PERIODIC)
    if (data.inspectionType === InspectionType.PERIODIC) {
      if (!this.isAtLeast3WorkingDaysAhead(scheduledDate)) {
        throw new BadRequestException(
          'Lịch kiểm tra định kỳ phải thông báo trước ít nhất 3 ngày làm việc cho cơ sở',
        );
      }
    }

    const inspection = this.inspectionRepo.create({
      facilityId: data.facilityId,
      inspectorId: data.inspectorId,
      inspectionType: data.inspectionType,
      scheduledDate,
      status: InspectionStatus.SCHEDULED,
    });

    return this.inspectionRepo.save(inspection);
  }

  // 5. Hoàn tất biên bản & Tự tính chu kỳ kiểm tra kế tiếp (PATCH /api/inspections/:id/complete)
  async completeInspection(
    id: string,
    data: {
      conclusion: InspectionConclusion;
      reportFileUrl?: string;
      checkInLat: number;
      checkInLng: number;
    },
  ) {
    const inspection = await this.inspectionRepo.findOne({ where: { id } });
    if (!inspection) {
      throw new NotFoundException('Không tìm thấy biên bản kiểm tra');
    }

    const facility = await this.facilityRepo.findOne({
      where: { id: inspection.facilityId },
    });
    if (!facility) {
      throw new NotFoundException('Không tìm thấy cơ sở tương ứng');
    }

    // Tính khoảng cách check-in
    const distanceDiff = this.calculateHaversine(
      data.checkInLat,
      data.checkInLng,
      facility.latitude,
      facility.longitude,
    );

    const actualDate = new Date();

    // Tự động tính hạn kiểm tra kế tiếp theo Luật PCCC:
    // Cơ sở HIGH (Phụ lục II): 6 tháng
    // Cơ sở MEDIUM / LOW (Phụ lục I): 12 tháng (1 năm)
    const nextDate = new Date(actualDate);
    if (facility.riskLevel === RiskLevel.HIGH) {
      nextDate.setMonth(nextDate.getMonth() + 6);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    // Cập nhật cơ sở
    facility.lastInspectionDate = actualDate;
    facility.nextInspectionDate = nextDate;
    facility.status =
      data.conclusion === InspectionConclusion.PASSED
        ? SafetyStatus.SAFE
        : SafetyStatus.VIOLATION;
    await this.facilityRepo.save(facility);

    // Cập nhật biên bản kiểm tra
    inspection.actualDate = actualDate;
    inspection.status = InspectionStatus.COMPLETED;
    inspection.conclusion = data.conclusion;
    inspection.reportFileUrl = data.reportFileUrl ?? null;
    inspection.checkInLat = data.checkInLat;
    inspection.checkInLng = data.checkInLng;
    inspection.distanceDiffMeter = distanceDiff;
    await this.inspectionRepo.save(inspection);

    return {
      inspection,
      facility,
      distanceDiffMeter: distanceDiff,
    };
  }

  // 6. Lấy danh sách kiểm tra
  async getAllInspections(facilityId?: string) {
    if (facilityId) {
      return this.inspectionRepo.find({
        where: { facilityId },
        order: { scheduledDate: 'DESC' },
      });
    }
    return this.inspectionRepo.find({ order: { scheduledDate: 'DESC' } });
  }

  // 7. Lấy danh sách toàn bộ cơ sở
  async getAllFacilities() {
    return this.facilityRepo.find({ order: { createdAt: 'DESC' } });
  }

  // 8. Cronjob tự động quét hàng ngày lúc 00:00 (Asia/Ho_Chi_Minh)
  @Cron('0 0 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDailyCronJob() {
    return this.runDailyCheck();
  }

  // Hàm quét hạn kiểm tra (dùng chung cho Cronjob và nút Demo trực tiếp)
  async runDailyCheck() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const warningThreshold = new Date(today);
    warningThreshold.setDate(warningThreshold.getDate() + 15); // Cảnh báo trước 15 ngày

    const facilities = await this.facilityRepo.find();
    let updatedCount = 0;

    for (const fac of facilities) {
      if (!fac.nextInspectionDate) continue;

      const nextDate = new Date(fac.nextInspectionDate);
      nextDate.setHours(0, 0, 0, 0);

      // 1. Quá hạn kiểm tra -> VIOLATION
      if (nextDate < today && fac.status !== SafetyStatus.VIOLATION) {
        fac.status = SafetyStatus.VIOLATION;
        await this.facilityRepo.save(fac);
        updatedCount++;
      }
      // 2. Còn từ 15 ngày trở xuống -> WARNING
      else if (
        nextDate <= warningThreshold &&
        nextDate >= today &&
        fac.status === SafetyStatus.SAFE
      ) {
        fac.status = SafetyStatus.WARNING;
        await this.facilityRepo.save(fac);
        updatedCount++;
      }
    }

    return {
      checkedAt: new Date(),
      totalFacilities: facilities.length,
      updatedCount,
    };
  }
}
