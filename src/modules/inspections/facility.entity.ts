import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RiskLevel {
  HIGH = 'HIGH', // Cơ sở Phụ lục II: Nguy cơ cao -> chu kỳ 6 tháng
  MEDIUM = 'MEDIUM', // Cơ sở Phụ lục I: Chu kỳ 12 tháng
  LOW = 'LOW', // Chu kỳ 12 tháng
}

export enum SafetyStatus {
  SAFE = 'SAFE', // Còn hạn > 15 ngày
  WARNING = 'WARNING', // Còn hạn <= 15 ngày
  VIOLATION = 'VIOLATION', // Quá hạn hoặc có vi phạm nặng
}

@Entity('facilities')
export class Facility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Tên cơ sở, ví dụ: Nhà máy X, Chung cư Y

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIUM,
  })
  riskLevel: RiskLevel;

  @Column({
    type: 'enum',
    enum: SafetyStatus,
    default: SafetyStatus.SAFE,
  })
  status: SafetyStatus;

  // Tọa độ GPS của cơ sở
  @Column({ type: 'float', default: 10.8523 })
  latitude: number;

  @Column({ type: 'float', default: 106.6289 })
  longitude: number;

  @Column({ type: 'date', nullable: true })
  lastInspectionDate: Date; // Ngày kiểm tra gần nhất

  @Column({ type: 'date', nullable: true })
  nextInspectionDate: Date; // Hạn kiểm tra kế tiếp (chu kỳ 6 hoặc 12 tháng)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
