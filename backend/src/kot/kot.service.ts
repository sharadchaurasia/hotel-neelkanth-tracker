import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KotOrder } from './kot-order.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { AksOfficePayment } from '../bookings/aks-office-payment.entity';

@Injectable()
export class KotService {
  constructor(
    @InjectRepository(KotOrder)
    private kotRepo: Repository<KotOrder>,
    @InjectRepository(DaybookEntry)
    private daybookRepo: Repository<DaybookEntry>,
    @InjectRepository(AksOfficePayment)
    private aksOfficeRepo: Repository<AksOfficePayment>,
  ) {}

  private normalizePaymentMode(mode: string): string {
    if (!mode || mode === 'Cash') return 'Cash';
    if (mode === 'Card') return 'Card';
    if (mode === 'AKS Office') return 'AKS Office';
    return 'Bank Transfer';
  }

  private async generateKotId(): Promise<string> {
    const result = await this.kotRepo
      .createQueryBuilder('k')
      .select("MAX(CAST(SUBSTRING(k.kot_id FROM 5) AS INTEGER))", 'maxNum')
      .where("k.kot_id LIKE 'KOT-%'")
      .getRawOne();
    const next = (result?.maxNum || 0) + 1;
    return 'KOT-' + String(next).padStart(4, '0');
  }

  async create(dto: {
    orderDate?: string;
    customerName?: string;
    description: string;
    amount: number;
    paymentMode: string;
    subCategory?: string;
  }, userName: string): Promise<KotOrder> {
    const today = new Date().toISOString().split('T')[0];
    const kotId = await this.generateKotId();

    const order = this.kotRepo.create({
      kotId,
      orderDate: dto.orderDate || today,
      customerName: dto.customerName || '',
      description: dto.description,
      amount: dto.amount,
      paymentMode: dto.paymentMode,
      subCategory: dto.subCategory || null,
      status: 'PAID',
      createdBy: userName,
    });
    const saved = await this.kotRepo.save(order);

    // Auto-create daybook income entry for Cash, Card, or Bank Transfer
    if (dto.paymentMode !== 'AKS Office' && dto.amount > 0) {
      const receivedIn = dto.paymentMode === 'Cash' ? 'Cash' : 'Bank Transfer';
      const entry = this.daybookRepo.create({
        date: dto.orderDate || today,
        type: 'income',
        category: 'KOT',
        incomeSource: 'Walk-in KOT',
        description: `KOT - ${dto.customerName || 'Walk-in'}`,
        amount: dto.amount,
        paymentSource: receivedIn,
        paymentMode: dto.paymentMode || 'Cash',
        receivedIn,
        refBookingId: kotId,
        guestName: dto.customerName || 'Walk-in',
      });
      await this.daybookRepo.save(entry);
    }

    // AKS Office payment — create AksOfficePayment entry (no daybook)
    if (dto.paymentMode === 'AKS Office' && dto.amount > 0) {
      const aksPayment = this.aksOfficeRepo.create({
        refBookingId: kotId,
        guestName: dto.customerName || 'Walk-in KOT',
        roomNo: null,
        amount: dto.amount,
        subCategory: dto.subCategory || null,
        date: dto.orderDate || today,
        context: 'kot',
        createdBy: userName,
      });
      await this.aksOfficeRepo.save(aksPayment);
    }

    return saved;
  }

  async findAll(date?: string): Promise<KotOrder[]> {
    const where: any = {};
    if (date) {
      where.orderDate = date;
    }
    return this.kotRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async delete(id: number): Promise<void> {
    const order = await this.kotRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('KOT order not found');

    // Delete associated daybook entry if exists
    await this.daybookRepo.delete({ refBookingId: order.kotId, category: 'KOT' });

    // Delete associated AKS Office payment if exists
    await this.aksOfficeRepo.delete({ refBookingId: order.kotId, context: 'kot' });

    await this.kotRepo.remove(order);
  }
}
