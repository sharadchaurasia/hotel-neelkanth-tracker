import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { Staff } from '../staff/staff.entity';
import { Attendance } from '../staff/attendance.entity';
import { SalaryAdvance } from '../staff/salary-advance.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Staff) private staffRepo: Repository<Staff>,
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
    @InjectRepository(SalaryAdvance) private advanceRepo: Repository<SalaryAdvance>,
    @InjectRepository(DaybookEntry) private daybookRepo: Repository<DaybookEntry>,
  ) {}

  async getSourceReport(from: string, to: string) {
    const bookings = await this.bookingRepo.find({ relations: ['addOns'] });
    const sources: Record<string, { bookings: number; totalAmount: number; collected: number; pending: number }> = {};

    for (const b of bookings) {
      if (from && b.checkOut < from) continue;
      if (to && b.checkOut > to) continue;

      const src = b.source || 'Unknown';
      const srcName = b.sourceName ? `${src} - ${b.sourceName}` : src;
      if (!sources[srcName]) sources[srcName] = { bookings: 0, totalAmount: 0, collected: 0, pending: 0 };

      const total = Number(b.totalAmount) || 0;
      const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
      const pend = total - recv;

      sources[srcName].bookings++;
      sources[srcName].totalAmount += total;
      sources[srcName].collected += recv;
      if (pend > 0) sources[srcName].pending += pend;
    }

    return sources;
  }

  async getPaymentReport(from: string, to: string) {
    const bookings = await this.bookingRepo.find();
    const days: Record<string, Record<string, number>> = {};

    for (const b of bookings) {
      if (b.status === 'CANCELLED') continue;

      const advAmt = Number(b.advanceReceived) || 0;
      const advDate = b.advanceDate || '';
      let advMode = b.paymentMode || 'Other';
      if (advMode === 'UPI' || advMode === 'SBI Neelkanth') advMode = 'Bank Transfer';
      if (advAmt > 0 && advDate && (!from || advDate >= from) && (!to || advDate <= to)) {
        if (!days[advDate]) days[advDate] = { Cash: 0, Card: 0, 'Bank Transfer': 0, Other: 0, total: 0 };
        const modeKey = days[advDate].hasOwnProperty(advMode) ? advMode : 'Other';
        days[advDate][modeKey] += advAmt;
        days[advDate].total += advAmt;
      }

      const balAmt = Number(b.balanceReceived) || 0;
      const balDate = b.balanceDate || '';
      let balMode = b.balancePaymentMode || 'Other';
      if (balMode === 'UPI' || balMode === 'SBI Neelkanth') balMode = 'Bank Transfer';
      if (balAmt > 0 && balDate && (!from || balDate >= from) && (!to || balDate <= to)) {
        if (!days[balDate]) days[balDate] = { Cash: 0, Card: 0, 'Bank Transfer': 0, Other: 0, total: 0 };
        const modeKey = days[balDate].hasOwnProperty(balMode) ? balMode : 'Other';
        days[balDate][modeKey] += balAmt;
        days[balDate].total += balAmt;
      }
    }

    return days;
  }

  async getMonthlyReport(month: string) {
    const bookings = await this.bookingRepo.find({ relations: ['addOns'] });
    const dates: Record<string, { bookings: number; totalAmount: number; collected: number; pending: number; guests: string[] }> = {};

    for (const b of bookings) {
      if (!b.checkOut || b.checkOut.substring(0, 7) !== month) continue;
      const dt = b.checkOut;
      if (!dates[dt]) dates[dt] = { bookings: 0, totalAmount: 0, collected: 0, pending: 0, guests: [] };

      const total = Number(b.totalAmount) || 0;
      const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
      const pend = total - recv;

      dates[dt].bookings++;
      dates[dt].totalAmount += total;
      dates[dt].collected += recv;
      if (pend > 0) dates[dt].pending += pend;
      dates[dt].guests.push(b.guestName);
    }

    return dates;
  }

  async getLedgerReport(agent: string, from: string, to: string) {
    const qb = this.bookingRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.addOns', 'addons')
      .where("b.status != 'CANCELLED'")
      .andWhere("(b.source = 'Agent' OR b.source = 'OTA')");

    if (agent) qb.andWhere('b.source_name = :agent', { agent });
    if (from) qb.andWhere('b.check_in >= :from', { from });
    if (to) qb.andWhere('b.check_out <= :to', { to });

    return qb.getMany();
  }

  async getOccupancyReport(type: string, month: string, year: string) {
    const ALL_ROOMS = [
      '101','102','103','104','105',
      '201','202','203','204','205','206',
      '301','302','303','304','305','306',
      '401','402','403',
    ];

    let startDate: string, endDate: string;
    if (type === 'month' && month) {
      const [y, m] = month.split('-').map(Number);
      startDate = `${month}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
    } else if (type === 'year' && year) {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      return { totalSlots: 0, totalOccupied: 0, occupancyPct: 0, agentOccupied: {} };
    }

    const bookings = await this.bookingRepo.find();
    const dates: string[] = [];
    let dt = startDate;
    let safety = 0;
    while (dt <= endDate && safety < 400) {
      dates.push(dt);
      const next = new Date(dt + 'T00:00:00');
      next.setDate(next.getDate() + 1);
      dt = next.toISOString().split('T')[0];
      safety++;
    }

    const totalSlots = ALL_ROOMS.length * dates.length;
    let totalOccupied = 0;
    const agentOccupied: Record<string, number> = {};

    for (const d of dates) {
      for (const rm of ALL_ROOMS) {
        const bk = bookings.find(b => {
          if (b.status === 'CANCELLED') return false;
          const bRooms = (b.roomNo || '').split(',').map(r => r.trim());
          if (!bRooms.includes(rm)) return false;
          return b.checkIn <= d && b.checkOut > d;
        });
        if (bk) {
          totalOccupied++;
          let agentKey = 'Walk-in';
          if (bk.source === 'Agent' || bk.source === 'OTA') {
            agentKey = bk.sourceName || bk.source;
          }
          agentOccupied[agentKey] = (agentOccupied[agentKey] || 0) + 1;
        }
      }
    }

    return {
      totalSlots,
      totalOccupied,
      occupancyPct: totalSlots > 0 ? ((totalOccupied / totalSlots) * 100).toFixed(1) : '0.0',
      agentOccupied,
    };
  }

  async getSalaryReport(month: string) {
    const staff = await this.staffRepo.find({ where: { status: 'active' }, order: { createdAt: 'ASC' } });
    const advances = await this.advanceRepo.find();
    const daybookEntries = await this.daybookRepo.find({ where: { type: 'expense', category: 'Salary' } });
    const today = new Date().toISOString().split('T')[0];

    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();

    const paidSalaries: Record<string, Record<string, number>> = {};
    for (const e of daybookEntries) {
      if (e.employeeId) {
        const payMonth = e.date ? e.date.substring(0, 7) : '';
        if (!paidSalaries[e.employeeId]) paidSalaries[e.employeeId] = {};
        paidSalaries[e.employeeId][payMonth] = (paidSalaries[e.employeeId][payMonth] || 0) + (Number(e.amount) || 0);
      }
    }

    const result = [];
    for (const s of staff) {
      const attendance = await this.attendanceRepo
        .createQueryBuilder('a')
        .where('a.staff_id = :staffId', { staffId: s.id })
        .andWhere("TO_CHAR(a.date, 'YYYY-MM') = :month", { month })
        .andWhere('a.absent = true')
        .getMany();

      let lastCountDay = `${month}-${String(daysInMonth).padStart(2, '0')}`;
      if (lastCountDay > today) lastCountDay = today;

      let countableDays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${month}-${String(d).padStart(2, '0')}`;
        if (ds <= lastCountDay) countableDays++;
      }

      const absentDays = attendance.length;
      const presentDays = countableDays - absentDays;
      const salary = Number(s.salary) || 0;
      const perDay = Math.round(salary / daysInMonth);
      const gross = Math.round(perDay * presentDays);

      let totalAdvance = 0;
      for (const adv of advances) {
        if (adv.staffId === s.id && adv.deductMonth === month && !adv.deducted) {
          totalAdvance += Number(adv.amount) || 0;
        }
      }

      let net = gross - totalAdvance;
      if (net < 0) net = 0;

      const empId = String(s.id);
      const isPaid = paidSalaries[empId]?.[month] >= net;

      result.push({
        staff: s,
        daysInMonth,
        presentDays,
        absentDays,
        perDay,
        gross,
        totalAdvance,
        net,
        isPaid,
      });
    }

    return result;
  }

  async getSummaryData(from: string, to: string) {
    const bookings = await this.bookingRepo.find({ relations: ['addOns'] });
    return bookings
      .filter(b => {
        if (b.status === 'CANCELLED') return false;
        return b.checkOut && b.checkOut >= from && b.checkOut <= to;
      })
      .sort((a, b) => {
        if (a.checkOut < b.checkOut) return -1;
        if (a.checkOut > b.checkOut) return 1;
        return 0;
      });
  }

  async getPnlReport(from: string, to: string) {
    // --- INCOME ---
    const bookings = await this.bookingRepo.find({ relations: ['addOns'] });
    const daybookEntries = await this.daybookRepo.find();

    const incomeCategories: Record<string, { cash: number; bank: number }> = {
      'Room Rent': { cash: 0, bank: 0 },
      'KOT': { cash: 0, bank: 0 },
      'Add-On': { cash: 0, bank: 0 },
      'Other': { cash: 0, bank: 0 },
    };

    // Income from daybook entries in the date range
    for (const e of daybookEntries) {
      if (e.type !== 'income') continue;
      if (!e.date || e.date < from || e.date > to) continue;

      const amt = Number(e.amount) || 0;
      let src = e.receivedIn || e.paymentSource || 'Cash';
      if (src === 'UPI' || src === 'SBI Neelkanth') src = 'Bank Transfer';
      const isCash = src === 'Cash';

      let cat = e.category || 'Other';
      if (cat === 'Room Rent') {
        // keep as Room Rent
      } else if (cat === 'KOT') {
        cat = 'KOT';
      } else if (cat === 'Other Collection' || cat === 'Other') {
        cat = 'Other';
      } else {
        cat = 'Other';
      }

      if (!incomeCategories[cat]) incomeCategories[cat] = { cash: 0, bank: 0 };
      if (isCash) incomeCategories[cat].cash += amt;
      else incomeCategories[cat].bank += amt;
    }

    // Add-On income from bookings (checkout in range)
    for (const b of bookings) {
      if (b.status === 'CANCELLED') continue;
      if (!b.checkOut || b.checkOut < from || b.checkOut > to) continue;

      if (b.addOns && b.addOns.length > 0) {
        for (const addon of b.addOns) {
          const amt = Number(addon.amount) || 0;
          if (amt > 0) {
            // Add-on payment mode follows the last payment mode of booking
            let mode = b.balancePaymentMode || b.paymentMode || 'Cash';
            if (mode === 'UPI' || mode === 'SBI Neelkanth') mode = 'Bank Transfer';
            const isCash = mode === 'Cash';
            if (isCash) incomeCategories['Add-On'].cash += amt;
            else incomeCategories['Add-On'].bank += amt;
          }
        }
      }
    }

    // Calculate total income
    let totalIncomeCash = 0, totalIncomeBank = 0;
    for (const cat of Object.keys(incomeCategories)) {
      totalIncomeCash += incomeCategories[cat].cash;
      totalIncomeBank += incomeCategories[cat].bank;
    }

    // --- EXPENSES ---
    const expenseCategories: Record<string, { cash: number; bank: number }> = {};
    const EXPENSE_CATS = ['Electricity', 'Salary', 'Grocery', 'Maintenance', 'Fuel', 'Cylinder',
      'Laundry', 'Recharges', 'Garbage', 'Deco Items', 'Staff Meal', 'Bakery', 'Housekeeping', 'Butchery', 'Others'];

    for (const cat of EXPENSE_CATS) {
      expenseCategories[cat] = { cash: 0, bank: 0 };
    }

    for (const e of daybookEntries) {
      if (e.type !== 'expense') continue;
      if (!e.date || e.date < from || e.date > to) continue;

      const amt = Number(e.amount) || 0;
      let src = e.paymentSource || 'Cash';
      if (src === 'UPI' || src === 'SBI Neelkanth') src = 'Bank Transfer';
      const isCash = src === 'Cash';

      let cat = e.category || 'Others';
      if (!expenseCategories[cat]) cat = 'Others';
      if (isCash) expenseCategories[cat].cash += amt;
      else expenseCategories[cat].bank += amt;
    }

    let totalExpenseCash = 0, totalExpenseBank = 0;
    for (const cat of Object.keys(expenseCategories)) {
      totalExpenseCash += expenseCategories[cat].cash;
      totalExpenseBank += expenseCategories[cat].bank;
    }

    // --- LEASE ---
    // FY 2026-27 (Apr 2026 - Mar 2027): 3,50,000/month
    // FY 2027-28 to FY 2029-30: 3,75,000/month
    const leasePerMonth = this.getLeaseForRange(from, to);

    // --- ROOM NIGHTS SOLD (for ARR) ---
    let totalRoomRevenue = 0;
    let totalRoomNightsSold = 0;

    for (const b of bookings) {
      if (b.status === 'CANCELLED') continue;
      if (!b.checkOut || b.checkOut < from || b.checkOut > to) continue;

      const rooms = (b.roomNo || '').split(',').map(r => r.trim()).filter(r => r);
      const checkIn = new Date(b.checkIn + 'T00:00:00');
      const checkOut = new Date(b.checkOut + 'T00:00:00');
      const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      const roomNights = nights * (rooms.length || 1);

      totalRoomNightsSold += roomNights;
      totalRoomRevenue += Number(b.actualRoomRent) || Number(b.totalAmount) || 0;
    }

    const arr = totalRoomNightsSold > 0 ? Math.round(totalRoomRevenue / totalRoomNightsSold) : 0;

    const totalOperationalExpense = totalExpenseCash + totalExpenseBank;
    const grandTotalExpense = totalOperationalExpense + leasePerMonth.totalLease;
    const totalIncome = totalIncomeCash + totalIncomeBank;
    const profitLoss = totalIncome - grandTotalExpense;

    return {
      income: incomeCategories,
      totalIncome: { cash: totalIncomeCash, bank: totalIncomeBank, total: totalIncome },
      expenses: expenseCategories,
      totalOperationalExpense: { cash: totalExpenseCash, bank: totalExpenseBank, total: totalOperationalExpense },
      lease: leasePerMonth,
      grandTotalExpense,
      profitLoss,
      arr,
      totalRoomRevenue,
      totalRoomNightsSold,
    };
  }

  private getLeaseForRange(from: string, to: string): { totalLease: number; monthlyBreakdown: { month: string; amount: number }[] } {
    const startDate = new Date(from + 'T00:00:00');
    const endDate = new Date(to + 'T00:00:00');
    const breakdown: { month: string; amount: number }[] = [];
    let totalLease = 0;

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      const y = current.getFullYear();
      const m = current.getMonth(); // 0-indexed

      // Determine FY: Apr(3) to Mar(2)
      // FY 2026-27: Apr 2026 (y=2026,m=3) to Mar 2027 (y=2027,m=2)
      let fyStart: number;
      if (m >= 3) {
        fyStart = y; // Apr-Dec of year Y => FY Y-(Y+1)
      } else {
        fyStart = y - 1; // Jan-Mar of year Y => FY (Y-1)-Y
      }

      let monthlyLease: number;
      if (fyStart <= 2026) {
        monthlyLease = 350000; // 3,50,000/month for FY 2026-27 and before
      } else {
        monthlyLease = 375000; // 3,75,000/month for FY 2027-28 onwards
      }

      const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
      breakdown.push({ month: monthStr, amount: monthlyLease });
      totalLease += monthlyLease;

      current.setMonth(current.getMonth() + 1);
    }

    return { totalLease, monthlyBreakdown: breakdown };
  }

  async getPnlTable(from: string, to: string) {
    const ALL_ROOMS = [
      '101','102','103','104','105',
      '201','202','203','204','205','206',
      '301','302','303','304','305','306',
      '401','402','403',
    ];
    const ROOM_COUNT = ALL_ROOMS.length;

    const bookings = await this.bookingRepo.find({ relations: ['addOns'] });
    const daybookEntries = await this.daybookRepo.find();

    // Build list of months in range
    const startDate = new Date(from + 'T00:00:00');
    const endDate = new Date(to + 'T00:00:00');
    const months: string[] = [];
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cur <= endDate) {
      months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
      cur.setMonth(cur.getMonth() + 1);
    }

    const EXPENSE_CATS = ['Grocery', 'Electricity', 'Cylinder', 'Salary', 'Maintenance', 'Fuel', 'Laundry',
      'Recharges', 'Garbage', 'Deco Items', 'Staff Meal', 'Bakery', 'Housekeeping', 'Butchery'];

    const result = [];

    for (const monthStr of months) {
      const [yr, mo] = monthStr.split('-').map(Number);
      const daysInMonth = new Date(yr, mo, 0).getDate();
      const firstDay = `${monthStr}-01`;
      const lastDay = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
      const totalRoomNights = ROOM_COUNT * daysInMonth;

      // --- OCCUPANCY ---
      let occupiedNights = 0;
      let totalPaxNights = 0;

      for (const b of bookings) {
        if (b.status === 'CANCELLED') continue;
        if (!b.checkIn || !b.checkOut) continue;
        if (b.checkOut <= firstDay || b.checkIn > lastDay) continue;

        const rooms = (b.roomNo || '').split(',').map(r => r.trim()).filter(r => r);
        const roomCount = rooms.length || 1;

        // Overlap: nights where checkIn <= day < checkOut, within this month
        const overlapStart = b.checkIn > firstDay ? b.checkIn : firstDay;
        const overlapEnd = b.checkOut <= lastDay ? b.checkOut : `${yr}-${String(mo + 1 > 12 ? 1 : mo + 1).padStart(2, '0')}-01`;

        const s = new Date(overlapStart + 'T00:00:00');
        const e = new Date(overlapEnd + 'T00:00:00');
        const nightsInMonth = Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));

        occupiedNights += nightsInMonth * roomCount;
        totalPaxNights += nightsInMonth * (b.pax || 1);
      }

      // --- INCOME from daybook ---
      const monthEntries = daybookEntries.filter(
        e => e.date && e.date >= firstDay && e.date <= lastDay,
      );

      let roomSale = 0, kotIncome = 0, otherIncome = 0;
      for (const e of monthEntries) {
        if (e.type !== 'income') continue;
        const amt = Number(e.amount) || 0;
        if (e.category === 'Room Rent') roomSale += amt;
        else if (e.category === 'KOT') kotIncome += amt;
        else otherIncome += amt;
      }
      const totalIncome = roomSale + kotIncome + otherIncome;

      // --- EXPENSES from daybook ---
      const expenseMap: Record<string, number> = {};
      for (const cat of EXPENSE_CATS) expenseMap[cat] = 0;

      for (const e of monthEntries) {
        if (e.type !== 'expense') continue;
        const amt = Number(e.amount) || 0;
        const cat = e.category || 'Maintenance';
        if (expenseMap.hasOwnProperty(cat)) {
          expenseMap[cat] += amt;
        } else {
          // Unknown category — add as its own entry
          expenseMap[cat] = (expenseMap[cat] || 0) + amt;
        }
      }

      let totalExpenses = 0;
      for (const cat of Object.keys(expenseMap)) totalExpenses += expenseMap[cat];

      // --- LEASE ---
      let fyStart: number;
      if (mo >= 4) fyStart = yr;
      else fyStart = yr - 1;
      const lease = fyStart <= 2026 ? 350000 : 375000;

      const grandTotalExpense = totalExpenses + lease;
      const profitLoss = totalIncome - grandTotalExpense;
      const arr = occupiedNights > 0 ? Math.round(roomSale / occupiedNights) : 0;
      const perPersonMealCost = totalPaxNights > 0 ? Math.round(expenseMap['Grocery'] / totalPaxNights) : 0;

      result.push({
        month: monthStr,
        totalRooms: totalRoomNights,
        occupancy: occupiedNights,
        vacant: totalRoomNights - occupiedNights,
        occupancyPct: totalRoomNights > 0 ? Math.round((occupiedNights / totalRoomNights) * 100) : 0,
        roomSale,
        kotIncome,
        otherIncome,
        totalIncome,
        expenses: expenseMap,
        totalExpenses,
        lease,
        grandTotalExpense,
        profitLoss,
        arr,
        totalPaxNights,
        perPersonMealCost,
      });
    }

    return result;
  }

  async getInventoryData(month: string) {
    const ALL_ROOMS = [
      '101','102','103','104','105',
      '201','202','203','204','205','206',
      '301','302','303','304','305','306',
      '401','402','403',
    ];

    const ROOM_TYPE: Record<string, string> = {
      '101':'Non-Balcony','102':'Non-Balcony','104':'Non-Balcony','105':'Non-Balcony',
      '201':'Non-Balcony','202':'Non-Balcony','206':'Non-Balcony','303':'Non-Balcony',
      '103':'Balcony','203':'Balcony','204':'Balcony','205':'Balcony',
      '301':'Balcony','302':'Balcony','305':'Balcony','306':'Balcony',
      '304':'Mini Family','401':'Mini Family',
      '402':'Royal Suite Duplex','403':'Royal Suite Duplex',
    };

    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push(`${month}-${String(d).padStart(2, '0')}`);
    }

    const bookings = await this.bookingRepo.find();

    const grid = ALL_ROOMS.map(rm => {
      const row: { room: string; type: string; days: { date: string; occupied: boolean; guest: string; pax: number }[] } = {
        room: rm,
        type: ROOM_TYPE[rm] || '',
        days: [],
      };

      for (const dt of dates) {
        const bk = bookings.find(b => {
          if (b.status === 'CANCELLED') return false;
          const bRooms = (b.roomNo || '').split(',').map(r => r.trim());
          if (!bRooms.includes(rm)) return false;
          return b.checkIn <= dt && b.checkOut > dt;
        });

        row.days.push({
          date: dt,
          occupied: !!bk,
          guest: bk ? bk.guestName : '',
          pax: bk ? (bk.pax || 1) : 0,
        });
      }

      return row;
    });

    return { rooms: ALL_ROOMS, roomTypes: ROOM_TYPE, dates, grid };
  }
}
