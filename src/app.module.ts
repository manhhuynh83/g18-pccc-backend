import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StorageModule } from './modules/storage/storage.module';
import { EquipmentsModule } from './modules/equipments/equipments.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'admin_pccc',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_NAME || 'g18_fire_safety_db',
      autoLoadEntities: true,
      synchronize: true, // Tự động tạo bảng equipments vào DB
    }),
    StorageModule,
    EquipmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}