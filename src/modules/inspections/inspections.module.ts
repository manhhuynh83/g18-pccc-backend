import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { Facility } from './facility.entity';
import { Inspection } from './inspection.entity';
import { Equipment } from '../equipments/equipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Facility, Inspection, Equipment])],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
