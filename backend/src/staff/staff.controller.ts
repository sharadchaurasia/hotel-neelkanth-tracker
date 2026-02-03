import { Controller, Get, Post, Put, Delete, Param, Body, Query, ForbiddenException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto, CreateAttendanceDto, CreateAdvanceDto, FnfDto } from './dto/create-staff.dto';
import { RequirePermissions, CurrentUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

@Controller('api')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // Staff
  @Get('staff')
  @RequirePermissions('staff', 'view')
  findAllStaff() {
    return this.staffService.findAllStaff();
  }

  @Post('staff')
  @RequirePermissions('staff', 'create')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.staffService.createStaff(dto);
  }

  @Put('staff/:id')
  @RequirePermissions('staff', 'edit')
  updateStaff(@Param('id') id: string, @Body() dto: Partial<CreateStaffDto>) {
    return this.staffService.updateStaff(+id, dto);
  }

  @Post('staff/:id/fnf')
  @RequirePermissions('staff', 'edit')
  processFnf(@Param('id') id: string, @Body() dto: FnfDto) {
    return this.staffService.processFnf(+id, dto);
  }

  // Attendance
  @Get('attendance')
  @RequirePermissions('salary', 'view')
  getAttendance(@Query('staffId') staffId: string, @Query('month') month: string) {
    return this.staffService.getAttendance(+staffId, month);
  }

  @Post('attendance')
  @RequirePermissions('salary', 'create')
  markAbsent(@Body() dto: CreateAttendanceDto) {
    return this.staffService.markAbsent(dto);
  }

  @Delete('attendance')
  @RequirePermissions('salary', 'delete')
  removeAbsence(@CurrentUser() user: User, @Query('staffId') staffId: string, @Query('date') date: string) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can delete attendance records');
    }
    return this.staffService.removeAbsence(+staffId, date);
  }

  // Salary Advances
  @Get('advances')
  @RequirePermissions('salary', 'view')
  findAllAdvances() {
    return this.staffService.findAllAdvances();
  }

  @Post('advances')
  @RequirePermissions('salary', 'create')
  createAdvance(@Body() dto: CreateAdvanceDto) {
    return this.staffService.createAdvance(dto);
  }

  @Delete('advances/:id')
  @RequirePermissions('salary', 'delete')
  deleteAdvance(@CurrentUser() user: User, @Param('id') id: string) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can delete advance records');
    }
    return this.staffService.deleteAdvance(+id);
  }
}
