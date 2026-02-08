import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerOpeningBalance } from './ledger-opening-balance.entity';
import { Booking } from './booking.entity';
import { AksOfficePayment } from './aks-office-payment.entity';
import { AgentSettlement } from './agent-settlement.entity';
import { DaybookBalance } from '../daybook/daybook-balance.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { ErrorLogger } from '../common/logger/error-logger';

interface ClosingBalances {
  cash: number;
  bank: number;
  ledgers: {
    agentName: string;
    closingBalance: number;
  }[];
}

interface MonthEndSummary {
  month: string;
  nextMonth: string;
  closingBalances: ClosingBalances;
  success: boolean;
  message: string;
}

@Injectable()
export class MonthEndService {
  constructor(
    @InjectRepository(LedgerOpeningBalance)
    private openingBalanceRepo: Repository<LedgerOpeningBalance>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(AksOfficePayment)
    private aksOfficeRepo: Repository<AksOfficePayment>,
    @InjectRepository(AgentSettlement)
    private settlementRepo: Repository<AgentSettlement>,
    @InjectRepository(DaybookBalance)
    private daybookBalanceRepo: Repository<DaybookBalance>,
    @InjectRepository(DaybookEntry)
    private daybookEntryRepo: Repository<DaybookEntry>,
  ) {}

  /**
   * Get opening balance for a specific agent and month
   */
  async getOpeningBalance(agentName: string, month: string): Promise<number> {
    const opening = await this.openingBalanceRepo.findOne({
      where: { agentName, month },
    });
    return opening ? Number(opening.openingBalance) : 0;
  }

  /**
   * Set opening balance manually (for current month fix)
   */
  async setOpeningBalance(
    agentName: string,
    month: string,
    openingBalance: number,
    notes?: string,
  ): Promise<LedgerOpeningBalance> {
    try {
      let existing = await this.openingBalanceRepo.findOne({
        where: { agentName, month },
      });

      if (existing) {
        existing.openingBalance = openingBalance;
        existing.notes = notes || existing.notes;
        return await this.openingBalanceRepo.save(existing);
      } else {
        const newOpening = this.openingBalanceRepo.create({
          agentName,
          month,
          openingBalance,
          notes,
        });
        return await this.openingBalanceRepo.save(newOpening);
      }
    } catch (error) {
      ErrorLogger.logServiceError('MonthEndService', 'setOpeningBalance', error, {
        agentName,
        month,
        openingBalance,
      });
      throw new InternalServerErrorException('Failed to set opening balance');
    }
  }

  /**
   * Calculate closing balances for a given month
   */
  async calculateClosingBalances(month: string): Promise<ClosingBalances> {
    try {
      // Get last day of month
      const [year, monthNum] = month.split('-').map(Number);
      const lastDay = new Date(year, monthNum, 0).getDate();
      const lastDate = `${month}-${String(lastDay).padStart(2, '0')}`;

      // Calculate Cash & Bank closing
      const { cash, bank } = await this.calculateDaybookClosing(lastDate);

      // Calculate ledger closings
      const ledgers = await this.calculateLedgerClosings(month);

      return { cash, bank, ledgers };
    } catch (error) {
      ErrorLogger.logServiceError('MonthEndService', 'calculateClosingBalances', error, { month });
      throw new InternalServerErrorException('Failed to calculate closing balances');
    }
  }

  /**
   * Calculate daybook cash and bank closing for a specific date
   */
  private async calculateDaybookClosing(date: string): Promise<{ cash: number; bank: number }> {
    // Get opening balance
    let cashOp = 0;
    let bankOp = 0;

    const explicitBalance = await this.daybookBalanceRepo.findOne({ where: { date } });
    if (explicitBalance) {
      cashOp = Number(explicitBalance.cashOpening) || 0;
      bankOp = Number(explicitBalance.bankSbiOpening) || 0;
    } else {
      // Auto carry-forward from previous balance
      const lastBalance = await this.daybookBalanceRepo
        .createQueryBuilder('b')
        .where('b.date < :date', { date })
        .orderBy('b.date', 'DESC')
        .getOne();

      if (lastBalance) {
        let runCash = Number(lastBalance.cashOpening) || 0;
        let runBank = Number(lastBalance.bankSbiOpening) || 0;

        const interEntries = await this.daybookEntryRepo
          .createQueryBuilder('e')
          .where('e.date >= :from AND e.date <= :to', { from: lastBalance.date, to: date })
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

    // Get entries for the date
    const entries = await this.daybookEntryRepo.find({ where: { date } });
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
      cash: cashOp + cashIncome - cashExpense,
      bank: bankOp + bankIncome - bankExpense,
    };
  }

  /**
   * Calculate ledger closing balances for all agents in a month
   */
  private async calculateLedgerClosings(month: string): Promise<{ agentName: string; closingBalance: number }[]> {
    const [year, monthNum] = month.split('-').map(Number);
    const firstDate = `${month}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const lastDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    // Get all unique agents from bookings
    const agentsFromBookings = await this.bookingRepo
      .createQueryBuilder('b')
      .select('DISTINCT b.source_name', 'agentName')
      .where("b.source = 'Agent' AND b.source_name IS NOT NULL AND b.source_name != ''")
      .getRawMany();

    // Add AKS Office
    const allAgents = ['AKS Office', ...agentsFromBookings.map((a: any) => a.agentName)];

    const result = [];

    for (const agentName of allAgents) {
      const closing = await this.calculateAgentLedgerClosing(agentName, month, firstDate, lastDate);
      result.push({ agentName, closingBalance: closing });
    }

    return result;
  }

  /**
   * Calculate closing balance for a specific agent
   */
  private async calculateAgentLedgerClosing(
    agentName: string,
    month: string,
    firstDate: string,
    lastDate: string,
  ): Promise<number> {
    // Get opening balance
    const opening = await this.getOpeningBalance(agentName, month);

    if (agentName === 'AKS Office') {
      // AKS Office calculation
      const payments = await this.aksOfficeRepo
        .createQueryBuilder('a')
        .where('a.date >= :from AND a.date <= :to', { from: firstDate, to: lastDate })
        .getMany();

      const settlements = await this.settlementRepo
        .createQueryBuilder('s')
        .where('s.agent_name = :agent AND s.date >= :from AND s.date <= :to', {
          agent: agentName,
          from: firstDate,
          to: lastDate,
        })
        .getMany();

      const hotelShareTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const settledTotal = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);

      return opening + hotelShareTotal - settledTotal;
    } else {
      // Regular agent calculation
      const bookings = await this.bookingRepo.find({
        where: { sourceName: agentName },
      });

      const settlements = await this.settlementRepo
        .createQueryBuilder('s')
        .where('s.agent_name = :agent AND s.date >= :from AND s.date <= :to', {
          agent: agentName,
          from: firstDate,
          to: lastDate,
        })
        .getMany();

      let pending = 0;
      for (const b of bookings) {
        if (b.paymentType === 'Ledger' && b.checkOut >= firstDate && b.checkOut <= lastDate) {
          const totalReceived = Number(b.advanceReceived || 0) + Number(b.balanceReceived || 0);
          const due = Number(b.totalAmount || 0) - totalReceived;
          if (due > 0) pending += due;
        }
      }

      const settledTotal = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);

      return opening + pending - settledTotal;
    }
  }

  /**
   * Carry forward closing balances to next month as opening balances
   */
  async carryForwardToNextMonth(currentMonth: string): Promise<MonthEndSummary> {
    try {
      // Calculate next month
      const [year, month] = currentMonth.split('-').map(Number);
      const nextDate = new Date(year, month, 1); // month is 0-indexed, so this gives us next month
      const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

      // Calculate closing balances
      const closingBalances = await this.calculateClosingBalances(currentMonth);

      // Set daybook opening balance for next month (first day)
      const nextMonthFirstDay = `${nextMonth}-01`;
      let daybookBalance = await this.daybookBalanceRepo.findOne({ where: { date: nextMonthFirstDay } });

      if (daybookBalance) {
        daybookBalance.cashOpening = closingBalances.cash;
        daybookBalance.bankSbiOpening = closingBalances.bank;
      } else {
        daybookBalance = this.daybookBalanceRepo.create({
          date: nextMonthFirstDay,
          cashOpening: closingBalances.cash,
          bankSbiOpening: closingBalances.bank,
        });
      }
      await this.daybookBalanceRepo.save(daybookBalance);

      // Set ledger opening balances for next month
      for (const ledger of closingBalances.ledgers) {
        await this.setOpeningBalance(
          ledger.agentName,
          nextMonth,
          ledger.closingBalance,
          `Auto carried forward from ${currentMonth}`,
        );
      }

      return {
        month: currentMonth,
        nextMonth,
        closingBalances,
        success: true,
        message: `Successfully closed ${currentMonth} and opened ${nextMonth}`,
      };
    } catch (error) {
      ErrorLogger.logServiceError('MonthEndService', 'carryForwardToNextMonth', error, { currentMonth });
      throw new InternalServerErrorException('Failed to carry forward balances');
    }
  }

  /**
   * Get all opening balances for a specific month
   */
  async getMonthOpeningBalances(month: string): Promise<LedgerOpeningBalance[]> {
    return await this.openingBalanceRepo.find({
      where: { month },
      order: { agentName: 'ASC' },
    });
  }
}
