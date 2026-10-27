import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để tải lên');
    }

    // 1. Kiểm tra dung lượng tối đa 10 MB (10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File không hợp lệ hoặc quá 10 MB');
    }

    // 2. Kiểm tra định dạng cho phép: jpg, png, webp, pdf
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File không hợp lệ hoặc quá 10 MB');
    }

    // 3. Tiến hành upload
    const result = await this.storageService.uploadFile(file);

    // 4. Trả về đúng định dạng chuẩn của nhóm
    return {
      success: true,
      message: 'Tải file lên thành công',
      data: {
        url: result.url,
        fileName: result.fileName,
        size: file.size,
        contentType: file.mimetype,
      },
    };
  }
}
