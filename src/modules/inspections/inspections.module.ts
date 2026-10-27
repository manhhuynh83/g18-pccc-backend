import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { Facility } from './facility.entity';
import { Inspection } from './inspection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Facility, Inspection])],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
