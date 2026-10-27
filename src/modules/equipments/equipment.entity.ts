import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EquipmentType {
  EXTINGUISHER = 'EXTINGUISHER',   // Bình chữa cháy
  HYDRANT = 'HYDRANT',             // Trụ / họng nước
  SMOKE_DETECTOR = 'SMOKE_DETECTOR', // Đầu báo khói
  ALARM_BELL = 'ALARM_BELL',       // Chuông báo cháy
}

export enum EquipmentStatus {
  ACTIVE = 'ACTIVE',       // Hoạt động tốt
  MAINTENANCE = 'MAINTENANCE', // Cần bảo trì
  DAMAGED = 'DAMAGED',     // Hỏng hóc
}

@Entity('equipments')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // Mã thiết bị, vd: PCCC-EXT-001

  @Column({
    type: 'enum',
    enum: EquipmentType,
    default: EquipmentType.EXTINGUISHER,
  })
  type: EquipmentType;

  @Column()
  location: string; // Vị trí lắp đặt, vd: Tầng 1 - Cửa thang bộ

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.ACTIVE,
  })
  status: EquipmentStatus;

  @Column({ type: 'text', nullable: true })
  qrCodeUrl: string; // Link ảnh QR Code hoặc base64 của thiết bị

  @Column({ type: 'date', nullable: true })
  expirationDate: Date; // Hạn kiểm định / hạn sử dụng

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}