import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentSeverity } from './incident.entity';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  async create(
    @Body()
    body: {
      title: string;
      description?: string;
      severity?: IncidentSeverity;
      address: string;
      latitude: number;
      longitude: number;
      imageUrl?: string;
      reporterPhone?: string;
    },
  ) {
    return this.incidentsService.createIncident(body);
  }

  @Get()
  async findAll() {
    return this.incidentsService.getAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.incidentsService.getById(id);
  }
}