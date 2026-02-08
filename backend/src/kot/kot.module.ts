import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KotOrder } from './kot-order.entity';
import { KotItem } from './kot-item.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { AksOfficePayment } from '../bookings/aks-office-payment.entity';
import { Booking } from '../bookings/booking.entity';
import { KotService } from './kot.service';
import { KotController } from './kot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KotOrder, KotItem, DaybookEntry, AksOfficePayment, Booking])],
  controllers: [KotController],
  providers: [KotService],
  exports: [KotService],
})
export class KotModule {}
