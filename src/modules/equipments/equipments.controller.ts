import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { EquipmentStatus, EquipmentType } from './equipment.entity';

@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  @Post()
  async create(
    @Body()
    body: {
      code: string;
      type: EquipmentType;
      location: string;
      status?: EquipmentStatus;
      expirationDate?: string;
    },
  ) {
    return this.equipmentsService.createEquipment(body);
  }

  @Get()
  async findAll() {
    return this.equipmentsService.getAll();
  }

  @Get(':code')
  async findByCode(@Param('code') code: string) {
    return this.equipmentsService.getByCode(code);
  }
}