import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DaybookEntry } from './daybook-entry.entity';
import { DaybookBalance } from './daybook-balance.entity';
import { Booking } from '../bookings/booking.entity';
import { CreateDaybookEntryDto, SetBalanceDto } from './dto/create-daybook.dto';

@Injectable()
export class DaybookService {
  constructor(
    @InjectRepository(DaybookEntry)
    private entryRepo: Repository<DaybookEntry>,
    @InjectRepository(DaybookBalance)
    private balanceRepo: Repository<DaybookBalance>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  async getEntries(date: string): Promise<DaybookEntry[]> {
    return this.entryRepo.find({
      where: { date },
      order: { createdAt: 'ASC' },
    });
  }

  async createEntry(dto: CreateDaybookEntryDto): Promise<DaybookEntry> {
    const entry = this.entryRepo.create(dto);
    return this.entryRepo.save(entry);
  }

  async deleteEntry(id: number): Promise<void> {
    const entry = await this.entryRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    await this.entryRepo.remove(entry);
  }

  async getBalance(date: string): Promise<DaybookBalance | null> {
    return this.balanceRepo.findOne({ where: { date } });
  }

  async setBalance(dto: SetBalanceDto): Promise<DaybookBalance> {
    let balance = await this.balanceRepo.findOne({ where: { date: dto.date } });
    if (balance) {
      balance.cashOpening = dto.cashOpening;
      balance.bankSbiOpening = dto.bankSbiOpening;
    } else {
      balance = this.balanceRepo.create(dto);
    }
    return this.balanceRepo.save(balance);
  }

  async getClosing(date: string): Promise<any> {
    const balance = await this.getBalance(date) || { cashOpening: 0, bankSbiOpening: 0 };
    const entries = await this.entryRepo.find({ where: { date } });

    let cashIncome = 0, bankIncome = 0, cashExpense = 0, bankExpense = 0;

    for (const e of entries) {
      const amt = Number(e.amount) || 0;
      const src = e.type === 'income' ? (e.receivedIn || e.paymentSource || 'Cash') : (e.paymentSource || 'Cash');
      if (e.type === 'income') {
        if (src === 'Cash') cashIncome += amt;
        else bankIncome += amt;
      } else {
        if (src === 'Cash') cashExpense += amt;
        else bankExpense += amt;
      }
    }

    const cashOp = Number(balance.cashOpening) || 0;
    const bankOp = Number(balance.bankSbiOpening) || 0;

    return {
      cashOpening: cashOp,
      bankOpening: bankOp,
      cashIncome,
      bankIncome,
      cashExpense,
      bankExpense,
      cashClosing: cashOp + cashIncome - cashExpense,
      bankClosing: bankOp + bankIncome - bankExpense,
    };
  }

  async autoCollect(date: string): Promise<{ added: number }> {
    const existingEntries = await this.entryRepo.find({ where: { date } });
    const existingKeys = new Set(
      existingEntries
        .filter(e => e.refBookingId)
        .map(e => `${e.refBookingId}-${e.incomeSource || ''}`),
    );

    const bookings = await this.bookingRepo.find();
    let added = 0;
    const newEntries: Partial<DaybookEntry>[] = [];

    for (const b of bookings) {
      if (b.status === 'CANCELLED') continue;

      const advAmt = Number(b.advanceReceived) || 0;
      if (advAmt > 0 && b.advanceDate === date) {
        const key = `${b.bookingId}-Room Rent (Advance)`;
        if (!existingKeys.has(key)) {
          newEntries.push({
            date,
            type: 'income',
            category: 'Room Rent',
            incomeSource: 'Room Rent (Advance)',
            description: `Advance - ${b.guestName}`,
            amount: advAmt,
            paymentSource: (b.paymentMode === 'Cash' || !b.paymentMode) ? 'Cash' : 'Bank Transfer',
            paymentMode: b.paymentMode || 'Cash',
            receivedIn: (b.paymentMode === 'Cash' || !b.paymentMode) ? 'Cash' : 'Bank Transfer',
            refBookingId: b.bookingId,
            guestName: b.guestName,
          });
          added++;
        }
      }

      const balAmt = Number(b.balanceReceived) || 0;
      if (balAmt > 0 && b.balanceDate === date) {
        const key = `${b.bookingId}-Room Rent (Balance)`;
        if (!existingKeys.has(key)) {
          newEntries.push({
            date,
            type: 'income',
            category: 'Room Rent',
            incomeSource: 'Room Rent (Balance)',
            description: `Balance - ${b.guestName}`,
            amount: balAmt,
            paymentSource: (b.balancePaymentMode === 'Cash' || !b.balancePaymentMode) ? 'Cash' : 'Bank Transfer',
            paymentMode: b.balancePaymentMode || 'Cash',
            receivedIn: (b.balancePaymentMode === 'Cash' || !b.balancePaymentMode) ? 'Cash' : 'Bank Transfer',
            refBookingId: b.bookingId,
            guestName: b.guestName,
          });
          added++;
        }
      }
    }

    if (newEntries.length > 0) {
      await this.entryRepo.save(newEntries.map(e => this.entryRepo.create(e)));
    }

    return { added };
  }
}
