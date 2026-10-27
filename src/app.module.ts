import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StorageModule } from './modules/storage/storage.module';
import { EquipmentsModule } from './modules/equipments/equipments.module';
import { Equipment } from './modules/equipments/equipment.entity';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { Facility } from './modules/inspections/facility.entity';
import { Inspection } from './modules/inspections/inspection.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Kích hoạt Cronjob
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'admin_pccc',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_NAME || 'g18_fire_safety_db',
      entities: [Equipment, Facility, Inspection],
      synchronize: true, // Tự động tạo bảng facilities và inspections
    }),
    StorageModule,
    EquipmentsModule,
    InspectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
