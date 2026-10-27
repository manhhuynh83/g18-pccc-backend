import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentStatus, EquipmentType } from './equipment.entity';
import * as QRCode from 'qrcode';

@Injectable()
export class EquipmentsService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  // Tạo thiết bị mới và tự động render mã QR Code
  async createEquipment(data: {
    code: string;
    type: EquipmentType;
    location: string;
    status?: EquipmentStatus;
    expirationDate?: string;
  }): Promise<Equipment> {
    const equipment = this.equipmentRepo.create({
      code: data.code,
      type: data.type,
      location: data.location,
      status: data.status || EquipmentStatus.ACTIVE,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
    });

    // Nội dung chứa trong mã QR (định danh code của thiết bị)
    const qrData = JSON.stringify({
      code: data.code,
      type: data.type,
      location: data.location,
    });

    // Tự sinh ảnh mã QR dưới dạng Data URL (Base64)
    equipment.qrCodeUrl = await QRCode.toDataURL(qrData);

    return this.equipmentRepo.save(equipment);
  }

  // Danh sách toàn bộ thiết bị
  async getAll(): Promise<Equipment[]> {
    return this.equipmentRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Tìm kiếm thiết bị theo mã QR/Code
  async getByCode(code: string): Promise<Equipment> {
    const item = await this.equipmentRepo.findOne({ where: { code } });
    if (!item) {
      throw new NotFoundException(`Không tìm thấy thiết bị mang mã ${code}`);
    }
    return item;
  }
}