import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Facility } from './facility.entity';

export enum InspectionType {
  PERIODIC = 'PERIODIC', // Định kỳ (phải báo trước 3 ngày)
  SUDDEN = 'SUDDEN', // Đột xuất
}

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED', // Đã lên lịch
  COMPLETED = 'COMPLETED', // Đã hoàn thành
  OVERDUE = 'OVERDUE', // Quá hạn chưa thực hiện
}

export enum InspectionConclusion {
  PASSED = 'PASSED', // Đạt yêu cầu PCCC
  FAILED = 'FAILED', // Không đạt yêu cầu
}

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  facilityId: string;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  facility: Facility;

  @Column()
  inspectorId: string; // Cán bộ kiểm tra

  @Column({
    type: 'enum',
    enum: InspectionType,
    default: InspectionType.PERIODIC,
  })
  inspectionType: InspectionType;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.SCHEDULED,
  })
  status: InspectionStatus;

  @Column({ type: 'date' })
  scheduledDate: Date; // Ngày dự kiến

  @Column({ type: 'date', nullable: true })
  actualDate: Date; // Ngày thực hiện thực tế

  @Column({
    type: 'enum',
    enum: InspectionConclusion,
    nullable: true,
  })
  conclusion: InspectionConclusion;

  @Column({ type: 'text', nullable: true })
  reportFileUrl?: string | null; // Cho phép null/undefined nếu chưa có file PDF

  @Column({ type: 'float', nullable: true })
  checkInLat: number;

  @Column({ type: 'float', nullable: true })
  checkInLng: number;

  @Column({ type: 'int', nullable: true })
  distanceDiffMeter: number; // Khoảng cách check-in so với cơ sở

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
