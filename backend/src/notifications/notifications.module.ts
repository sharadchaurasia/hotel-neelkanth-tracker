import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { DaybookModule } from '../daybook/daybook.module';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [BookingsModule, DaybookModule],
  providers: [NotificationsService],
})
export class NotificationsModule {}
