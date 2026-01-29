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
      const advMode = b.paymentMode || 'Other';
      if (advAmt > 0 && advDate && (!from || advDate >= from) && (!to || advDate <= to)) {
        if (!days[advDate]) days[advDate] = { Cash: 0, UPI: 0, Card: 0, 'Bank Transfer': 0, Other: 0, total: 0 };
        const modeKey = days[advDate].hasOwnProperty(advMode) ? advMode : 'Other';
        days[advDate][modeKey] += advAmt;
        days[advDate].total += advAmt;
      }

      const balAmt = Number(b.balanceReceived) || 0;
      const balDate = b.balanceDate || '';
      const balMode = b.balancePaymentMode || 'Other';
      if (balAmt > 0 && balDate && (!from || balDate >= from) && (!to || balDate <= to)) {
        if (!days[balDate]) days[balDate] = { Cash: 0, UPI: 0, Card: 0, 'Bank Transfer': 0, Other: 0, total: 0 };
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
