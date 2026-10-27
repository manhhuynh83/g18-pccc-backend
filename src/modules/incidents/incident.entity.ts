import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IncidentSeverity {
  LOW = 'LOW',         // Cháy nhỏ, đã khống chế
  MEDIUM = 'MEDIUM',   // Cần lực lượng tại chỗ xử lý
  HIGH = 'HIGH',       // Cháy lớn, cần điều xe cứu hỏa khẩn cấp
  CRITICAL = 'CRITICAL'// Nguy cơ nổ, sập công trình
}

export enum IncidentStatus {
  REPORTED = 'REPORTED',     // Mới tiếp nhận tin báo
  VERIFIED = 'VERIFIED',     // Đã xác minh thực tế
  RESOLVING = 'RESOLVING',   // Đang chữa cháy / cứu hộ
  RESOLVED = 'RESOLVED',     // Đã dập tắt hoàn toàn
}

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // Tiêu đề vụ việc (vd: Báo cháy kho vật liệu)

  @Column({ type: 'text', nullable: true })
  description: string; // Chi tiết vụ việc

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.MEDIUM,
  })
  severity: IncidentSeverity;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status: IncidentStatus;

  @Column()
  address: string; // Địa chỉ diễn ra sự cố

  // Tọa độ GPS phục vụ hiển thị lên bản đồ
  @Column({ type: 'float' })
  latitude: number; // Vĩ độ (vd: 10.8523)

  @Column({ type: 'float' })
  longitude: number; // Kinh độ (vd: 106.6289)

  @Column({ type: 'text', nullable: true })
  imageUrl: string; // Đường link ảnh hiện trường lưu từ MinIO

  @Column({ nullable: true })
  reporterPhone: string; // Số điện thoại người báo tin

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}