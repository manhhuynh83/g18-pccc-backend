import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Bật CORS để frontend sau này gọi API thuận tiện
  app.enableCors();
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Ứng dụng đang chạy tại: http://localhost:${port}`);
}
bootstrap();