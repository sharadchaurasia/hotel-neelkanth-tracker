import { Controller, Get, Post, Delete, Param, Body, Query, ForbiddenException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { KotService } from './kot.service';
import { RequirePermissions, CurrentUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

// IMPORTANT: Do NOT add 'api/' prefix here
// Global prefix 'api' is set in main.ts
// This becomes /api/kot automatically
@Controller('kot')
export class KotController {
  constructor(private readonly kotService: KotService) {}

  @Post()
  @RequirePermissions('kot', 'create')
  create(
    @Body() dto: {
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
    },
    @CurrentUser() user: User,
  ) {
    return this.kotService.create(dto, user.name);
  }

  @Get()
  @RequirePermissions('kot', 'view')
  findAll(@Query('date') date?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.kotService.findAll(date, from, to);
  }

  @Get('checked-in-guests')
  @RequirePermissions('kot', 'view')
  getCheckedInGuests() {
    return this.kotService.getCheckedInGuests();
  }

  @Get('by-booking/:bookingId')
  @RequirePermissions('kot', 'view')
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.kotService.findByBooking(bookingId);
  }

  @Get('unpaid/:bookingId')
  @RequirePermissions('kot', 'view')
  getUnpaid(@Param('bookingId') bookingId: string) {
    return this.kotService.getUnpaidByBooking(bookingId);
  }

  @Get('combined-bill/:bookingId')
  @RequirePermissions('kot', 'view')
  async getCombinedBill(@Param('bookingId') bookingId: string, @Res() res: Response) {
    const html = await this.kotService.generateCombinedBillHtml(bookingId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get(':id/bill')
  @RequirePermissions('kot', 'view')
  async getBill(@Param('id') id: string, @Res() res: Response) {
    const html = await this.kotService.generateBillHtml(+id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Post('mark-paid/:bookingId')
  @RequirePermissions('kot', 'create')
  markPaid(
    @Param('bookingId') bookingId: string,
    @Body() body: { paymentMode: string },
    @CurrentUser() user: User,
  ) {
    return this.kotService.markPaidByBooking(bookingId, body.paymentMode, user.name);
  }

  @Delete(':id')
  @RequirePermissions('kot', 'delete')
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can delete KOT orders');
    }
    return this.kotService.delete(+id);
  }
}
