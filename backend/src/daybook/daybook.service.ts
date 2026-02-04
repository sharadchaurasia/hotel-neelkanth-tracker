import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DaybookEntry } from './daybook-entry.entity';
import { DaybookBalance } from './daybook-balance.entity';
import { DaybookAccessRequest } from './daybook-access-request.entity';
import { Booking } from '../bookings/booking.entity';
import { CreateDaybookEntryDto, SetBalanceDto } from './dto/create-daybook.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DaybookService {
  constructor(
    @InjectRepository(DaybookEntry)
    private entryRepo: Repository<DaybookEntry>,
    @InjectRepository(DaybookBalance)
    private balanceRepo: Repository<DaybookBalance>,
    @InjectRepository(DaybookAccessRequest)
    private accessRepo: Repository<DaybookAccessRequest>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    private auditService: AuditService,
  ) {}

  private getTodayStr(): string {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST offset
    const ist = new Date(now.getTime() + offset);
    return ist.toISOString().split('T')[0];
  }

  async checkDateAccess(userId: number, role: string, date: string): Promise<boolean> {
    if (role === 'admin' || role === 'super_admin') return true;
    const today = this.getTodayStr();
    if (date === today) return true;
    // Check if approved access exists
    const approved = await this.accessRepo.findOne({
      where: { userId, requestedDate: date, status: 'approved' },
    });
    return !!approved;
  }

  async validateDateAccess(userId: number, role: string, date: string): Promise<void> {
    const hasAccess = await this.checkDateAccess(userId, role, date);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to modify daybook for this date. Request access from admin.');
    }
  }

  // Access request methods
  async requestAccess(userId: number, userName: string, date: string, reason?: string) {
    const existing = await this.accessRepo.findOne({
      where: { userId, requestedDate: date, status: 'pending' },
    });
    if (existing) {
      return { success: true, message: 'Request already pending', request: existing };
    }
    const req = this.accessRepo.create({
      userId,
      userName,
      requestedDate: date,
      reason: reason || '',
      status: 'pending',
    });
    const saved = await this.accessRepo.save(req);
    await this.auditService.log({
      userId,
      userName,
      action: 'ACCESS_REQUEST',
      entityType: 'daybook',
      description: `Requested daybook access for ${date}${reason ? ': ' + reason : ''}`,
      newValue: { date, reason },
    });
    return { success: true, request: saved };
  }

  async getPendingRequests() {
    return this.accessRepo.find({
      where: { status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllRequests() {
    return this.accessRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async respondToRequest(
    requestId: number,
    status: 'approved' | 'denied',
    adminId: number,
    adminName: string,
    adminNote?: string,
  ) {
    const req = await this.accessRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') {
      return { success: false, message: 'Request already ' + req.status };
    }
    req.status = status;
    req.respondedBy = adminName;
    req.adminNote = adminNote || '';
    req.respondedAt = new Date();
    await this.accessRepo.save(req);

    await this.auditService.log({
      userId: adminId,
      userName: adminName,
      action: status === 'approved' ? 'ACCESS_APPROVED' : 'ACCESS_DENIED',
      entityType: 'daybook',
      description: `${status === 'approved' ? 'Approved' : 'Denied'} daybook access for ${req.userName} on ${req.requestedDate}`,
      newValue: { requestId, userId: req.userId, userName: req.userName, date: req.requestedDate, status, adminNote },
    });

    return { success: true, request: req };
  }

  async checkAccess(userId: number, role: string, date: string) {
    const hasAccess = await this.checkDateAccess(userId, role, date);
    const today = this.getTodayStr();
    return {
      hasAccess,
      isToday: date === today,
      isAdmin: role === 'admin' || role === 'super_admin',
    };
  }

  async getEntries(date: string): Promise<DaybookEntry[]> {
    return this.entryRepo.find({
      where: { date },
      order: { createdAt: 'ASC' },
    });
  }

  async createEntry(dto: CreateDaybookEntryDto, userId?: number, role?: string): Promise<DaybookEntry> {
    if (userId && role) {
      await this.validateDateAccess(userId, role, dto.date);
    }
    const entry = this.entryRepo.create(dto);
    return this.entryRepo.save(entry);
  }

  async deleteEntry(id: number, userId?: number, role?: string): Promise<void> {
    const entry = await this.entryRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    if (userId && role) {
      await this.validateDateAccess(userId, role, entry.date);
    }
    await this.entryRepo.remove(entry);
  }

  async getBalance(date: string): Promise<DaybookBalance | null> {
    return this.balanceRepo.findOne({ where: { date } });
  }

  async setBalance(dto: SetBalanceDto, userId?: number, role?: string): Promise<DaybookBalance> {
    if (userId && role) {
      await this.validateDateAccess(userId, role, dto.date);
    }
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
    let cashOp = 0;
    let bankOp = 0;

    const explicitBalance = await this.getBalance(date);
    if (explicitBalance) {
      cashOp = Number(explicitBalance.cashOpening) || 0;
      bankOp = Number(explicitBalance.bankSbiOpening) || 0;
    } else {
      // Auto carry-forward: find the most recent date with an explicit balance
      const lastBalance = await this.balanceRepo
        .createQueryBuilder('b')
        .where('b.date < :date', { date })
        .orderBy('b.date', 'DESC')
        .getOne();

      if (lastBalance) {
        // Compute running balance from lastBalance date to the day before requested date
        let runCash = Number(lastBalance.cashOpening) || 0;
        let runBank = Number(lastBalance.bankSbiOpening) || 0;

        const interEntries = await this.entryRepo
          .createQueryBuilder('e')
          .where('e.date >= :from AND e.date < :to', { from: lastBalance.date, to: date })
          .getMany();

        for (const e of interEntries) {
          const amt = Number(e.amount) || 0;
          const src = e.type === 'income' ? (e.receivedIn || e.paymentSource || 'Cash') : (e.paymentSource || 'Cash');
          if (e.type === 'income') {
            if (src === 'Cash') runCash += amt; else runBank += amt;
          } else {
            if (src === 'Cash') runCash -= amt; else runBank -= amt;
          }
        }

        cashOp = runCash;
        bankOp = runBank;
      }
    }

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

  async autoCollect(date: string, userId?: number, role?: string): Promise<{ added: number }> {
    if (userId && role) {
      await this.validateDateAccess(userId, role, date);
    }
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
        const balKey = `${b.bookingId}-Room Rent (Balance)`;
        const collKey = `${b.bookingId}-Room Rent (Collection)`;
        if (!existingKeys.has(balKey) && !existingKeys.has(collKey)) {
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
