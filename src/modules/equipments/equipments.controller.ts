import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { EquipmentStatus } from './equipment.entity';

@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  // POST /api/equipments - Thêm thiết bị mới
  @Post()
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

  // GET /api/equipments?facilityId= - Danh sách thiết bị
  @Get()
  async findAll(@Query('facilityId') facilityId?: string) {
    const data = await this.equipmentsService.getEquipments(facilityId);
    return {
      success: true,
      message: 'Lấy danh sách thiết bị thành công',
      data,
    };
  }

  // GET /api/equipments/:qrCode - Tra cứu theo mã QR
  @Get(':qrCode')
  async findOne(@Param('qrCode') qrCode: string) {
    const data = await this.equipmentsService.getByQrCode(qrCode);
    return {
      success: true,
      message: 'Tra cứu thiết bị thành công',
      data,
    };
  }

  // POST /api/equipments/:qrCode/inspect - Kiểm tra thiết bị & phát hiện lệch GPS 200m
  @Post(':qrCode/inspect')
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
