import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { InvoiceCounter } from './invoice-counter.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(InvoiceCounter)
    private counterRepo: Repository<InvoiceCounter>,
  ) {}

  private async getNextInvoiceNo(): Promise<string> {
    let counter = await this.counterRepo.findOne({ where: { id: 1 } });
    if (!counter) {
      counter = this.counterRepo.create({ lastNumber: 0 });
      counter = await this.counterRepo.save(counter);
    }
    counter.lastNumber += 1;
    await this.counterRepo.save(counter);
    return 'AKS' + String(counter.lastNumber).padStart(4, '0');
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private formatCurrency(n: number): string {
    return '\u20B9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatFullDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }

  async generateInvoiceHtml(bookingId: number): Promise<string> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['addOns'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const b = booking;
    const invoiceNo = await this.getNextInvoiceNo();
    const nights = this.calculateNights(b.checkIn, b.checkOut);
    const rooms = b.noOfRooms || 1;
    const totalAmount = Number(b.totalAmount) || 0;

    // GST 5% — totalAmount is inclusive of GST
    const baseAmount = Math.round(totalAmount / 1.05 * 100) / 100;
    const cgst = Math.round((totalAmount - baseAmount) / 2 * 100) / 100;
    const sgst = cgst;

    const totalReceived = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
    const balanceDue = totalAmount - totalReceived;

    const today = new Date().toISOString().split('T')[0];

    // Build add-on rows
    let addOnRows = '';
    if (b.complimentary) {
      addOnRows += `<tr><td>Add-On: ${this.escapeHtml(b.complimentary)}</td><td></td><td></td><td class="text-right">-</td></tr>`;
    }
    if (b.kotAmount) {
      addOnRows += `<tr><td>KOT Charges</td><td></td><td></td><td class="text-right">${this.formatCurrency(Number(b.kotAmount))}</td></tr>`;
    }
    if (b.addOns && b.addOns.length > 0) {
      for (const ao of b.addOns) {
        addOnRows += `<tr><td>Add-On: ${this.escapeHtml(ao.type)}</td><td></td><td></td><td class="text-right">${this.formatCurrency(Number(ao.amount))}</td></tr>`;
      }
    }

    const balanceDueRow = balanceDue > 0
      ? `<tr><td><strong>Balance Due</strong></td><td class="text-right" style="color:#ef4444;font-weight:700">${this.formatCurrency(balanceDue)}</td></tr>`
      : '';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNo}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, sans-serif; color: #1c2038; padding: 0; }
.invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
.inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 24px; }
.inv-company h1 { font-size: 24px; color: #1e3a5f; margin-bottom: 4px; }
.inv-company p { font-size: 12px; color: #4b5563; line-height: 1.6; }
.inv-meta { text-align: right; }
.inv-meta h2 { font-size: 28px; color: #1e3a5f; margin-bottom: 8px; }
.inv-meta p { font-size: 13px; color: #4b5563; line-height: 1.6; }
.inv-meta strong { color: #1f2937; }
.inv-section { margin-bottom: 24px; }
.inv-section h3 { font-size: 14px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
.inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.inv-grid .label { font-size: 12px; color: #6b7280; }
.inv-grid .val { font-size: 14px; font-weight: 600; color: #1f2937; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th { background: #1e3a5f; color: white; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; }
td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
tr:nth-child(even) { background: #f9fafb; }
.text-right { text-align: right; }
.totals { margin-top: 20px; display: flex; justify-content: flex-end; }
.totals table { width: 320px; }
.totals td { font-size: 13px; padding: 8px 14px; }
.totals .grand { background: #1e3a5f; color: white; font-weight: 700; font-size: 15px; }
.inv-footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; }
.inv-footer .col { width: 45%; }
.inv-footer h4 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
.inv-footer p { font-size: 12px; color: #4b5563; line-height: 1.5; }
.sign-line { margin-top: 60px; border-top: 1px solid #1c2038; width: 200px; padding-top: 6px; font-size: 12px; color: #6b7280; }
@media print { body { padding: 0; } .invoice { padding: 20px; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="invoice">

<!-- Print button -->
<div class="no-print" style="text-align:right;margin-bottom:20px;">
<button onclick="window.print()" style="padding:10px 24px;background:#1e3a5f;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">Print Invoice</button>
</div>

<!-- Header -->
<div class="inv-header">
<div class="inv-company">
<h1>The Neelkanth Grand</h1>
<p><strong>AKS Hospitality</strong><br>
Neelkanth Grand, Naggar Road, Manali,<br>Himachal Pradesh<br>
Contact: 8922032843 | 9838888878<br>
Sales Office: 912A, 9th Floor, Bhutani Alphatum,<br>Sector 90, Noida<br>
GSTIN: 02ACAFA1060C1ZI</p>
</div>
<div class="inv-meta">
<h2>INVOICE</h2>
<p>Invoice No: <strong>${invoiceNo}</strong><br>
Date: <strong>${this.formatFullDate(today)}</strong><br>
Booking ID: <strong>${this.escapeHtml(b.bookingId)}</strong></p>
</div>
</div>

<!-- Guest Details -->
<div class="inv-section">
<h3>Guest Details</h3>
<div class="inv-grid">
<div><div class="label">Guest Name</div><div class="val">${this.escapeHtml(b.guestName)}</div></div>
<div><div class="label">Phone</div><div class="val">${this.escapeHtml(b.phone || '-')}</div></div>
<div><div class="label">Pax</div><div class="val">${b.pax || 1}</div></div>
<div><div class="label">Room(s)</div><div class="val">${this.escapeHtml(b.roomNo || '-')}${b.roomCategory ? ' (' + this.escapeHtml(b.roomCategory) + ')' : ''}</div></div>
<div><div class="label">Check-in</div><div class="val">${this.formatFullDate(b.checkIn)}</div></div>
<div><div class="label">Check-out</div><div class="val">${this.formatFullDate(b.checkOut)}</div></div>
<div><div class="label">Nights</div><div class="val">${nights}</div></div>
<div><div class="label">Plan</div><div class="val">${this.escapeHtml(b.mealPlan || '-')}</div></div>
</div>
</div>

<!-- Charges Table -->
<div class="inv-section">
<h3>Charges</h3>
<table><thead><tr>
<th>Description</th><th class="text-right">Nights</th><th class="text-right">Rooms</th><th class="text-right">Amount</th>
</tr></thead><tbody>
<tr><td>Room Charges${b.roomCategory ? ' (' + this.escapeHtml(b.roomCategory) + ')' : ''}</td>
<td class="text-right">${nights}</td>
<td class="text-right">${rooms}</td>
<td class="text-right">${this.formatCurrency(baseAmount)}</td></tr>
${addOnRows}
</tbody></table>
</div>

<!-- Totals -->
<div class="totals"><table>
<tr><td>Subtotal</td><td class="text-right">${this.formatCurrency(baseAmount)}</td></tr>
<tr><td>CGST @ 2.5%</td><td class="text-right">${this.formatCurrency(cgst)}</td></tr>
<tr><td>SGST @ 2.5%</td><td class="text-right">${this.formatCurrency(sgst)}</td></tr>
<tr class="grand"><td>Grand Total (incl. GST 5%)</td><td class="text-right">${this.formatCurrency(totalAmount)}</td></tr>
<tr><td>Amount Received</td><td class="text-right" style="color:#10b981;font-weight:600">${this.formatCurrency(totalReceived)}</td></tr>
${balanceDueRow}
</table></div>

<!-- Footer -->
<div class="inv-footer">
<div class="col">
<h4>Payment Info</h4>
<p>Payment Type: ${this.escapeHtml(b.paymentType || '-')}<br>
Mode: ${this.escapeHtml(b.paymentMode || '-')}<br>
Source: ${this.escapeHtml(b.source || '-')}${b.sourceName ? ' (' + this.escapeHtml(b.sourceName) + ')' : ''}</p>
</div>
<div class="col" style="text-align:right">
<div class="sign-line">Authorized Signatory<br><strong>AKS Hospitality</strong></div>
</div>
</div>

<p style="text-align:center;margin-top:30px;font-size:11px;color:#9ca3af;">Thank you for staying with us! | The Neelkanth Grand | AKS Hospitality</p>

</div>
</body>
</html>`;

    return html;
  }
}
