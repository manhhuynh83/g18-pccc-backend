import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Thiết lập tiền tố toàn cục /api theo yêu cầu tài liệu nhóm
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Ứng dụng đang chạy tại: http://localhost:${port}/api`);
}
bootstrap();
