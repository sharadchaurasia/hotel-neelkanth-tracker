import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingAddon } from './booking-addon.entity';
import { InvoiceCounter } from './invoice-counter.entity';
import { AksOfficePayment } from './aks-office-payment.entity';
import { AgentSettlement } from './agent-settlement.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { BookingsService } from './bookings.service';
import { InvoiceService } from './invoice.service';
import { BookingsController } from './bookings.controller';
import { KotModule } from '../kot/kot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingAddon, InvoiceCounter, AksOfficePayment, AgentSettlement, DaybookEntry]),
    KotModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, InvoiceService],
  exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}
