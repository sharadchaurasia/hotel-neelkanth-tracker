import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingAddon } from './booking-addon.entity';
import { InvoiceCounter } from './invoice-counter.entity';
import { AksOfficePayment } from './aks-office-payment.entity';
import { AgentSettlement } from './agent-settlement.entity';
import { LedgerOpeningBalance } from './ledger-opening-balance.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { DaybookBalance } from '../daybook/daybook-balance.entity';
import { BookingsService } from './bookings.service';
import { InvoiceService } from './invoice.service';
import { MonthEndService } from './month-end.service';
import { BookingsController } from './bookings.controller';
import { MonthEndController } from './month-end.controller';
import { KotModule } from '../kot/kot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingAddon,
      InvoiceCounter,
      AksOfficePayment,
      AgentSettlement,
      LedgerOpeningBalance,
      DaybookEntry,
      DaybookBalance,
    ]),
    KotModule,
  ],
  controllers: [BookingsController, MonthEndController],
  providers: [BookingsService, InvoiceService, MonthEndService],
  exports: [BookingsService, MonthEndService, TypeOrmModule],
})
export class BookingsModule {}
