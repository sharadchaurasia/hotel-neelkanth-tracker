import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto, CreateAttendanceDto, CreateAdvanceDto, FnfDto } from './dto/create-staff.dto';

@Controller('api')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // Staff
  @Get('staff')
  findAllStaff() {
    return this.staffService.findAllStaff();
  }

  @Post('staff')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.staffService.createStaff(dto);
  }

  @Put('staff/:id')
  updateStaff(@Param('id') id: string, @Body() dto: Partial<CreateStaffDto>) {
    return this.staffService.updateStaff(+id, dto);
  }

  @Post('staff/:id/fnf')
  processFnf(@Param('id') id: string, @Body() dto: FnfDto) {
    return this.staffService.processFnf(+id, dto);
  }

  // Attendance
  @Get('attendance')
  getAttendance(@Query('staffId') staffId: string, @Query('month') month: string) {
    return this.staffService.getAttendance(+staffId, month);
  }

  @Post('attendance')
  markAbsent(@Body() dto: CreateAttendanceDto) {
    return this.staffService.markAbsent(dto);
  }

  @Delete('attendance')
  removeAbsence(@Query('staffId') staffId: string, @Query('date') date: string) {
    return this.staffService.removeAbsence(+staffId, date);
  }

  // Salary Advances
  @Get('advances')
  findAllAdvances() {
    return this.staffService.findAllAdvances();
  }

  @Post('advances')
  createAdvance(@Body() dto: CreateAdvanceDto) {
    return this.staffService.createAdvance(dto);
  }

  @Delete('advances/:id')
  deleteAdvance(@Param('id') id: string) {
    return this.staffService.deleteAdvance(+id);
  }
}
