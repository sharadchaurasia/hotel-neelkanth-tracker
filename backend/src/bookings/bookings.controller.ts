import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, Res,
  BadRequestException, ForbiddenException, NotFoundException,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import type { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookingsService } from './bookings.service';
import { InvoiceService } from './invoice.service';
import { CreateBookingDto, CollectPaymentDto, CheckinDto, CheckoutDto, RescheduleDto, AgentSettlementDto, RefundDto } from './dto/create-booking.dto';
import { RequirePermissions, CurrentUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'id-proofs');
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}
const PAYMENT_PROOFS_DIR = join(process.cwd(), 'uploads', 'payment-proofs');
if (!existsSync(PAYMENT_PROOFS_DIR)) {
  mkdirSync(PAYMENT_PROOFS_DIR, { recursive: true });
}

// IMPORTANT: Do NOT add 'api/' prefix here
// Global prefix 'api' is set in main.ts
// This becomes /api/bookings automatically
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get('dashboard/stats')
  @RequirePermissions('dashboard', 'view')
  getDashboardStats() {
    return this.bookingsService.getDashboardStats();
  }

  @Get('analytics')
  @RequirePermissions('dashboard', 'view')
  getAnalytics(@Query('period') period?: string) {
    return this.bookingsService.getAnalytics(period || '30days');
  }

  @Get()
  @RequirePermissions('bookings', 'view')
  findAll(
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('paymentType') paymentType?: string,
    @Query('agent') agent?: string,
    @Query('viewBy') viewBy?: string,
  ) {
    return this.bookingsService.findAll({ date, status, source, paymentType, agent, viewBy });
  }

  @Get('aks-office-payments')
  @RequirePermissions('bookings', 'view')
  getAksOfficePayments(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('subCategory') subCategory?: string,
  ) {
    return this.bookingsService.getAksOfficePayments({ from, to, subCategory });
  }

  @Patch('aks-office-payments/:paymentId')
  @RequirePermissions('bookings', 'edit')
  updateAksOfficePayment(
    @CurrentUser() user: User,
    @Param('paymentId') paymentId: string,
    @Body() dto: { subCategory: string }
  ) {
    return this.bookingsService.updateAksOfficePayment(+paymentId, dto.subCategory, user.name);
  }

  @Delete('aks-office-payments/:paymentId')
  @RequirePermissions('bookings', 'delete')
  deleteAksOfficePayment(@CurrentUser() user: User, @Param('paymentId') paymentId: string) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can delete AKS Office payments');
    }
    return this.bookingsService.deleteAksOfficePayment(+paymentId);
  }

  @Get('agent-settlements')
  @RequirePermissions('bookings', 'view')
  getAgentSettlements(
    @Query('agent') agent?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.bookingsService.getAgentSettlements({ agent, from, to });
  }

  @Post('agent-settlements')
  @RequirePermissions('bookings', 'edit')
  createAgentSettlement(@CurrentUser() user: User, @Body() dto: AgentSettlementDto) {
    return this.bookingsService.createAgentSettlement(dto, user.name);
  }

  @Delete('agent-settlements/:settlementId')
  @RequirePermissions('bookings', 'delete')
  deleteAgentSettlement(@CurrentUser() user: User, @Param('settlementId') settlementId: string) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can delete settlements');
    }
    return this.bookingsService.deleteAgentSettlement(+settlementId);
  }

  @Get('guest-history/:phone')
  @RequirePermissions('bookings', 'view')
  getGuestHistory(@Param('phone') phone: string) {
    return this.bookingsService.getGuestHistory(phone);
  }

  @Get(':id')
  @RequirePermissions('bookings', 'view')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Post()
  @RequirePermissions('bookings', 'create')
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('bookings', 'edit')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: Partial<CreateBookingDto>) {
    return this.bookingsService.update(+id, dto, user.name);
  }

  @Delete(':id')
  @RequirePermissions('bookings', 'delete')
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can delete bookings');
    }
    return this.bookingsService.delete(+id, user.name);
  }

  @Post(':id/collect')
  @RequirePermissions('bookings', 'edit')
  collectPayment(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: CollectPaymentDto) {
    return this.bookingsService.collectPayment(+id, dto, user.name);
  }

  @Post(':id/checkin')
  @RequirePermissions('bookings', 'edit')
  checkin(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: CheckinDto) {
    return this.bookingsService.checkin(+id, dto, user.name);
  }

  @Post(':id/checkout')
  @RequirePermissions('bookings', 'edit')
  checkout(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: CheckoutDto) {
    return this.bookingsService.checkout(+id, dto, user.name);
  }

  @Post(':id/cancel')
  @RequirePermissions('bookings', 'edit')
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.cancel(+id, user.name);
  }

  @Post(':id/refund')
  @RequirePermissions('bookings', 'edit')
  refund(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: RefundDto) {
    return this.bookingsService.refund(+id, dto, user.name);
  }

  @Post(':id/reschedule')
  @RequirePermissions('bookings', 'edit')
  reschedule(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.bookingsService.reschedule(+id, dto, user.name);
  }

  @Get(':id/invoice')
  @RequirePermissions('bookings', 'view')
  async getInvoice(@Param('id') id: string, @Res() res: Response) {
    const html = await this.invoiceService.generateInvoiceHtml(+id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  // ===== ID Proof Upload (front / back) with Gemini AI validation =====

  private async validateIdProofWithAI(filePath: string, mimeType: string): Promise<{ valid: boolean; message: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // If no key configured, skip AI validation
      return { valid: true, message: 'AI validation skipped (no API key)' };
    }
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const imageBuffer = readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType || 'image/jpeg',
          },
        },
        'Look at this image carefully. Is this a photo or scan of an identity document or ID card? ' +
        'Valid examples: Aadhaar card, PAN card, driving license, passport, voter ID, ' +
        'any government-issued ID card, hotel registration card, or similar official document. ' +
        'Respond with ONLY the word "YES" if it is an ID document, or "NO" if it is a random photo, selfie, scenery, or anything that is NOT an identity document.',
      ]);
      const text = result.response.text().trim().toUpperCase();
      const isValid = text.startsWith('YES');
      return {
        valid: isValid,
        message: isValid
          ? 'Valid ID proof detected'
          : 'This does not appear to be an ID card. Please upload a clear photo of the guest\'s identity document (Aadhaar, PAN, Passport, DL, etc.).',
      };
    } catch (e) {
      // On AI failure, allow upload with warning
      return { valid: true, message: 'AI validation unavailable, upload accepted' };
    }
  }

  @Post(':id/id-proof')
  @RequirePermissions('bookings', 'edit')
  @UseInterceptors(FileInterceptor('idProof', {
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (req, file, cb) => {
        const side = req.query.side === 'back' ? 'back' : 'front';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
        cb(null, 'id-' + req.params.id + '-' + side + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp|heic|heif)$/)) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadIdProof(
    @Param('id') id: string,
    @Query('side') side: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new NotFoundException('No file uploaded');

    const sideKey = side === 'back' ? 'back' : 'front';

    // AI validation
    const validation = await this.validateIdProofWithAI(
      join(UPLOADS_DIR, file.filename),
      file.mimetype,
    );
    if (!validation.valid) {
      // Delete the uploaded file since it's not a valid ID
      unlinkSync(join(UPLOADS_DIR, file.filename));
      throw new BadRequestException(validation.message);
    }

    const booking = await this.bookingsService.findOne(+id);

    // Delete old file for this side if exists
    const oldPath = sideKey === 'front' ? booking.idProofFrontPath : booking.idProofBackPath;
    if (oldPath) {
      const fullOldPath = join(UPLOADS_DIR, oldPath);
      if (existsSync(fullOldPath)) unlinkSync(fullOldPath);
    }

    if (sideKey === 'front') {
      booking.idProofFrontPath = file.filename;
    } else {
      booking.idProofBackPath = file.filename;
    }

    await this.bookingsService.saveBooking(booking);
    return { success: true, side: sideKey, filename: file.filename, aiMessage: validation.message };
  }

  @Get(':id/id-proof')
  @RequirePermissions('bookings', 'view')
  async getIdProof(
    @Param('id') id: string,
    @Query('side') side: string,
    @Res() res: Response,
  ) {
    const booking = await this.bookingsService.findOne(+id);
    const sideKey = side === 'back' ? 'back' : 'front';
    const fileName = sideKey === 'front' ? booking.idProofFrontPath : booking.idProofBackPath;

    if (!fileName) {
      throw new NotFoundException(`No ID proof (${sideKey}) uploaded`);
    }
    const filePath = join(UPLOADS_DIR, fileName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('ID proof file not found');
    }
    res.sendFile(filePath);
  }

  @Delete(':id/id-proof')
  @RequirePermissions('bookings', 'edit')
  async deleteIdProof(
    @Param('id') id: string,
    @Query('side') side: string,
  ) {
    const booking = await this.bookingsService.findOne(+id);
    const sideKey = side === 'back' ? 'back' : 'front';
    const fileName = sideKey === 'front' ? booking.idProofFrontPath : booking.idProofBackPath;

    if (fileName) {
      const filePath = join(UPLOADS_DIR, fileName);
      if (existsSync(filePath)) unlinkSync(filePath);
      if (sideKey === 'front') {
        booking.idProofFrontPath = null;
      } else {
        booking.idProofBackPath = null;
      }
      await this.bookingsService.saveBooking(booking);
    }
    return { success: true, side: sideKey };
  }

  // ===== Payment Proof Upload =====

  @Post(':id/payment-proof')
  @RequirePermissions('bookings', 'edit')
  @UseInterceptors(FileInterceptor('paymentProof', {
    storage: diskStorage({
      destination: PAYMENT_PROOFS_DIR,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
        cb(null, 'pay-' + req.params.id + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp|heic|heif)$/)) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadPaymentProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new NotFoundException('No file uploaded');
    const booking = await this.bookingsService.findOne(+id);
    if (booking.paymentProofPath) {
      const old = join(PAYMENT_PROOFS_DIR, booking.paymentProofPath);
      if (existsSync(old)) unlinkSync(old);
    }
    booking.paymentProofPath = file.filename;
    await this.bookingsService.saveBooking(booking);
    return { success: true, filename: file.filename };
  }

  @Get(':id/payment-proof')
  @RequirePermissions('bookings', 'view')
  async getPaymentProof(@Param('id') id: string, @Res() res: Response) {
    const booking = await this.bookingsService.findOne(+id);
    if (!booking.paymentProofPath) throw new NotFoundException('No payment proof uploaded');
    const filePath = join(PAYMENT_PROOFS_DIR, booking.paymentProofPath);
    if (!existsSync(filePath)) throw new NotFoundException('Payment proof file not found');
    res.sendFile(filePath);
  }

  @Delete(':id/payment-proof')
  @RequirePermissions('bookings', 'edit')
  async deletePaymentProof(@Param('id') id: string) {
    const booking = await this.bookingsService.findOne(+id);
    if (booking.paymentProofPath) {
      const filePath = join(PAYMENT_PROOFS_DIR, booking.paymentProofPath);
      if (existsSync(filePath)) unlinkSync(filePath);
      booking.paymentProofPath = null;
      await this.bookingsService.saveBooking(booking);
    }
    return { success: true };
  }
}
