import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EquipmentStatus {
  GOOD = 'GOOD',
  BROKEN = 'BROKEN',
  EXPIRED = 'EXPIRED',
}

@Entity('fire_equipments')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  qrCode: string; // Dạng EQ-2026-0001

  @Column()
  name: string; // Tên thiết bị (Bình bột MFZ4, Cuộn vòi...)

  @Column()
  facilityId: string; // Mã cơ sở quản lý thiết bị này

  // Tọa độ chuẩn của cơ sở (để đối chiếu chống gian lận GPS)
  @Column({ type: 'float', default: 10.8523 })
  facilityLat: number;

  @Column({ type: 'float', default: 106.6289 })
  facilityLng: number;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.GOOD,
  })
  status: EquipmentStatus;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date; // Hạn bảo dưỡng ghi trên tem nhãn

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt: Date;

  @Column({ type: 'float', nullable: true })
  lastCheckLat: number;

  @Column({ type: 'float', nullable: true })
  lastCheckLng: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
