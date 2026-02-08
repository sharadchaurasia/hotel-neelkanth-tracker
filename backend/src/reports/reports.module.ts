import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { BookingAddon } from '../bookings/booking-addon.entity';
import { Staff } from '../staff/staff.entity';
import { Attendance } from '../staff/attendance.entity';
import { SalaryAdvance } from '../staff/salary-advance.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { BookingsModule } from '../bookings/bookings.module';
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
    forwardRef(() => BookingsModule),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
