import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { BookingAddon } from './booking-addon.entity';
import { CreateBookingDto, CollectPaymentDto, CheckinDto, CheckoutDto, RescheduleDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(BookingAddon)
    private addonRepo: Repository<BookingAddon>,
  ) {}

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

    return this.bookingRepo.save(booking) as Promise<Booking>;
  }

  async update(id: number, dto: Partial<CreateBookingDto>, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);

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

    return this.bookingRepo.save(booking);
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

    return this.bookingRepo.save(booking);
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

    return this.bookingRepo.save(booking);
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
