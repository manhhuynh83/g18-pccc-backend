import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EquipmentsService } from './equipments.service';
import { EquipmentStatus } from './equipment.entity';

@ApiTags('Equipments')
@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm thiết bị mới (tự sinh mã QR)' })
  async create(
    @Body()
    body: {
      name: string;
      facilityId: string;
      facilityLat?: number;
      facilityLng?: number;
      expiryDate?: string;
    },
  ) {
    const data = await this.equipmentsService.createEquipment(body);
    return {
      success: true,
      message: 'Tạo thiết bị PCCC thành công',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thiết bị (có lọc theo facilityId)' })
  async findAll(@Query('facilityId') facilityId?: string) {
    const data = await this.equipmentsService.getEquipments(facilityId);
    return {
      success: true,
      message: 'Lấy danh sách thiết bị thành công',
      data,
    };
  }

  @Get(':qrCode')
  @ApiOperation({ summary: 'Tra cứu thông tin thiết bị theo mã QR' })
  async findOne(@Param('qrCode') qrCode: string) {
    const data = await this.equipmentsService.getByQrCode(qrCode);
    return {
      success: true,
      message: 'Tra cứu thiết bị thành công',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Sửa thông tin, cập nhật hạn bảo dưỡng thiết bị' })
  async update(
    @Param('id') id: string,
    @Body()
    body: { name?: string; expiryDate?: string; status?: EquipmentStatus },
  ) {
    const data = await this.equipmentsService.updateEquipment(id, body);
    return {
      success: true,
      message: 'Cập nhật thiết bị thành công',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thiết bị khỏi hệ thống' })
  async delete(@Param('id') id: string) {
    await this.equipmentsService.deleteEquipment(id);
    return {
      success: true,
      message: 'Xóa thiết bị thành công',
      data: null,
    };
  }

  @Post(':qrCode/inspect')
  @ApiOperation({
    summary: 'Quét QR kiểm tra hiện trường & đối chiếu GPS 200m',
  })
  async inspect(
    @Param('qrCode') qrCode: string,
    @Body() body: { status: EquipmentStatus; lat: number; lng: number },
  ) {
    const data = await this.equipmentsService.inspectEquipment(qrCode, body);
    return {
      success: true,
      message: data.isGpsWarning
        ? `Cảnh báo: Vị trí quét lệch ${data.distanceDiffMeter}m so với cơ sở!`
        : 'Ghi nhận kiểm tra thiết bị hợp lệ',
      data,
    };
  }
}
