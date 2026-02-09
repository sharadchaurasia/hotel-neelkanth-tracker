import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { BookingAddon } from './booking-addon.entity';
import { AksOfficePayment } from './aks-office-payment.entity';
import { AgentSettlement } from './agent-settlement.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { KotService } from '../kot/kot.service';
import { CreateBookingDto, CollectPaymentDto, CheckinDto, CheckoutDto, RescheduleDto, AgentSettlementDto, RefundDto } from './dto/create-booking.dto';
import { ErrorLogger } from '../common/logger/error-logger';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(BookingAddon)
    private addonRepo: Repository<BookingAddon>,
    @InjectRepository(AksOfficePayment)
    private aksOfficeRepo: Repository<AksOfficePayment>,
    @InjectRepository(AgentSettlement)
    private settlementRepo: Repository<AgentSettlement>,
    @InjectRepository(DaybookEntry)
    private daybookRepo: Repository<DaybookEntry>,
    private kotService: KotService,
  ) {}

  private normalizePaymentMode(mode: string): string {
    if (!mode || mode === 'Cash') return 'Cash';
    if (mode === 'Card') return 'Card';
    if (mode === 'AKS Office' || (mode && mode.startsWith('AKS Office'))) return 'AKS Office';
    return 'Bank Transfer';
  }

  private async createDaybookEntry(params: {
    date: string; category: string; incomeSource: string;
    description: string; amount: number; paymentMode: string;
    refBookingId: string; guestName: string;
  }): Promise<void> {
    if (params.amount <= 0) return;
    const receivedIn = this.normalizePaymentMode(params.paymentMode);
    // Check duplicate (skip for Collection - multiple collections per day allowed)
    if (params.incomeSource !== 'Room Rent (Collection)') {
      const existing = await this.daybookRepo.findOne({
        where: { date: params.date, refBookingId: params.refBookingId, incomeSource: params.incomeSource },
      });
      if (existing) return;
    }
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

  async saveBooking(booking: Booking): Promise<Booking> {
    return this.bookingRepo.save(booking);
  }

  async create(dto: CreateBookingDto): Promise<Booking> {
    try {
      const bookingId = await this.generateBookingId();
      const advanceReceived = dto.advanceReceived || 0;
      const pending = dto.totalAmount - advanceReceived;
      let status = 'PENDING';
      if (pending <= 0) status = 'COLLECTED';
      else if (advanceReceived > 0) status = 'PARTIAL';

      const addOnAmount = dto.addOns?.reduce((sum, a) => sum + (a.amount || 0), 0) || dto.addOnAmount || 0;

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
        hotelShare: dto.hotelShare || 0,
        paymentType: dto.paymentType || 'Postpaid',
        advanceReceived,
        advanceDate: dto.advanceDate || (advanceReceived > 0 ? new Date().toISOString().split('T')[0] : undefined),
        balanceReceived: 0,
        paymentMode: dto.paymentMode,
        status,
        remarks: dto.remarks,
        kotAmount: 0,
        checkedIn: false,
        checkedOut: false,
      } as Partial<Booking>);

      const saved = await this.bookingRepo.save(booking) as Booking;

      // Create BookingAddon records from addOns array
      if (dto.addOns && dto.addOns.length > 0) {
        for (const addonDto of dto.addOns) {
          if (addonDto.type && addonDto.amount > 0) {
            const addon = new BookingAddon();
            addon.booking = saved;
            addon.type = addonDto.type;
            addon.amount = addonDto.amount;
            await this.addonRepo.save(addon);
          }
        }
      } else if (addOnAmount > 0 && dto.complimentary) {
        // Fallback for old complimentary field
        const addon = new BookingAddon();
        addon.booking = saved;
        addon.type = dto.complimentary;
        addon.amount = addOnAmount;
        await this.addonRepo.save(addon);
      }

      // Auto-create daybook entry for advance payment (skip for AKS Office)
      if (advanceReceived > 0 && dto.paymentMode && dto.paymentMode !== 'AKS Office') {
        await this.createDaybookEntry({
          date: new Date().toISOString().split('T')[0],
          category: 'Room Rent',
          incomeSource: 'Room Rent (Advance)',
          description: `Advance - ${dto.guestName}${dto.paymentSubCategory ? ' (' + dto.paymentSubCategory + ')' : ''}`,
          amount: advanceReceived,
          paymentMode: dto.paymentMode,
          refBookingId: saved.bookingId,
          guestName: dto.guestName,
        });
      }

      return this.findOne(saved.id);
    } catch (error) {
      ErrorLogger.logServiceError('BookingsService', 'create', error, {
        guestName: dto.guestName,
        phone: dto.phone,
        checkIn: dto.checkIn,
        totalAmount: dto.totalAmount,
      });
      throw new InternalServerErrorException('Failed to create booking. Please try again.');
    }
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
      advanceDate: dto.advanceDate ?? booking.advanceDate,
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

  async delete(id: number, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = 'DELETED';
    booking.lastModifiedBy = userName || booking.lastModifiedBy;
    booking.remarks = (booking.remarks ? booking.remarks + '\n' : '') +
      `[DELETED by ${userName || 'unknown'} on ${new Date().toISOString().split('T')[0]}]`;
    return this.bookingRepo.save(booking);
  }

  async collectPayment(id: number, dto: CollectPaymentDto, userName?: string): Promise<Booking> {
    let booking;
    try {
      booking = await this.findOne(id);
      if (booking.status === 'COLLECTED') {
        throw new NotFoundException('Payment already collected for this booking');
      }
      const today = new Date().toISOString().split('T')[0];

      if (dto.paymentMode === 'AKS Office') {
        // AKS Office: track in balanceReceived (so checkout knows), but no daybook entry
        // Hotel's share = actualRoomRent + addOnAmount - what hotel already received
        const totalDue = Number(booking.totalAmount || 0) - Number(booking.advanceReceived || 0) - Number(booking.balanceReceived || 0);
        const hotelShare = Math.max(0,
          Number(booking.actualRoomRent || 0) + Number(booking.addOnAmount || 0)
          - Number(booking.advanceReceived || 0) - Number(booking.balanceReceived || 0)
        );
        booking.balanceReceived = Number(booking.balanceReceived || 0) + totalDue;
        booking.balancePaymentMode = 'AKS Office' + (dto.subCategory ? ' - ' + dto.subCategory : '');
        booking.balanceDate = today;
        booking.status = 'COLLECTED';
        booking.lastModifiedBy = userName || booking.lastModifiedBy;
        booking.remarks = (booking.remarks ? booking.remarks + '\n' : '') +
          `[AKS Office collection ₹${hotelShare} (${dto.subCategory || 'N/A'}) by ${userName || 'unknown'} on ${today}]`;
        const saved = await this.bookingRepo.save(booking);

        // Create AKS Office payment record with hotel's share
        if (hotelShare > 0) {
          const aksPayment = this.aksOfficeRepo.create({
            booking: saved,
            refBookingId: booking.bookingId,
            guestName: booking.guestName,
            roomNo: booking.roomNo,
            amount: hotelShare,
            subCategory: dto.subCategory,
            date: today,
            context: 'collect',
            createdBy: userName,
          });
          await this.aksOfficeRepo.save(aksPayment);
        }

        return saved;
      }

      booking.balanceReceived = Number(booking.balanceReceived || 0) + dto.amount;
      booking.balancePaymentMode = dto.paymentMode || booking.balancePaymentMode;
      booking.balanceDate = today;
      booking.lastModifiedBy = userName || booking.lastModifiedBy;

      const totalReceived = Number(booking.advanceReceived || 0) + Number(booking.balanceReceived);
      const pending = Number(booking.totalAmount || 0) - totalReceived;
      booking.status = pending <= 0 ? 'COLLECTED' : 'PARTIAL';

      const saved = await this.bookingRepo.save(booking);

      // Auto-create daybook entry for collected payment
      if (dto.amount > 0 && dto.paymentMode) {
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
    } catch (error) {
      // Don't wrap NotFoundException - let it pass through
      if (error instanceof NotFoundException) {
        throw error;
      }
      ErrorLogger.logPaymentError('collectPayment', booking?.bookingId || 'unknown', dto.amount, error);
      throw new InternalServerErrorException('Failed to collect payment. Please verify the transaction and try again.');
    }
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
    let booking;
    try {
      booking = await this.findOne(id);
      if (booking.checkedOut) {
        throw new NotFoundException('Booking already checked out');
      }
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
    const today = new Date().toISOString().split('T')[0];
    const isAksOffice = dto.paymentMode === 'AKS Office';

    if (isAksOffice) {
      // AKS Office checkout: do NOT add room rent balance to balanceReceived, no room rent daybook
      booking.status = 'COLLECTED';
      booking.remarks = (booking.remarks ? booking.remarks + '\n' : '') +
        `[AKS Office checkout ₹${balance > 0 ? balance : 0} (${dto.subCategory || 'N/A'}) by ${userName || 'unknown'} on ${today}]`;
    } else if (balance > 0 && dto.transferToAgentLedger && dto.collectAmount !== undefined) {
      // Agent ledger transfer — collect partial (or zero) from guest, rest to agent ledger
      const actualCollect = Math.min(Math.max(0, dto.collectAmount), balance);
      booking.balanceReceived = Number(booking.balanceReceived || 0) + actualCollect;
      if (actualCollect > 0 && dto.paymentMode) {
        booking.balancePaymentMode = dto.paymentMode;
        booking.balanceDate = today;
      }
      booking.paymentType = 'Ledger';
      const totalRecv = Number(booking.advanceReceived || 0) + Number(booking.balanceReceived);
      const pend = newTotal - totalRecv;
      booking.status = pend <= 0 ? 'COLLECTED' : (totalRecv > 0 ? 'PARTIAL' : 'PENDING');
      const ledgerAmt = balance - actualCollect;
      if (ledgerAmt > 0) {
        booking.remarks = (booking.remarks ? booking.remarks + '\n' : '') +
          `[₹${ledgerAmt} transferred to ${booking.sourceName || 'Agent'} ledger by ${userName || 'unknown'} on ${today}]`;
      }
    } else if (dto.paymentMode && balance > 0) {
      booking.balanceReceived = Number(booking.balanceReceived || 0) + balance;
      // Don't overwrite AKS Office payment mode when only collecting KOT/add-ons
      const roomRentPortion = balance - kotAmt - addOnTotal;
      if (roomRentPortion > 0 || !booking.balancePaymentMode || !booking.balancePaymentMode.startsWith('AKS Office')) {
        booking.balancePaymentMode = dto.paymentMode;
      }
      booking.balanceDate = today;
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
    const checkoutMode = isAksOffice ? 'Cash' : (dto.paymentMode || booking.balancePaymentMode || booking.paymentMode || 'Cash');
    const kotMode = dto.kotPaymentMode || checkoutMode;

    // Room rent balance entry (if balance paid at checkout) — skip for AKS Office
    if (!isAksOffice && dto.paymentMode && balance > 0) {
      const actualCollected = (dto.transferToAgentLedger && dto.collectAmount !== undefined)
        ? Math.min(Math.max(0, dto.collectAmount), balance)
        : balance;
      const roomRentPortion = actualCollected - kotAmt - addOnTotal;
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

    // AKS Office: create AKS payment record (room rent only — KOT & add-ons are hotel's direct income)
    if (isAksOffice) {
      const hotelShare = Math.max(0,
        Number(booking.actualRoomRent || 0) + Number(booking.addOnAmount || 0)
        - Number(booking.advanceReceived || 0) - Number(booking.balanceReceived || 0)
      );
      if (hotelShare > 0) {
        const aksPayment = this.aksOfficeRepo.create({
          booking: saved,
          refBookingId: booking.bookingId,
          guestName: booking.guestName,
          roomNo: booking.roomNo,
          amount: hotelShare,
          subCategory: dto.subCategory,
          date: today,
          context: 'checkout',
          createdBy: userName,
        });
        await this.aksOfficeRepo.save(aksPayment);
      }
    }

    // Mark unpaid KOT orders as paid (creates daybook entries via KotService)
    const unpaidKotTotal = await this.kotService.markPaidByBooking(booking.bookingId, kotMode, userName || 'System');

    // If there's a manual kotAmount beyond the unpaid KOT orders, create a daybook entry for it
    const remainingKot = kotAmt - unpaidKotTotal;
    if (remainingKot > 0) {
      await this.createDaybookEntry({
        date: today,
        category: 'KOT',
        incomeSource: 'KOT',
        description: `KOT - ${booking.guestName}`,
        amount: remainingKot,
        paymentMode: kotMode,
        refBookingId: booking.bookingId,
        guestName: booking.guestName,
      });
    }

    // Add-on entries (always created, even for AKS Office — real income)
    if (addOnTotal > 0) {
      const addonDesc = (dto.addOns || []).map(a => a.type).join(', ');
      await this.createDaybookEntry({
        date: today,
        category: 'Other',
        incomeSource: 'Add-On',
        description: `Add-On (${addonDesc}) - ${booking.guestName}`,
        amount: addOnTotal,
        paymentMode: kotMode,
        refBookingId: booking.bookingId,
        guestName: booking.guestName,
      });
    }

    return saved;
    } catch (error) {
      // Don't wrap NotFoundException - let it pass through
      if (error instanceof NotFoundException) {
        throw error;
      }
      ErrorLogger.logServiceError('BookingsService', 'checkout', error, {
        bookingId: booking?.bookingId || id,
        guestName: booking?.guestName,
        kotAmount: dto.kotAmount,
        totalAddOns: dto.addOns?.length || 0,
      });
      throw new InternalServerErrorException('Failed to complete checkout. Please verify all transactions and try again.');
    }
  }

  async cancel(id: number, userName?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = 'CANCELLED';
    booking.lastModifiedBy = userName || booking.lastModifiedBy;
    return this.bookingRepo.save(booking);
  }

  async refund(id: number, dto: RefundDto, userName?: string): Promise<Booking> {
    let booking;
    try {
      booking = await this.findOne(id);
      if (booking.status !== 'CANCELLED') {
        throw new NotFoundException('Booking must be cancelled before processing refund');
      }

      // Delete daybook income entries if requested
      if (dto.deleteDaybookEntry) {
        await this.daybookRepo.delete({ refBookingId: booking.bookingId, type: 'income' });
      }

      // Create daybook expense entry for refund
      if (dto.refundAmount > 0) {
        const refundEntry = this.daybookRepo.create({
          date: dto.refundDate,
          type: 'expense',
          category: 'Refund',
          description: `Refund - ${booking.guestName} (${booking.bookingId})`,
          amount: dto.refundAmount,
          paymentSource: this.normalizePaymentMode(dto.refundMode),
          paymentMode: dto.refundMode || 'Cash',
          refBookingId: booking.bookingId,
          guestName: booking.guestName,
        });
        await this.daybookRepo.save(refundEntry);
      }

      // Update booking remarks with refund note
      const refundNote = `[Refund ₹${dto.refundAmount} via ${dto.refundMode} on ${dto.refundDate} by ${userName || 'unknown'}]`;
      booking.remarks = (booking.remarks ? booking.remarks + '\n' : '') + refundNote;
      booking.lastModifiedBy = userName || booking.lastModifiedBy;

      return this.bookingRepo.save(booking);
    } catch (error) {
      // Don't wrap NotFoundException - let it pass through
      if (error instanceof NotFoundException) {
        throw error;
      }
      ErrorLogger.logPaymentError('refund', booking?.bookingId || 'unknown', dto.refundAmount, error);
      throw new InternalServerErrorException('Failed to process refund. Please verify the transaction and try again.');
    }
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

  async getAksOfficePayments(filters: { from?: string; to?: string; subCategory?: string }): Promise<AksOfficePayment[]> {
    const qb = this.aksOfficeRepo.createQueryBuilder('a')
      .orderBy('a.date', 'DESC')
      .addOrderBy('a.created_at', 'DESC');

    if (filters.from && filters.to) {
      qb.andWhere('a.date BETWEEN :from AND :to', { from: filters.from, to: filters.to });
    } else if (filters.from) {
      qb.andWhere('a.date >= :from', { from: filters.from });
    } else if (filters.to) {
      qb.andWhere('a.date <= :to', { to: filters.to });
    }

    if (filters.subCategory) {
      qb.andWhere('a.sub_category = :subCategory', { subCategory: filters.subCategory });
    }

    return qb.getMany();
  }

  async deleteAksOfficePayment(id: number): Promise<void> {
    const payment = await this.aksOfficeRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('AKS Office payment not found');
    await this.aksOfficeRepo.remove(payment);
  }

  // ===== Agent Settlements =====
  async createAgentSettlement(dto: AgentSettlementDto, userName?: string): Promise<AgentSettlement> {
    try {
      const settlement = this.settlementRepo.create({
        agentName: dto.agentName,
        amount: dto.amount,
        paymentMode: dto.paymentMode || 'Bank Transfer',
        date: dto.date,
        reference: dto.reference,
        createdBy: userName,
      });
      const saved = await this.settlementRepo.save(settlement);

      // Create daybook entry — money actually came to hotel
      if (dto.amount > 0) {
        await this.createDaybookEntry({
          date: dto.date,
          category: 'Room Rent',
          incomeSource: 'Agent Settlement',
          description: `Settlement from ${dto.agentName}${dto.reference ? ' - ' + dto.reference : ''}`,
          amount: dto.amount,
          paymentMode: dto.paymentMode || 'Bank Transfer',
          refBookingId: 'SETTLEMENT-' + saved.id,
          guestName: dto.agentName,
        });
      }

      return saved;
    } catch (error) {
      ErrorLogger.logPaymentError('createAgentSettlement', dto.agentName, dto.amount, error);
      throw new InternalServerErrorException('Failed to create agent settlement. Please verify the details and try again.');
    }
  }

  async getAgentSettlements(filters: { agent?: string; from?: string; to?: string }): Promise<AgentSettlement[]> {
    const qb = this.settlementRepo.createQueryBuilder('s')
      .orderBy('s.date', 'DESC')
      .addOrderBy('s.created_at', 'DESC');

    if (filters.agent) {
      qb.andWhere('s.agent_name = :agent', { agent: filters.agent });
    }
    if (filters.from) {
      qb.andWhere('s.date >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('s.date <= :to', { to: filters.to });
    }

    return qb.getMany();
  }

  async deleteAgentSettlement(id: number): Promise<void> {
    const settlement = await this.settlementRepo.findOne({ where: { id } });
    if (!settlement) throw new NotFoundException('Settlement not found');
    // Also remove corresponding daybook entry
    await this.daybookRepo.delete({ refBookingId: 'SETTLEMENT-' + id });
    await this.settlementRepo.remove(settlement);
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
      if (b.status === 'CANCELLED' || b.status === 'DELETED') continue;
      const totalReceived = Number(b.advanceReceived || 0) + Number(b.balanceReceived || 0);
      let pending = Number(b.totalAmount || 0) - totalReceived;
      // AKS Office COLLECTED bookings have zero pending (paid via AKS Office)
      if (b.status === 'COLLECTED' && pending > 0) pending = 0;

      if (b.checkIn === today && !b.checkedIn) checkinGuests.push(b);
      if (b.checkedIn && !b.checkedOut && b.checkOut >= today) {
        inhouseGuests.push(b);
      }
      // Checkout guest list: always based on checkout date
      if (b.checkOut === today && !b.checkedOut) {
        checkoutGuests.push(b);
      }

      // Today Collection stats: based on paymentType
      let showInTodayCollection = false;
      if (b.paymentType === 'Pay at Check-in') {
        showInTodayCollection = (b.checkIn === today);
      } else if (b.paymentType === 'Postpaid') {
        showInTodayCollection = (b.checkOut === today && !b.checkedOut);
      } else if (b.paymentType === 'Prepaid') {
        showInTodayCollection = (b.advanceDate === today);
      } else if (b.paymentType === 'Ledger') {
        showInTodayCollection = (b.checkOut === today && !b.checkedOut);
      } else {
        // Fallback for old bookings without paymentType
        showInTodayCollection = (b.checkOut === today && !b.checkedOut);
      }

      if (showInTodayCollection) {
        todayCollectionAmt += Number(b.totalAmount || 0);
        todayCollectedAmt += totalReceived;
        if (pending > 0) todayPendingAmt += pending;
      }
      if (b.paymentType === 'Ledger') {
        // Agent ledger: pending = (totalAmount - hotelShare) - received
        const agentCommission = Number(b.totalAmount || 0) - Number(b.hotelShare || 0);
        const agentPending = Math.max(0, agentCommission - totalReceived);
        if (agentPending > 0) {
          ledgerDueAmt += agentPending;
          const agent = b.sourceName || 'Unknown Agent';
          ledgerByAgent[agent] = (ledgerByAgent[agent] || 0) + agentPending;
        }
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
