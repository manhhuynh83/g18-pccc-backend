import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Facility, RiskLevel, SafetyStatus } from './facility.entity';
import {
  Inspection,
  InspectionType,
  InspectionStatus,
  InspectionConclusion,
} from './inspection.entity';
import { Equipment, EquipmentStatus } from '../equipments/equipment.entity';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
    @InjectRepository(Inspection)
    private readonly inspectionRepo: Repository<Inspection>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

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

  private isAtLeast3WorkingDaysAhead(targetDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(today);
    let workingDaysAdded = 0;

    while (workingDaysAdded < 3) {
      checkDate.setDate(checkDate.getDate() + 1);
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysAdded++;
      }
    }

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    return target >= checkDate;
  }

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

    const distanceDiff = this.calculateHaversine(
      data.checkInLat,
      data.checkInLng,
      facility.latitude,
      facility.longitude,
    );

    const actualDate = new Date();

    const nextDate = new Date(actualDate);
    if (facility.riskLevel === RiskLevel.HIGH) {
      nextDate.setMonth(nextDate.getMonth() + 6);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    facility.lastInspectionDate = actualDate;
    facility.nextInspectionDate = nextDate;
    facility.status =
      data.conclusion === InspectionConclusion.PASSED
        ? SafetyStatus.SAFE
        : SafetyStatus.VIOLATION;
    await this.facilityRepo.save(facility);

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

  async getInspectionById(id: string): Promise<Inspection> {
    const item = await this.inspectionRepo.findOne({
      where: { id },
      relations: { facility: true },
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy lịch kiểm tra');
    }
    return item;
  }

  async getAllInspections(query?: {
    facilityId?: string;
    status?: InspectionStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const qb = this.inspectionRepo.createQueryBuilder('insp');

    if (query?.facilityId) {
      qb.andWhere('insp.facilityId = :facilityId', {
        facilityId: query.facilityId,
      });
    }
    if (query?.status) {
      qb.andWhere('insp.status = :status', { status: query.status });
    }
    if (query?.startDate && query?.endDate) {
      qb.andWhere('insp.scheduledDate BETWEEN :start AND :end', {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
      });
    }

    qb.orderBy('insp.scheduledDate', 'DESC');
    return qb.getMany();
  }

  async getAllFacilities() {
    return this.facilityRepo.find({ order: { createdAt: 'DESC' } });
  }

  @Cron('0 0 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDailyCronJob() {
    return this.runDailyCheck();
  }

  async runDailyCheck() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const warningThreshold = new Date(today);
    warningThreshold.setDate(warningThreshold.getDate() + 15);

    let updatedFacilities = 0;
    let overdueInspections = 0;
    let expiredEquipments = 0;

    // 1. Quét cơ sở đổi sang WARNING hoặc VIOLATION
    const facilities = await this.facilityRepo.find();
    for (const fac of facilities) {
      if (!fac.nextInspectionDate) continue;

      const nextDate = new Date(fac.nextInspectionDate);
      nextDate.setHours(0, 0, 0, 0);

      if (nextDate < today && fac.status !== SafetyStatus.VIOLATION) {
        fac.status = SafetyStatus.VIOLATION;
        await this.facilityRepo.save(fac);
        updatedFacilities++;
      } else if (
        nextDate <= warningThreshold &&
        nextDate >= today &&
        fac.status === SafetyStatus.SAFE
      ) {
        fac.status = SafetyStatus.WARNING;
        await this.facilityRepo.save(fac);
        updatedFacilities++;
      }
    }

    // 2. Quét lịch SCHEDULED quá hạn -> OVERDUE
    const scheduledList = await this.inspectionRepo.find({
      where: { status: InspectionStatus.SCHEDULED },
    });
    for (const insp of scheduledList) {
      const sDate = new Date(insp.scheduledDate);
      sDate.setHours(0, 0, 0, 0);
      if (sDate < today) {
        insp.status = InspectionStatus.OVERDUE;
        await this.inspectionRepo.save(insp);
        overdueInspections++;
      }
    }

    // 3. Quét thiết bị hết hạn -> EXPIRED
    const activeEquipments = await this.equipmentRepo.find();
    for (const eq of activeEquipments) {
      if (!eq.expiryDate || eq.status === EquipmentStatus.EXPIRED) continue;
      const exp = new Date(eq.expiryDate);
      exp.setHours(0, 0, 0, 0);
      if (exp < today) {
        eq.status = EquipmentStatus.EXPIRED;
        await this.equipmentRepo.save(eq);
        expiredEquipments++;
      }
    }

    return {
      checkedAt: new Date(),
      updatedFacilities,
      overdueInspections,
      expiredEquipments,
    };
  }
}
