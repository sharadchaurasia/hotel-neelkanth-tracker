import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DaybookEntry } from './daybook-entry.entity';
import { DaybookBalance } from './daybook-balance.entity';
import { Booking } from '../bookings/booking.entity';
import { DaybookService } from './daybook.service';
import { DaybookController } from './daybook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DaybookEntry, DaybookBalance, Booking])],
  controllers: [DaybookController],
  providers: [DaybookService],
  exports: [DaybookService],
})
export class DaybookModule {}
