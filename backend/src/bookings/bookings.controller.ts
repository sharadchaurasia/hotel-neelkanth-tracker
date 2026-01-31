import { Controller, Get, Post, Put, Delete, Param, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BookingsService } from './bookings.service';
import { InvoiceService } from './invoice.service';
import { CreateBookingDto, CollectPaymentDto, CheckinDto, CheckoutDto, RescheduleDto } from './dto/create-booking.dto';
import { RequirePermissions, CurrentUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

@Controller('api/bookings')
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
  delete(@Param('id') id: string) {
    return this.bookingsService.delete(+id);
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
}
