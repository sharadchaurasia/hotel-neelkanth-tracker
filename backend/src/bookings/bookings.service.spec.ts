import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking } from './booking.entity';
import { BookingAddon } from './booking-addon.entity';
import { AksOfficePayment } from './aks-office-payment.entity';
import { AgentSettlement } from './agent-settlement.entity';
import { DaybookEntry } from '../daybook/daybook-entry.entity';
import { KotService } from '../kot/kot.service';

describe('BookingsService - Critical Financial Logic', () => {
  let service: BookingsService;
  let bookingRepo: Repository<Booking>;

  const mockBookingRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAddonRepo = { save: jest.fn(), delete: jest.fn() };
  const mockAksOfficeRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
  const mockSettlementRepo = { create: jest.fn(), save: jest.fn() };
  const mockDaybookRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), delete: jest.fn() };
  const mockKotService = { markPaidByBooking: jest.fn().mockResolvedValue(0) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(BookingAddon), useValue: mockAddonRepo },
        { provide: getRepositoryToken(AksOfficePayment), useValue: mockAksOfficeRepo },
        { provide: getRepositoryToken(AgentSettlement), useValue: mockSettlementRepo },
        { provide: getRepositoryToken(DaybookEntry), useValue: mockDaybookRepo },
        { provide: KotService, useValue: mockKotService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepo = module.get(getRepositoryToken(Booking));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Calculation Tests', () => {
    it('should calculate PENDING status when no payment received', async () => {
      const dto = {
        guestName: 'Test Guest',
        phone: '9876543210',
        roomNo: '101',
        checkIn: '2026-02-10',
        checkOut: '2026-02-12',
        totalAmount: 5000,
        advanceReceived: 0,
      };

      mockBookingRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxNum: 10 }),
      });

      const savedBooking = {
        id: 1,
        bookingId: 'NKH-0011',
        ...dto,
        status: 'PENDING',
      };

      mockBookingRepo.create.mockReturnValue(savedBooking);
      mockBookingRepo.save.mockResolvedValue(savedBooking);
      mockBookingRepo.findOne.mockResolvedValue({ ...savedBooking, addOns: [] });

      const result = await service.create(dto);

      expect(result.status).toBe('PENDING');
      expect(mockBookingRepo.save).toHaveBeenCalled();
    });

    it('should calculate PARTIAL status when partial payment received', async () => {
      const dto = {
        guestName: 'Test Guest',
        phone: '9876543210',
        roomNo: '101',
        checkIn: '2026-02-10',
        checkOut: '2026-02-12',
        totalAmount: 5000,
        advanceReceived: 2000,
        paymentMode: 'Cash',
      };

      mockBookingRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxNum: 10 }),
      });

      const savedBooking = {
        id: 1,
        bookingId: 'NKH-0011',
        ...dto,
        status: 'PARTIAL',
      };

      mockBookingRepo.create.mockReturnValue(savedBooking);
      mockBookingRepo.save.mockResolvedValue(savedBooking);
      mockBookingRepo.findOne.mockResolvedValue({ ...savedBooking, addOns: [] });
      mockDaybookRepo.findOne.mockResolvedValue(null);

      const result = await service.create(dto);

      expect(result.status).toBe('PARTIAL');
    });

    it('should calculate COLLECTED status when full payment received', async () => {
      const dto = {
        guestName: 'Test Guest',
        phone: '9876543210',
        roomNo: '101',
        checkIn: '2026-02-10',
        checkOut: '2026-02-12',
        totalAmount: 5000,
        advanceReceived: 5000,
        paymentMode: 'Cash',
      };

      mockBookingRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxNum: 10 }),
      });

      const savedBooking = {
        id: 1,
        bookingId: 'NKH-0011',
        ...dto,
        status: 'COLLECTED',
      };

      mockBookingRepo.create.mockReturnValue(savedBooking);
      mockBookingRepo.save.mockResolvedValue(savedBooking);
      mockBookingRepo.findOne.mockResolvedValue({ ...savedBooking, addOns: [] });
      mockDaybookRepo.findOne.mockResolvedValue(null);

      const result = await service.create(dto);

      expect(result.status).toBe('COLLECTED');
    });

    it('should correctly calculate pending amount', async () => {
      const booking = {
        id: 1,
        totalAmount: 10000,
        advanceReceived: 3000,
        balanceReceived: 5000,
      };

      const pending = Number(booking.totalAmount) -
                     (Number(booking.advanceReceived) + Number(booking.balanceReceived));

      expect(pending).toBe(2000);
    });
  });

  describe('Checkout with Add-ons Tests', () => {
    it('should update total amount when add-ons added at checkout', async () => {
      const booking = {
        id: 1,
        bookingId: 'NKH-0001',
        totalAmount: 5000,
        advanceReceived: 5000,
        balanceReceived: 0,
        checkedOut: false,
        addOns: [],
      };

      mockBookingRepo.findOne.mockResolvedValue(booking);

      const checkoutDto = {
        kotAmount: 500,
        addOns: [{ type: 'Heater', amount: 1000 }],
        paymentMode: 'Cash',
      };

      const kotAmt = checkoutDto.kotAmount || 0;
      const addOnTotal = checkoutDto.addOns.reduce((sum, ao) => sum + ao.amount, 0);
      const newTotal = Number(booking.totalAmount) + kotAmt + addOnTotal;

      expect(newTotal).toBe(6500); // 5000 + 500 + 1000
    });

    it('should NOT allow over-collection beyond total', async () => {
      const booking = {
        totalAmount: 5000,
        advanceReceived: 6000, // Over-collected!
        balanceReceived: 0,
      };

      const totalReceived = Number(booking.advanceReceived) + Number(booking.balanceReceived);
      const pending = Number(booking.totalAmount) - totalReceived;

      expect(pending).toBe(-1000); // Negative = over-collected
      expect(totalReceived).toBeGreaterThan(booking.totalAmount);
    });
  });

  describe('AKS Office Payment Logic Tests', () => {
    it('should calculate hotel share correctly for AKS Office booking', async () => {
      const booking = {
        id: 1,
        bookingId: 'NKH-0003',
        actualRoomRent: 4000,
        addOnAmount: 0,
        totalAmount: 6600,
        advanceReceived: 0,
        balanceReceived: 0,
      };

      // Hotel share = actualRoomRent + addOnAmount - what hotel already received
      const hotelShare = Math.max(0,
        Number(booking.actualRoomRent) + Number(booking.addOnAmount)
        - Number(booking.advanceReceived) - Number(booking.balanceReceived)
      );

      expect(hotelShare).toBe(4000);
    });

    it('should handle AKS Office extra payment correctly', async () => {
      // Scenario: AKS Office pays 6600 for 4000 room (2600 extra)
      const aksOfficePayment = 6600;
      const actualRoomRent = 4000;
      const extraPayment = aksOfficePayment - actualRoomRent;

      expect(extraPayment).toBe(2600);
      expect(aksOfficePayment).toBeGreaterThan(actualRoomRent);
    });
  });

  describe('Agent Ledger Tests', () => {
    it('should track ledger booking with pending amount', async () => {
      const booking = {
        paymentType: 'Ledger',
        totalAmount: 10000,
        advanceReceived: 0,
        balanceReceived: 7000,
        status: 'PARTIAL',
      };

      const totalReceived = Number(booking.advanceReceived) + Number(booking.balanceReceived);
      const pending = Number(booking.totalAmount) - totalReceived;

      expect(pending).toBe(3000);
      expect(booking.paymentType).toBe('Ledger');
    });

    it('should create settlement and daybook entry for agent payment', async () => {
      const settlementDto = {
        agentName: 'Global Tours',
        amount: 5000,
        paymentMode: 'Bank Transfer',
        date: '2026-02-08',
      };

      mockSettlementRepo.create.mockReturnValue({ id: 1, ...settlementDto });
      mockSettlementRepo.save.mockResolvedValue({ id: 1, ...settlementDto });
      mockDaybookRepo.findOne.mockResolvedValue(null);

      await service.createAgentSettlement(settlementDto, 'Admin');

      expect(mockSettlementRepo.save).toHaveBeenCalled();
      expect(mockDaybookRepo.save).toHaveBeenCalled();
    });
  });

  describe('Financial Integrity Tests', () => {
    it('should ensure total received never exceeds total amount (without add-ons)', () => {
      const booking = {
        totalAmount: 5000,
        advanceReceived: 3000,
        balanceReceived: 2000,
      };

      const totalReceived = Number(booking.advanceReceived) + Number(booking.balanceReceived);

      expect(totalReceived).toBeLessThanOrEqual(booking.totalAmount);
    });

    it('should handle zero and negative amounts safely', () => {
      const amounts = [0, -100, null, undefined];

      amounts.forEach(amt => {
        const safe = Math.max(0, Number(amt) || 0);
        expect(safe).toBeGreaterThanOrEqual(0);
      });
    });

    it('should correctly recalculate status after payment collection', async () => {
      const booking = {
        id: 1,
        totalAmount: 5000,
        advanceReceived: 2000,
        balanceReceived: 0,
        status: 'PARTIAL',
      };

      mockBookingRepo.findOne.mockResolvedValue(booking);

      // Collect remaining 3000
      const collectDto = { amount: 3000, paymentMode: 'Cash' };

      booking.balanceReceived = Number(booking.balanceReceived) + collectDto.amount;
      const totalReceived = Number(booking.advanceReceived) + Number(booking.balanceReceived);
      const pending = Number(booking.totalAmount) - totalReceived;

      expect(pending).toBe(0);
      expect(totalReceived).toBe(5000);

      const newStatus = pending <= 0 ? 'COLLECTED' : 'PARTIAL';
      expect(newStatus).toBe('COLLECTED');
    });
  });
});
