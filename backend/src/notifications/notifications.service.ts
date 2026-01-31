import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(DaybookEntry)
    private daybookRepo: Repository<DaybookEntry>,
  ) {}

  private formatCurrency(n: number): string {
    return '\u20B9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // 16:30 UTC = 10:00 PM IST
  @Cron('30 16 * * *')
  async sendDailySummary(): Promise<void> {
    const recipients = process.env.SUMMARY_EMAILS;
    if (!recipients) {
      this.logger.warn('SUMMARY_EMAILS not configured, skipping daily summary');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      this.logger.log(`Generating daily summary for ${today}`);

      // Fetch today's daybook entries
      const daybookEntries = await this.daybookRepo.find({ where: { date: today } });

      // Calculate collection by payment mode
      let cashCollection = 0;
      let cardCollection = 0;
      let bankCollection = 0;
      let totalIncome = 0;
      let totalExpense = 0;

      for (const entry of daybookEntries) {
        const amt = Number(entry.amount) || 0;
        if (entry.type === 'income') {
          totalIncome += amt;
          const mode = (entry.receivedIn || entry.paymentMode || 'Cash').toLowerCase();
          if (mode === 'cash') cashCollection += amt;
          else if (mode === 'card') cardCollection += amt;
          else bankCollection += amt;
        } else {
          totalExpense += amt;
        }
      }

      // Fetch all active bookings to compute occupancy and check-in/out
      const allBookings = await this.bookingRepo.find();

      let checkinCount = 0;
      let checkoutCount = 0;
      let occupiedRooms = 0;
      let pendingBalances = 0;
      const pendingGuests: { name: string; amount: number }[] = [];

      for (const b of allBookings) {
        if (b.status === 'CANCELLED') continue;
        if (b.checkIn === today) checkinCount++;
        if (b.checkOut === today) checkoutCount++;

        // Occupied: checked in or staying today
        if ((b.checkedIn && b.checkIn <= today && b.checkOut > today) ||
            (!b.checkedIn && b.checkIn < today && b.checkOut > today) ||
            (b.checkIn === today && !b.checkedOut)) {
          occupiedRooms += (b.noOfRooms || 1);
        }

        // Pending balance for today's checkouts
        if (b.checkOut === today && !b.checkedOut) {
          const totalReceived = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
          const pending = (Number(b.totalAmount) || 0) - totalReceived;
          if (pending > 0) {
            pendingBalances += pending;
            pendingGuests.push({ name: b.guestName, amount: pending });
          }
        }
      }

      const totalRooms = 20; // Hotel has 20 rooms
      const occupancyPct = Math.round((occupiedRooms / totalRooms) * 100);

      // Build pending guests rows
      const pendingRows = pendingGuests.map(g =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${g.name}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#ef4444">${this.formatCurrency(g.amount)}</td></tr>`
      ).join('');

      // Build daybook entry rows
      const entryRows = daybookEntries.map(e => {
        const amt = Number(e.amount) || 0;
        return `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${e.type === 'income' ? 'Income' : 'Expense'}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${e.category || '-'}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${e.description || '-'}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${e.receivedIn || e.paymentMode || '-'}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${e.type === 'income' ? '#10b981' : '#ef4444'}">${this.formatCurrency(amt)}</td>
        </tr>`;
      }).join('');

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#1c2038;max-width:700px;margin:0 auto;padding:20px">

<h2 style="color:#1e3a5f;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:20px">
  The Neelkanth Grand - Daily Summary
</h2>
<p style="color:#6b7280;margin-bottom:24px">Date: <strong>${today}</strong></p>

<!-- Occupancy -->
<div style="background:#f0f9ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
  <h3 style="color:#1e3a5f;margin-bottom:8px">Occupancy</h3>
  <table style="width:100%">
    <tr>
      <td style="padding:4px 0"><strong>Rooms Occupied:</strong></td>
      <td style="text-align:right">${occupiedRooms} / ${totalRooms} (${occupancyPct}%)</td>
    </tr>
    <tr>
      <td style="padding:4px 0"><strong>Check-ins Today:</strong></td>
      <td style="text-align:right">${checkinCount}</td>
    </tr>
    <tr>
      <td style="padding:4px 0"><strong>Check-outs Today:</strong></td>
      <td style="text-align:right">${checkoutCount}</td>
    </tr>
  </table>
</div>

<!-- Collection Summary -->
<div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:20px">
  <h3 style="color:#166534;margin-bottom:8px">Today's Collection</h3>
  <table style="width:100%">
    <tr>
      <td style="padding:4px 0"><strong>Cash:</strong></td>
      <td style="text-align:right">${this.formatCurrency(cashCollection)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0"><strong>Card:</strong></td>
      <td style="text-align:right">${this.formatCurrency(cardCollection)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0"><strong>Bank Transfer:</strong></td>
      <td style="text-align:right">${this.formatCurrency(bankCollection)}</td>
    </tr>
    <tr style="border-top:2px solid #166534">
      <td style="padding:8px 0"><strong style="font-size:16px">Total Income:</strong></td>
      <td style="text-align:right"><strong style="font-size:16px;color:#166534">${this.formatCurrency(totalIncome)}</strong></td>
    </tr>
    <tr>
      <td style="padding:4px 0"><strong>Total Expenses:</strong></td>
      <td style="text-align:right;color:#ef4444">${this.formatCurrency(totalExpense)}</td>
    </tr>
    <tr style="border-top:2px solid #1e3a5f">
      <td style="padding:8px 0"><strong style="font-size:16px">Net:</strong></td>
      <td style="text-align:right"><strong style="font-size:16px;color:#1e3a5f">${this.formatCurrency(totalIncome - totalExpense)}</strong></td>
    </tr>
  </table>
</div>

${pendingGuests.length > 0 ? `
<!-- Pending Balances -->
<div style="background:#fef2f2;border-radius:12px;padding:16px 20px;margin-bottom:20px">
  <h3 style="color:#991b1b;margin-bottom:8px">Pending Balances (${this.formatCurrency(pendingBalances)})</h3>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr>
      <th style="text-align:left;padding:8px 12px;background:#fecaca;border-radius:4px 0 0 0">Guest</th>
      <th style="text-align:right;padding:8px 12px;background:#fecaca;border-radius:0 4px 0 0">Pending</th>
    </tr></thead>
    <tbody>${pendingRows}</tbody>
  </table>
</div>
` : ''}

${daybookEntries.length > 0 ? `
<!-- Daybook Entries -->
<div style="margin-bottom:20px">
  <h3 style="color:#1e3a5f;margin-bottom:8px">Daybook Entries (${daybookEntries.length})</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:#1e3a5f;color:white">
      <th style="padding:8px 12px;text-align:left">Type</th>
      <th style="padding:8px 12px;text-align:left">Category</th>
      <th style="padding:8px 12px;text-align:left">Description</th>
      <th style="padding:8px 12px;text-align:left">Mode</th>
      <th style="padding:8px 12px;text-align:right">Amount</th>
    </tr></thead>
    <tbody>${entryRows}</tbody>
  </table>
</div>
` : '<p style="color:#6b7280">No daybook entries recorded today.</p>'}

<p style="text-align:center;margin-top:30px;font-size:11px;color:#9ca3af">
  Auto-generated by The Neelkanth Grand Hotel Management System
</p>

</body>
</html>`;

      // Send email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Neelkanth Grand" <${process.env.SMTP_USER}>`,
        to: recipients,
        subject: `Daily Summary - ${today} | Neelkanth Grand`,
        html,
      });

      this.logger.log(`Daily summary email sent to ${recipients}`);
    } catch (err) {
      this.logger.error('Failed to send daily summary email', err);
    }
  }
}
