import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { BookingAddon } from '../bookings/booking-addon.entity';
import { Staff } from '../staff/staff.entity';
import { Attendance } from '../staff/attendance.entity';
import { SalaryAdvance } from '../staff/salary-advance.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingAddon,
      Staff,
      Attendance,
      SalaryAdvance,
      DaybookEntry,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
