import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  // Bật tự động kiểm tra dữ liệu qua DTO
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Cấu hình Swagger theo quy ước nhóm
  const config = new DocumentBuilder()
    .setTitle('G18 PCCC - Role 4 API Engine')
    .setDescription(
      'Hệ thống Storage MinIO, Quản lý thiết bị QR, GPS 200m & Lập lịch kiểm tra',
    )
    .setVersion('1.0')
    .addTag('Storage')
    .addTag('Equipments')
    .addTag('Inspections')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Ứng dụng đang chạy tại: http://localhost:${port}/api`);
  console.log(`Tài liệu Swagger UI: http://localhost:${port}/api/docs`);
}
bootstrap();
