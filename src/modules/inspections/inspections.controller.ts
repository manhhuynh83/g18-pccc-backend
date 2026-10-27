import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InspectionsService } from './inspections.service';
import { RiskLevel } from './facility.entity';
import {
  InspectionType,
  InspectionStatus,
  InspectionConclusion,
} from './inspection.entity';

@ApiTags('Inspections')
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post('facilities')
  @ApiOperation({ summary: 'Tạo cơ sở quản lý PCCC' })
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

  @Get('facilities')
  @ApiOperation({ summary: 'Danh sách toàn bộ cơ sở' })
  async getFacilities() {
    const data = await this.inspectionsService.getAllFacilities();
    return {
      success: true,
      message: 'Lấy danh sách cơ sở thành công',
      data,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Lập lịch kiểm tra (báo trước >= 3 ngày làm việc nếu PERIODIC)',
  })
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

  @Get()
  @ApiOperation({
    summary:
      'Danh sách lịch kiểm tra (lọc theo cơ sở, trạng thái, khoảng ngày)',
  })
  async findAll(
    @Query('facilityId') facilityId?: string,
    @Query('status') status?: InspectionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.inspectionsService.getAllInspections({
      facilityId,
      status,
      startDate,
      endDate,
    });
    return {
      success: true,
      message: 'Lấy danh sách lịch kiểm tra thành công',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một lịch/biên bản kiểm tra' })
  async findOne(@Param('id') id: string) {
    const data = await this.inspectionsService.getInspectionById(id);
    return {
      success: true,
      message: 'Lấy chi tiết lịch kiểm tra thành công',
      data,
    };
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary:
      'Hoàn tất biên bản & tự động cập nhật chu kỳ kế tiếp (+6 hoặc +12 tháng)',
  })
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

  @Post('run-daily-check')
  @ApiOperation({
    summary: 'Chạy tác vụ quét hạn kiểm tra tức thì (Demo Cronjob)',
  })
  async runCheck() {
    const data = await this.inspectionsService.runDailyCheck();
    return {
      success: true,
      message: 'Đã thực hiện quét kiểm tra trạng thái toàn bộ cơ sở thành công',
      data,
    };
  }
}
