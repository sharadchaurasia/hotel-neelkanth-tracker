import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { BookingAddon } from './booking-addon.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { CreateBookingDto, CollectPaymentDto, CheckinDto, CheckoutDto, RescheduleDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(BookingAddon)
    private addonRepo: Repository<BookingAddon>,
    @InjectRepository(DaybookEntry)
    private daybookRepo: Repository<DaybookEntry>,
  ) {}

  private normalizePaymentMode(mode: string): string {
    if (!mode || mode === 'Cash') return 'Cash';
    if (mode === 'Card') return 'Card';
    return 'Bank Transfer';
  }

  private async createDaybookEntry(params: {
    date: string; category: string; incomeSource: string;
    description: string; amount: number; paymentMode: string;
    refBookingId: string; guestName: string;
  }): Promise<void> {
    if (params.amount <= 0) return;
    const receivedIn = this.normalizePaymentMode(params.paymentMode);
    // Check duplicate
    const existing = await this.daybookRepo.findOne({
      where: { date: params.date, refBookingId: params.refBookingId, incomeSource: params.incomeSource },
    });
    if (existing) return;
    const entry = this.daybookRepo.create({
      date: params.date,
      type: 'income',
      category: params.category,
      incomeSource: params.incomeSource,
      description: params.description,
      amount: params.amount,
      paymentSource: receivedIn,
      paymentMode: params.paymentMode || 'Cash',
      receivedIn,
      refBookingId: params.refBookingId,
      guestName: params.guestName,
    });
    await this.daybookRepo.save(entry);
  }

  private async generateBookingId(): Promise<string> {
    const result = await this.bookingRepo
      .createQueryBuilder('b')
      .select("MAX(CAST(SUBSTRING(b.booking_id FROM 5) AS INTEGER))", 'maxNum')
      .where("b.booking_id LIKE 'NKH-%'")
      .getRawOne();
    const next = (result?.maxNum || 0) + 1;
    return 'NKH-' + String(next).padStart(4, '0');
  }

  async findAll(query: {
    date?: string;
    status?: string;
    source?: string;
    paymentType?: string;
    agent?: string;
    viewBy?: string;
  }): Promise<Booking[]> {
    const qb = this.bookingRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.addOns', 'addons')
      .orderBy('b.check_out', 'ASC');

    if (query.date) {
      const viewBy = query.viewBy || 'checkout';
      if (viewBy === 'checkin') {
        qb.andWhere('b.check_in = :date', { date: query.date });
      } else if (viewBy === 'sameday') {
        qb.andWhere('b.check_in = :date AND b.check_out = :date', { date: query.date });
      } else {
        qb.andWhere('b.check_out = :date', { date: query.date });
      }
    }
    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }
    if (query.paymentType) {
      qb.andWhere('b.payment_type = :paymentType', { paymentType: query.paymentType });
    }
    if (query.source) {
      qb.andWhere('b.source = :source', { source: query.source });
    }
    if (query.agent) {
      qb.andWhere('b.source_name = :agent', { agent: query.agent });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id }, relations: ['addOns'] });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async create(dto: CreateBookingDto): Promise<Booking> {
    const bookingId = await this.generateBookingId();
    const advanceReceived = dto.advanceReceived || 0;
    const pending = dto.totalAmount - advanceReceived;
    let status = 'PENDING';
    if (pending <= 0) status = 'COLLECTED';
    else if (advanceReceived > 0) status = 'PARTIAL';

    const addOnAmount = dto.addOnAmount || 0;

    const booking = this.bookingRepo.create({
      bookingId,
      guestName: dto.guestName,
      phone: dto.phone,
      pax: dto.pax || 1,
      kot: dto.kot,
      roomNo: dto.roomNo,
      noOfRooms: dto.noOfRooms || 1,
      roomCategory: dto.roomCategory,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      mealPlan: dto.mealPlan,
      source: dto.source || 'Walk-in',
      sourceName: (dto.source === 'OTA' || dto.source === 'Agent') ? dto.sourceName : '',
      complimentary: dto.complimentary,
      addOnAmount,
      actualRoomRent: dto.actualRoomRent || 0,
      totalAmount: dto.totalAmount,
      paymentType: dto.paymentType || 'Postpaid',
      advanceReceived,
      advanceDate: advanceReceived > 0 ? new Date().toISOString().split('T')[0] : undefined,
      balanceReceived: 0,
      paymentMode: dto.paymentMode,
      status,
      remarks: dto.remarks,
      kotAmount: 0,
      checkedIn: false,
      checkedOut: false,
    } as Partial<Booking>);

    const saved = await this.bookingRepo.save(booking) as Booking;

    // Create BookingAddon record if addOnAmount > 0 and complimentary is set
    if (addOnAmount > 0 && dto.complimentary) {
      const addon = new BookingAddon();
      addon.booking = saved;
      addon.type = dto.complimentary;
      addon.amount = addOnAmount;
      await this.addonRepo.save(addon);
    }

    // Auto-create daybook entry for advance payment
    if (advanceReceived > 0 && dto.paymentMode) {
      await this.createDaybookEntry({
        date: new Date().toISOString().split('T')[0],
        category: 'Room Rent',
        incomeSource: 'Room Rent (Advance)',
        description: `Advance - ${dto.guestName}`,
        amount: advanceReceived,
        paymentMode: dto.paymentMode,
        refBookingId: saved.bookingId,
        guestName: dto.guestName,
      });
    }

    return this.findOne(saved.id);
  }

  async update(id: number, dto: Partial<CreateBookingDto>, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    const newAddOnAmount = dto.addOnAmount !== undefined ? dto.addOnAmount : undefined;

    Object.assign(booking, {
      guestName: dto.guestName ?? booking.guestName,
      phone: dto.phone ?? booking.phone,
      pax: dto.pax ?? booking.pax,
      kot: dto.kot ?? booking.kot,
      roomNo: dto.roomNo ?? booking.roomNo,
      noOfRooms: dto.noOfRooms ?? booking.noOfRooms,
      roomCategory: dto.roomCategory ?? booking.roomCategory,
      checkIn: dto.checkIn ?? booking.checkIn,
      checkOut: dto.checkOut ?? booking.checkOut,
      mealPlan: dto.mealPlan ?? booking.mealPlan,
      source: dto.source ?? booking.source,
      sourceName: dto.sourceName ?? booking.sourceName,
      complimentary: dto.complimentary ?? booking.complimentary,
      addOnAmount: newAddOnAmount !== undefined ? newAddOnAmount : booking.addOnAmount,
      actualRoomRent: dto.actualRoomRent ?? booking.actualRoomRent,
      totalAmount: dto.totalAmount ?? booking.totalAmount,
      paymentType: dto.paymentType ?? booking.paymentType,
      advanceReceived: dto.advanceReceived ?? booking.advanceReceived,
      paymentMode: dto.paymentMode ?? booking.paymentMode,
      remarks: dto.remarks ?? booking.remarks,
      lastModifiedBy: userName || booking.lastModifiedBy,
    });

    // Recalculate status
    const totalReceived = Number(booking.advanceReceived || 0) + Number(booking.balanceReceived || 0);
    const pending = Number(booking.totalAmount || 0) - totalReceived;
    if (pending <= 0) booking.status = 'COLLECTED';
    else if (totalReceived > 0) booking.status = 'PARTIAL';
    else booking.status = 'PENDING';

    const saved = await this.bookingRepo.save(booking);

    // Update BookingAddon if addOnAmount changed
    if (newAddOnAmount !== undefined) {
      await this.addonRepo.delete({ booking: { id: saved.id } });
      const comp = dto.complimentary ?? booking.complimentary;
      if (newAddOnAmount > 0 && comp) {
        const addon = new BookingAddon();
        addon.booking = saved;
        addon.type = comp;
        addon.amount = newAddOnAmount;
        await this.addonRepo.save(addon);
      }
    }

    return this.findOne(saved.id);
  }

  async delete(id: number): Promise<void> {
    const booking = await this.findOne(id);
    await this.bookingRepo.remove(booking);
  }

  async collectPayment(id: number, dto: CollectPaymentDto, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.balanceReceived = Number(booking.balanceReceived || 0) + dto.amount;
    booking.balancePaymentMode = dto.paymentMode || booking.balancePaymentMode;
    booking.balanceDate = new Date().toISOString().split('T')[0];
    booking.lastModifiedBy = userName || booking.lastModifiedBy;

    const totalReceived = Number(booking.advanceReceived || 0) + Number(booking.balanceReceived);
    const pending = Number(booking.totalAmount || 0) - totalReceived;
    booking.status = pending <= 0 ? 'COLLECTED' : 'PARTIAL';

    const saved = await this.bookingRepo.save(booking);

    // Auto-create daybook entry for collected payment
    if (dto.amount > 0 && dto.paymentMode) {
      const today = new Date().toISOString().split('T')[0];
      await this.createDaybookEntry({
        date: today,
        category: 'Room Rent',
        incomeSource: 'Room Rent (Collection)',
        description: `Payment collected - ${booking.guestName}`,
        amount: dto.amount,
        paymentMode: dto.paymentMode,
        refBookingId: booking.bookingId,
        guestName: booking.guestName,
      });
    }

    return saved;
  }

  async checkin(id: number, dto: CheckinDto, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.roomNo = dto.roomNo;
    booking.noOfRooms = dto.noOfRooms || booking.noOfRooms;
    booking.checkedIn = true;
    booking.checkedInTime = new Date();
    booking.lastModifiedBy = userName || booking.lastModifiedBy;
    return this.bookingRepo.save(booking);
  }

  async checkout(id: number, dto: CheckoutDto, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    const kotAmt = dto.kotAmount || 0;
    booking.kotAmount = kotAmt;
    booking.checkedOut = true;
    booking.checkedOutTime = new Date();
    booking.lastModifiedBy = userName || booking.lastModifiedBy;

    // Handle add-ons
    if (dto.addOns && dto.addOns.length > 0) {
      // Remove old add-ons
      await this.addonRepo.delete({ booking: { id: booking.id } });
      booking.addOns = dto.addOns.map(ao => {
        const addon = new BookingAddon();
        addon.type = ao.type;
        addon.amount = ao.amount;
        return addon;
      });
    }

    const addOnTotal = (dto.addOns || []).reduce((sum, ao) => sum + (ao.amount || 0), 0);
    const origTotal = Number(booking.totalAmount || 0);
    const newTotal = origTotal + kotAmt + addOnTotal;
    booking.totalAmount = newTotal;

    const received = Number(booking.advanceReceived || 0) + Number(booking.balanceReceived || 0);
    const balance = newTotal - received;

    if (dto.paymentMode && balance > 0) {
      booking.balanceReceived = Number(booking.balanceReceived || 0) + balance;
      booking.balancePaymentMode = dto.paymentMode;
      booking.balanceDate = new Date().toISOString().split('T')[0];
      booking.status = 'COLLECTED';
    } else {
      const totalRecv = Number(booking.advanceReceived || 0) + Number(booking.balanceReceived || 0);
      const pend = newTotal - totalRecv;
      if (pend <= 0) booking.status = 'COLLECTED';
      else if (totalRecv > 0) booking.status = 'PARTIAL';
      else booking.status = 'PENDING';
    }

    const saved = await this.bookingRepo.save(booking);

    // Auto-create daybook entries at checkout
    const today = new Date().toISOString().split('T')[0];
    const checkoutMode = dto.paymentMode || booking.balancePaymentMode || booking.paymentMode || 'Cash';

    // Room rent balance entry (if balance paid at checkout)
    if (dto.paymentMode && balance > 0) {
      const roomRentPortion = balance - kotAmt - addOnTotal;
      if (roomRentPortion > 0) {
        await this.createDaybookEntry({
          date: today,
          category: 'Room Rent',
          incomeSource: 'Room Rent (Balance)',
          description: `Checkout balance - ${booking.guestName}`,
          amount: roomRentPortion,
          paymentMode: checkoutMode,
          refBookingId: booking.bookingId,
          guestName: booking.guestName,
        });
      }
    }

    // KOT entry
    if (kotAmt > 0) {
      await this.createDaybookEntry({
        date: today,
        category: 'KOT',
        incomeSource: 'KOT',
        description: `KOT - ${booking.guestName}`,
        amount: kotAmt,
        paymentMode: checkoutMode,
        refBookingId: booking.bookingId,
        guestName: booking.guestName,
      });
    }

    // Add-on entries
    if (addOnTotal > 0) {
      const addonDesc = (dto.addOns || []).map(a => a.type).join(', ');
      await this.createDaybookEntry({
        date: today,
        category: 'Other',
        incomeSource: 'Add-On',
        description: `Add-On (${addonDesc}) - ${booking.guestName}`,
        amount: addOnTotal,
        paymentMode: checkoutMode,
        refBookingId: booking.bookingId,
        guestName: booking.guestName,
      });
    }

    return saved;
  }

  async cancel(id: number, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = 'CANCELLED';
    booking.lastModifiedBy = userName || booking.lastModifiedBy;
    return this.bookingRepo.save(booking);
  }

  async reschedule(id: number, dto: RescheduleDto, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.rescheduledFrom = booking.checkOut;
    booking.checkOut = dto.newCheckOut;
    booking.status = 'RESCHEDULED';
    booking.lastModifiedBy = userName || booking.lastModifiedBy;
    return this.bookingRepo.save(booking);
  }

  async getGuestHistory(phone: string): Promise<Booking[]> {
    if (!phone || phone.length < 4) return [];
    return this.bookingRepo.find({
      where: { phone },
      relations: ['addOns'],
      order: { checkIn: 'DESC' },
    });
  }

  async getDashboardStats(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const allBookings = await this.bookingRepo.find({ relations: ['addOns'] });

    const checkinGuests: Booking[] = [];
    const inhouseGuests: Booking[] = [];
    const checkoutGuests: Booking[] = [];
    let todayCollectionAmt = 0;
    let todayCollectedAmt = 0;
    let todayPendingAmt = 0;
    let ledgerDueAmt = 0;
    const ledgerByAgent: Record<string, number> = {};

    for (const b of allBookings) {
      if (b.status === 'CANCELLED') continue;
      const totalReceived = Number(b.advanceReceived || 0) + Number(b.balanceReceived || 0);
      const pending = Number(b.totalAmount || 0) - totalReceived;

      if (b.checkIn === today && !b.checkedIn) checkinGuests.push(b);
      if ((b.checkedIn && b.checkIn <= today && b.checkOut > today) ||
          (!b.checkedIn && b.checkIn < today && b.checkOut > today)) {
        inhouseGuests.push(b);
      }
      if (b.checkOut === today && !b.checkedOut) {
        checkoutGuests.push(b);
        todayCollectionAmt += Number(b.totalAmount || 0);
        todayCollectedAmt += totalReceived;
        if (pending > 0) todayPendingAmt += pending;
      }
      if (pending > 0 && b.paymentType === 'Ledger') {
        ledgerDueAmt += pending;
        const agent = b.sourceName || 'Unknown Agent';
        ledgerByAgent[agent] = (ledgerByAgent[agent] || 0) + pending;
      }
    }

    return {
      checkinGuests,
      inhouseGuests,
      checkoutGuests,
      todayCollectionAmt,
      todayCollectedAmt,
      todayPendingAmt,
      ledgerDueAmt,
      ledgerByAgent,
    };
  }
}
