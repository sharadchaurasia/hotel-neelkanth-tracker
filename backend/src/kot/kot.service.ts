import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { KotOrder } from './kot-order.entity';
import { KotItem } from './kot-item.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { AksOfficePayment } from '../bookings/aks-office-payment.entity';
import { Booking } from '../bookings/booking.entity';

@Injectable()
export class KotService {
  constructor(
    @InjectRepository(KotOrder)
    private kotRepo: Repository<KotOrder>,
    @InjectRepository(KotItem)
    private itemRepo: Repository<KotItem>,
    @InjectRepository(DaybookEntry)
    private daybookRepo: Repository<DaybookEntry>,
    @InjectRepository(AksOfficePayment)
    private aksOfficeRepo: Repository<AksOfficePayment>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  private async generateKotId(): Promise<string> {
    const result = await this.kotRepo
      .createQueryBuilder('k')
      .select("MAX(CAST(SUBSTRING(k.kot_id FROM 5) AS INTEGER))", 'maxNum')
      .where("k.kot_id LIKE 'KOT-%'")
      .getRawOne();
    const next = (result?.maxNum || 0) + 1;
    return 'KOT-' + String(next).padStart(4, '0');
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private formatCurrency(n: number): string {
    return '\u20B9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async create(dto: {
    orderDate?: string;
    customerName?: string;
    description?: string;
    amount?: number;
    paymentMode?: string;
    subCategory?: string;
    bookingId?: string;
    roomNo?: string;
    status?: string;
    items?: { itemName: string; quantity: number; rate: number }[];
  }, userName: string): Promise<KotOrder> {
    const today = new Date().toISOString().split('T')[0];
    const kotId = await this.generateKotId();

    // Calculate totals from items
    let subtotal = 0;
    const itemEntities: Partial<KotItem>[] = [];
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        const total = item.quantity * item.rate;
        subtotal += total;
        itemEntities.push({
          itemName: item.itemName,
          quantity: item.quantity,
          rate: item.rate,
          total,
        });
      }
    }

    const gstAmount = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = subtotal + gstAmount;

    // Auto-generate description from items for backward compat
    let description = dto.description || '';
    if (itemEntities.length > 0 && !description) {
      description = itemEntities.map(i => `${i.quantity}x ${i.itemName}`).join(', ');
    }

    const orderStatus = dto.status || 'PAID';
    const paymentMode = orderStatus === 'UNPAID' ? null : (dto.paymentMode || 'Cash');

    const order = new KotOrder();
    order.kotId = kotId;
    order.orderDate = dto.orderDate || today;
    order.customerName = dto.customerName || '';
    order.description = description;
    order.amount = totalAmount || dto.amount || 0;
    order.paymentMode = paymentMode || '';
    order.subCategory = dto.subCategory || '';
    order.status = orderStatus;
    order.createdBy = userName;
    order.bookingId = dto.bookingId || '';
    order.roomNo = dto.roomNo || '';
    order.subtotal = subtotal;
    order.gstAmount = gstAmount;
    order.totalAmount = totalAmount || dto.amount || 0;
    const saved = await this.kotRepo.save(order);

    // Save items
    if (itemEntities.length > 0) {
      const items = itemEntities.map(i => this.itemRepo.create({ ...i, kotOrderId: saved.id }));
      await this.itemRepo.save(items);
      saved.items = items as KotItem[];
    }

    // Only create daybook/AKS entries for PAID orders
    if (orderStatus === 'PAID') {
      const amt = saved.totalAmount || saved.amount;
      if (paymentMode !== 'AKS Office' && amt > 0) {
        const receivedIn = paymentMode === 'Cash' ? 'Cash' : (paymentMode === 'Card' ? 'Card' : 'Bank Transfer');
        const entry = this.daybookRepo.create({
          date: dto.orderDate || today,
          type: 'income',
          category: 'KOT',
          incomeSource: dto.bookingId ? 'KOT' : 'Walk-in KOT',
          description: `KOT - ${dto.customerName || 'Walk-in'}`,
          amount: amt,
          paymentSource: receivedIn,
          paymentMode: paymentMode || 'Cash',
          receivedIn,
          refBookingId: kotId,
          guestName: dto.customerName || 'Walk-in',
        });
        await this.daybookRepo.save(entry);
      }

      if (paymentMode === 'AKS Office' && amt > 0) {
        const aksPayment = this.aksOfficeRepo.create({
          refBookingId: kotId,
          guestName: dto.customerName || 'Walk-in KOT',
          amount: amt,
          subCategory: dto.subCategory || undefined,
          date: dto.orderDate || today,
          context: 'kot',
          createdBy: userName,
        });
        await this.aksOfficeRepo.save(aksPayment);
      }
    }

    return saved;
  }

  async findAll(date?: string, from?: string, to?: string): Promise<KotOrder[]> {
    const where: any = {};
    if (date) {
      where.orderDate = date;
    } else if (from && to) {
      where.orderDate = Between(from, to);
    } else if (from) {
      where.orderDate = MoreThanOrEqual(from);
    } else if (to) {
      where.orderDate = LessThanOrEqual(to);
    }
    return this.kotRepo.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBooking(bookingId: string): Promise<KotOrder[]> {
    return this.kotRepo.find({
      where: { bookingId },
      relations: ['items'],
      order: { orderDate: 'ASC', createdAt: 'ASC' },
    });
  }

  async getUnpaidByBooking(bookingId: string): Promise<KotOrder[]> {
    return this.kotRepo.find({
      where: { bookingId, status: 'UNPAID' },
      relations: ['items'],
      order: { orderDate: 'ASC', createdAt: 'ASC' },
    });
  }

  async markPaidByBooking(bookingId: string, paymentMode: string, userName: string): Promise<number> {
    const unpaid = await this.getUnpaidByBooking(bookingId);
    if (unpaid.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    let totalMarked = 0;

    for (const order of unpaid) {
      order.status = 'PAID';
      order.paymentMode = paymentMode;
      await this.kotRepo.save(order);

      const amt = Number(order.totalAmount) || Number(order.amount) || 0;
      totalMarked += amt;

      // Create daybook entry for each order
      if (paymentMode !== 'AKS Office' && amt > 0) {
        const receivedIn = paymentMode === 'Cash' ? 'Cash' : (paymentMode === 'Card' ? 'Card' : 'Bank Transfer');
        const entry = this.daybookRepo.create({
          date: today,
          type: 'income',
          category: 'KOT',
          incomeSource: 'KOT',
          description: `KOT - ${order.customerName || 'Guest'} (checkout)`,
          amount: amt,
          paymentSource: receivedIn,
          paymentMode,
          receivedIn,
          refBookingId: order.kotId,
          guestName: order.customerName || 'Guest',
        });
        await this.daybookRepo.save(entry);
      }

      if (paymentMode === 'AKS Office' && amt > 0) {
        const aksPayment = this.aksOfficeRepo.create({
          refBookingId: order.kotId,
          guestName: order.customerName || 'Guest',
          amount: amt,
          date: today,
          context: 'kot',
          createdBy: userName,
        });
        await this.aksOfficeRepo.save(aksPayment);
      }
    }

    return totalMarked;
  }

  async getCheckedInGuests(): Promise<any[]> {
    const bookings = await this.bookingRepo.find({
      where: { checkedIn: true, checkedOut: false },
      order: { roomNo: 'ASC' },
    });
    return bookings.map(b => ({
      bookingId: b.bookingId,
      guestName: b.guestName,
      roomNo: b.roomNo,
      id: b.id,
    }));
  }

  async delete(id: number): Promise<void> {
    const order = await this.kotRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('KOT order not found');

    // Delete associated daybook entry if exists
    await this.daybookRepo.delete({ refBookingId: order.kotId, category: 'KOT' });

    // Delete associated AKS Office payment if exists
    await this.aksOfficeRepo.delete({ refBookingId: order.kotId, context: 'kot' });

    // Items cascade-delete via FK
    await this.kotRepo.remove(order);
  }

  async generateBillHtml(id: number): Promise<string> {
    const order = await this.kotRepo.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException('KOT order not found');

    const orderDate = new Date(order.orderDate + 'T00:00:00');
    const dateStr = orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

    const guestLine = order.roomNo
      ? `${this.escapeHtml(order.customerName || 'Guest')} (Room ${this.escapeHtml(order.roomNo)})`
      : this.escapeHtml(order.customerName || 'Walk-in');

    let itemRows = '';
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        itemRows += `<tr>
          <td>${this.escapeHtml(item.itemName)}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${this.formatCurrency(Number(item.rate))}</td>
          <td class="text-right">${this.formatCurrency(Number(item.total))}</td>
        </tr>`;
      }
    } else {
      itemRows = `<tr><td colspan="4">${this.escapeHtml(order.description)}</td></tr>`;
    }

    const subtotal = Number(order.subtotal) || Number(order.amount) || 0;
    const gst = Number(order.gstAmount) || 0;
    const total = Number(order.totalAmount) || subtotal + gst;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>KOT Bill - ${order.kotId}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, sans-serif; color: #1c2038; padding: 0; }
.bill { max-width: 400px; margin: 0 auto; padding: 30px; }
.bill-header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 16px; }
.bill-header h1 { font-size: 20px; color: #1e3a5f; margin-bottom: 2px; }
.bill-header h2 { font-size: 14px; color: #4b5563; font-weight: 400; margin-bottom: 8px; }
.bill-header p { font-size: 11px; color: #6b7280; line-height: 1.5; }
.bill-meta { margin-bottom: 16px; font-size: 13px; }
.bill-meta p { margin-bottom: 4px; }
.bill-meta strong { color: #1f2937; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; }
th { background: #1e3a5f; color: white; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
.text-right { text-align: right; }
.totals { border-top: 2px solid #1e3a5f; margin-top: 8px; }
.totals td { padding: 6px 10px; font-size: 13px; }
.totals .grand { font-weight: 700; font-size: 15px; background: #f0f9ff; }
.status { text-align: center; margin: 16px 0; font-size: 14px; font-weight: 600; }
.status.paid { color: #16a34a; }
.status.unpaid { color: #ea580c; }
.bill-footer { text-align: center; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #9ca3af; }
@media print { body { padding: 0; } .bill { padding: 10px; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="bill">

<div class="no-print" style="text-align:right;margin-bottom:16px;">
<button onclick="window.print()" style="padding:8px 20px;background:#1e3a5f;color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;">Print Bill</button>
</div>

<div class="bill-header">
<h1>The Neelkanth Grand</h1>
<h2>KOT Bill</h2>
<p>Naggar Road, Manali, HP<br>Contact: 8922032843</p>
</div>

<div class="bill-meta">
<p><strong>KOT ID:</strong> ${order.kotId}</p>
<p><strong>Date:</strong> ${dateStr}${timeStr ? ', ' + timeStr : ''}</p>
<p><strong>Guest:</strong> ${guestLine}</p>
</div>

<table>
<thead><tr>
<th>Item</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th>
</tr></thead>
<tbody>
${itemRows}
</tbody>
</table>

<table class="totals">
<tr><td>Subtotal</td><td class="text-right">${this.formatCurrency(subtotal)}</td></tr>
<tr><td>GST @ 5%</td><td class="text-right">${this.formatCurrency(gst)}</td></tr>
<tr class="grand"><td>Total</td><td class="text-right">${this.formatCurrency(total)}</td></tr>
</table>

<div class="status ${order.status === 'PAID' ? 'paid' : 'unpaid'}">
${order.status === 'PAID' ? 'PAID' + (order.paymentMode ? ' (' + order.paymentMode + ')' : '') : 'UNPAID - Collect at Checkout'}
</div>

<div class="bill-footer">Thank you! | The Neelkanth Grand | AKS Hospitality</div>

</div>
</body>
</html>`;
  }

  async generateCombinedBillHtml(bookingId: string): Promise<string> {
    const orders = await this.kotRepo.find({
      where: { bookingId },
      relations: ['items'],
      order: { orderDate: 'ASC', createdAt: 'ASC' },
    });
    if (orders.length === 0) throw new NotFoundException('No KOT orders found for this booking');

    // Get booking info for guest/room
    const booking = await this.bookingRepo.findOne({ where: { bookingId } });
    const guestName = booking?.guestName || orders[0].customerName || 'Guest';
    const roomNo = booking?.roomNo || orders[0].roomNo || '';

    const guestLine = roomNo
      ? `${this.escapeHtml(guestName)} (Room ${this.escapeHtml(roomNo)})`
      : this.escapeHtml(guestName);

    // Group orders by date
    const byDate: Record<string, KotOrder[]> = {};
    for (const o of orders) {
      if (!byDate[o.orderDate]) byDate[o.orderDate] = [];
      byDate[o.orderDate].push(o);
    }

    let grandSubtotal = 0;
    let grandGst = 0;
    let grandTotal = 0;

    let sectionsHtml = '';
    const sortedDates = Object.keys(byDate).sort();

    for (const date of sortedDates) {
      const dateOrders = byDate[date];
      const dateObj = new Date(date + 'T00:00:00');
      const dateStr = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

      let daySubtotal = 0;
      let itemRows = '';

      for (const order of dateOrders) {
        const timeStr = order.createdAt
          ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
          : '';

        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            const itemTotal = Number(item.total);
            daySubtotal += itemTotal;
            itemRows += `<tr>
              <td>${this.escapeHtml(item.itemName)}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${this.formatCurrency(Number(item.rate))}</td>
              <td class="text-right">${this.formatCurrency(itemTotal)}</td>
            </tr>`;
          }
        } else {
          const amt = Number(order.subtotal) || Number(order.amount) || 0;
          daySubtotal += amt;
          itemRows += `<tr>
            <td>${this.escapeHtml(order.description)}${timeStr ? ' <small style="color:#999">(' + timeStr + ')</small>' : ''}</td>
            <td class="text-right">1</td>
            <td class="text-right">${this.formatCurrency(amt)}</td>
            <td class="text-right">${this.formatCurrency(amt)}</td>
          </tr>`;
        }
      }

      const dayGst = Math.round(daySubtotal * 0.05 * 100) / 100;
      const dayTotal = daySubtotal + dayGst;
      grandSubtotal += daySubtotal;
      grandGst += dayGst;
      grandTotal += dayTotal;

      sectionsHtml += `
      <div class="day-section">
        <div class="day-header">${dateStr}</div>
        <table>
        <thead><tr>
          <th>Item</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th>
        </tr></thead>
        <tbody>
        ${itemRows}
        </tbody>
        </table>
        <div class="day-total">
          <span>Day Subtotal: ${this.formatCurrency(daySubtotal)}</span>
          <span>GST 5%: ${this.formatCurrency(dayGst)}</span>
          <span style="font-weight:700">Day Total: ${this.formatCurrency(dayTotal)}</span>
        </div>
      </div>`;
    }

    const checkIn = booking ? new Date(booking.checkIn + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const checkOut = booking ? new Date(booking.checkOut + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const stayLine = checkIn && checkOut ? `${checkIn} - ${checkOut}` : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>KOT Summary - ${this.escapeHtml(bookingId)}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, sans-serif; color: #1c2038; padding: 0; }
.bill { max-width: 500px; margin: 0 auto; padding: 30px; }
.bill-header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 16px; }
.bill-header h1 { font-size: 20px; color: #1e3a5f; margin-bottom: 2px; }
.bill-header h2 { font-size: 14px; color: #4b5563; font-weight: 400; margin-bottom: 8px; }
.bill-header p { font-size: 11px; color: #6b7280; line-height: 1.5; }
.bill-meta { margin-bottom: 16px; font-size: 13px; }
.bill-meta p { margin-bottom: 4px; }
.bill-meta strong { color: #1f2937; }
.day-section { margin-bottom: 20px; }
.day-header { background: #f0f4f8; color: #1e3a5f; font-weight: 700; font-size: 13px; padding: 8px 10px; border-radius: 4px; margin-bottom: 4px; }
table { width: 100%; border-collapse: collapse; margin: 4px 0; }
th { background: #1e3a5f; color: white; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
.text-right { text-align: right; }
.day-total { display: flex; justify-content: flex-end; gap: 16px; font-size: 12px; color: #4b5563; padding: 6px 10px; border-top: 1px dashed #d1d5db; }
.grand-totals { border-top: 3px solid #1e3a5f; margin-top: 12px; padding-top: 12px; }
.grand-totals table { margin: 0; }
.grand-totals td { padding: 6px 10px; font-size: 13px; border: none; }
.grand-totals .grand { font-weight: 700; font-size: 16px; background: #f0f9ff; }
.bill-footer { text-align: center; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #9ca3af; }
@media print { body { padding: 0; } .bill { padding: 10px; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="bill">

<div class="no-print" style="text-align:right;margin-bottom:16px;">
<button onclick="window.print()" style="padding:8px 20px;background:#1e3a5f;color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;">Print Bill</button>
</div>

<div class="bill-header">
<h1>The Neelkanth Grand</h1>
<h2>KOT Summary Bill</h2>
<p>Naggar Road, Manali, HP<br>Contact: 8922032843</p>
</div>

<div class="bill-meta">
<p><strong>Booking:</strong> ${this.escapeHtml(bookingId)}</p>
<p><strong>Guest:</strong> ${guestLine}</p>
${stayLine ? '<p><strong>Stay:</strong> ' + stayLine + '</p>' : ''}
<p><strong>Total Orders:</strong> ${orders.length}</p>
</div>

${sectionsHtml}

<div class="grand-totals">
<table>
<tr><td>Grand Subtotal</td><td class="text-right">${this.formatCurrency(grandSubtotal)}</td></tr>
<tr><td>Total GST @ 5%</td><td class="text-right">${this.formatCurrency(grandGst)}</td></tr>
<tr class="grand"><td>Grand Total</td><td class="text-right">${this.formatCurrency(grandTotal)}</td></tr>
</table>
</div>

<div class="bill-footer">Thank you! | The Neelkanth Grand | AKS Hospitality</div>

</div>
</body>
</html>`;
  }
}
