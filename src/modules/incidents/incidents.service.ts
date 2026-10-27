import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident, IncidentSeverity, IncidentStatus } from './incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
  ) {}

  // Tạo mới một vụ báo cáo sự cố cháy nổ kèm tọa độ GPS
  async createIncident(data: {
    title: string;
    description?: string;
    severity?: IncidentSeverity;
    address: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    reporterPhone?: string;
  }): Promise<Incident> {
    const incident = this.incidentRepo.create({
      ...data,
      status: IncidentStatus.REPORTED,
    });
    return this.incidentRepo.save(incident);
  }

  // Lấy toàn bộ danh sách vụ cháy phục vụ hiển thị lên bản đồ số
  async getAll(): Promise<Incident[]> {
    return this.incidentRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Xem chi tiết một vụ cháy theo ID
  async getById(id: string): Promise<Incident> {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException(`Không tìm thấy sự cố với mã ${id}`);
    }
    return incident;
  }
}