import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, CollectPaymentDto, CheckinDto, CheckoutDto, RescheduleDto } from './dto/create-booking.dto';

@Controller('api/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.bookingsService.getDashboardStats();
  }

  @Get()
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateBookingDto>) {
    return this.bookingsService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.bookingsService.delete(+id);
  }

  @Post(':id/collect')
  collectPayment(@Param('id') id: string, @Body() dto: CollectPaymentDto) {
    return this.bookingsService.collectPayment(+id, dto);
  }

  @Post(':id/checkin')
  checkin(@Param('id') id: string, @Body() dto: CheckinDto) {
    return this.bookingsService.checkin(+id, dto);
  }

  @Post(':id/checkout')
  checkout(@Param('id') id: string, @Body() dto: CheckoutDto) {
    return this.bookingsService.checkout(+id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(+id);
  }

  @Post(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.bookingsService.reschedule(+id, dto);
  }
}
