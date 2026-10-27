import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentStatus } from './equipment.entity';

@Injectable()
export class EquipmentsService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  private calculateHaversineDistance(
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

  // Sinh mã QR an toàn dựa trên bản ghi có số thứ tự lớn nhất trong năm
  private async generateNextQrCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `EQ-${currentYear}-`;

    const latest = await this.equipmentRepo
      .createQueryBuilder('eq')
      .where('eq.qrCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('eq.qrCode', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (latest) {
      const parts = latest.qrCode.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  async createEquipment(data: {
    name: string;
    facilityId: string;
    facilityLat?: number;
    facilityLng?: number;
    expiryDate?: string;
  }): Promise<Equipment> {
    const qrCode = await this.generateNextQrCode();

    const equipment = this.equipmentRepo.create({
      qrCode,
      name: data.name,
      facilityId: data.facilityId,
      facilityLat: data.facilityLat ?? 10.8523,
      facilityLng: data.facilityLng ?? 106.6289,
      status: EquipmentStatus.GOOD,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    });

    return this.equipmentRepo.save(equipment);
  }

  async getEquipments(facilityId?: string): Promise<Equipment[]> {
    if (facilityId) {
      return this.equipmentRepo.find({ where: { facilityId } });
    }
    return this.equipmentRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getByQrCode(qrCode: string): Promise<Equipment> {
    const item = await this.equipmentRepo.findOne({ where: { qrCode } });
    if (!item) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }
    return item;
  }

  // Cập nhật thông tin thiết bị / gia hạn bảo dưỡng (PUT /api/equipments/:id)
  async updateEquipment(
    id: string,
    data: { name?: string; expiryDate?: string; status?: EquipmentStatus },
  ): Promise<Equipment> {
    const equipment = await this.equipmentRepo.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('Không tìm thấy thiết bị để cập nhật');
    }

    if (data.name) equipment.name = data.name;
    if (data.expiryDate) equipment.expiryDate = new Date(data.expiryDate);
    if (data.status) equipment.status = data.status;

    return this.equipmentRepo.save(equipment);
  }

  // Xóa thiết bị (DELETE /api/equipments/:id)
  async deleteEquipment(id: string): Promise<void> {
    const result = await this.equipmentRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Không tìm thấy thiết bị để xóa');
    }
  }

  // Quét QR kiểm tra định kỳ có đối chiếu GPS và kiểm tra trạng thái EXPIRED
  async inspectEquipment(
    qrCode: string,
    data: { status: EquipmentStatus; lat: number; lng: number },
  ) {
    if (data.lat < -90 || data.lat > 90 || data.lng < -180 || data.lng > 180) {
      throw new BadRequestException('Tọa độ GPS không hợp lệ');
    }

    const equipment = await this.getByQrCode(qrCode);

    // Nghiệp vụ: Thiết bị đã EXPIRED không thể chuyển lại GOOD bằng cách quét QR
    if (
      equipment.status === EquipmentStatus.EXPIRED &&
      data.status === EquipmentStatus.GOOD
    ) {
      throw new BadRequestException(
        'Thiết bị đã hết hạn (EXPIRED). Phải cập nhật hạn bảo dưỡng mới trước khi đổi sang GOOD!',
      );
    }

    const distanceDiffMeter = this.calculateHaversineDistance(
      data.lat,
      data.lng,
      equipment.facilityLat,
      equipment.facilityLng,
    );

    const isGpsWarning = distanceDiffMeter > 200;

    equipment.status = data.status;
    equipment.lastCheckedAt = new Date();
    equipment.lastCheckLat = data.lat;
    equipment.lastCheckLng = data.lng;
    await this.equipmentRepo.save(equipment);

    return {
      equipment,
      distanceDiffMeter,
      isGpsWarning,
    };
  }
}
