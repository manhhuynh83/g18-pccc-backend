import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Minio from 'minio';
import 'multer';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName = process.env.MINIO_BUCKET_NAME || 'pccc-files';

  onModuleInit() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minio_admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'password123',
    });
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; fileName: string }> {
    try {
      const extension = file.originalname.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;

      await this.minioClient.putObject(
        this.bucketName,
        uniqueFileName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      const fileUrl = `http://localhost:9000/${this.bucketName}/${uniqueFileName}`;
      return {
        fileName: uniqueFileName,
        url: fileUrl,
      };
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        'Lỗi khi tải file lên kho MinIO: ' + errorMessage,
      );
    }
  }
}
