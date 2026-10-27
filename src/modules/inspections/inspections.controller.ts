import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { RiskLevel } from './facility.entity';
import { InspectionType, InspectionConclusion } from './inspection.entity';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  // POST /api/inspections/facilities - Tạo cơ sở mẫu
  @Post('facilities')
  async createFacility(
    @Body()
    body: {
      name: string;
      riskLevel?: RiskLevel;
      latitude?: number;
      longitude?: number;
      nextInspectionDate?: string;
    },
  ) {
    const data = await this.inspectionsService.createFacility(body);
    return {
      success: true,
      message: 'Tạo cơ sở quản lý PCCC thành công',
      data,
    };
  }

  // GET /api/inspections/facilities - Xem danh sách cơ sở
  @Get('facilities')
  async getFacilities() {
    const data = await this.inspectionsService.getAllFacilities();
    return {
      success: true,
      message: 'Lấy danh sách cơ sở thành công',
      data,
    };
  }

  // POST /api/inspections - Lập lịch kiểm tra (báo trước ít nhất 3 ngày làm việc)
  @Post()
  async schedule(
    @Body()
    body: {
      facilityId: string;
      inspectorId: string;
      inspectionType: InspectionType;
      scheduledDate: string;
    },
  ) {
    const data = await this.inspectionsService.scheduleInspection(body);
    return {
      success: true,
      message: 'Lập lịch kiểm tra PCCC thành công',
      data,
    };
  }

  // GET /api/inspections - Danh sách các đợt kiểm tra
  @Get()
  async findAll(@Query('facilityId') facilityId?: string) {
    const data = await this.inspectionsService.getAllInspections(facilityId);
    return {
      success: true,
      message: 'Lấy danh sách lịch kiểm tra thành công',
      data,
    };
  }

  // PATCH /api/inspections/:id/complete - Hoàn tất biên bản & tính chu kỳ kế tiếp (+6 hoặc +12 tháng)
  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body()
    body: {
      conclusion: InspectionConclusion;
      reportFileUrl?: string;
      checkInLat: number;
      checkInLng: number;
    },
  ) {
    const data = await this.inspectionsService.completeInspection(id, body);
    return {
      success: true,
      message: 'Hoàn tất biên bản và tự động cập nhật chu kỳ kiểm tra kế tiếp',
      data,
    };
  }

  // POST /api/inspections/run-daily-check - Nút kích hoạt kiểm tra quét hạn tức thì phục vụ DEMO
  @Post('run-daily-check')
  async runCheck() {
    const data = await this.inspectionsService.runDailyCheck();
    return {
      success: true,
      message: 'Đã thực hiện quét kiểm tra trạng thái toàn bộ cơ sở thành công',
      data,
    };
  }
}
