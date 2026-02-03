import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KotOrder } from './kot-order.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { AksOfficePayment } from '../bookings/aks-office-payment.entity';
import { KotService } from './kot.service';
import { KotController } from './kot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KotOrder, DaybookEntry, AksOfficePayment])],
  controllers: [KotController],
  providers: [KotService],
})
export class KotModule {}
