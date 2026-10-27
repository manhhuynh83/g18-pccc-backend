import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { Equipment } from './equipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment])],
  controllers: [EquipmentsController],
  providers: [EquipmentsService],
  exports: [EquipmentsService],
})
export class EquipmentsModule {}