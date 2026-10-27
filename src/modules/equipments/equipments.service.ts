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

  // Công thức Haversine tính khoảng cách giữa 2 tọa độ GPS (trả về mét)
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Bán kính Trái Đất (mét)
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

  // Tự động sinh mã QR dạng EQ-YYYY-XXXX không trùng lặp
  private async generateNextQrCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await this.equipmentRepo.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `EQ-${currentYear}-${sequence}`;
  }

  // 1. Thêm mới thiết bị
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

  // 2. Danh sách thiết bị (có lọc theo facilityId)
  async getEquipments(facilityId?: string): Promise<Equipment[]> {
    if (facilityId) {
      return this.equipmentRepo.find({ where: { facilityId } });
    }
    return this.equipmentRepo.find({ order: { createdAt: 'DESC' } });
  }

  // 3. Tra cứu theo mã QR Code
  async getByQrCode(qrCode: string): Promise<Equipment> {
    const item = await this.equipmentRepo.findOne({ where: { qrCode } });
    if (!item) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }
    return item;
  }

  // 4. Quét mã QR kiểm tra hiện trường & kiểm tra lệch GPS 200m (Điểm nhấn Demo)
  async inspectEquipment(
    qrCode: string,
    data: { status: EquipmentStatus; lat: number; lng: number },
  ) {
    // Kiểm tra tính hợp lệ của tọa độ
    if (data.lat < -90 || data.lat > 90 || data.lng < -180 || data.lng > 180) {
      throw new BadRequestException('Tọa độ GPS không hợp lệ');
    }

    const equipment = await this.getByQrCode(qrCode);

    // Tính độ lệch khoảng cách giữa vị trí quét và cơ sở
    const distanceDiffMeter = this.calculateHaversineDistance(
      data.lat,
      data.lng,
      equipment.facilityLat,
      equipment.facilityLng,
    );

    // Ngưỡng cảnh báo gian lận theo tài liệu: > 200m
    const isGpsWarning = distanceDiffMeter > 200;

    // Cập nhật kết quả quét vào DB
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
