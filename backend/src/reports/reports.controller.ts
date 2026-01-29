import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('source')
  getSourceReport(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getSourceReport(from, to);
  }

  @Get('payment')
  getPaymentReport(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getPaymentReport(from, to);
  }

  @Get('monthly')
  getMonthlyReport(@Query('month') month: string) {
    return this.reportsService.getMonthlyReport(month);
  }

  @Get('ledger')
  getLedgerReport(
    @Query('agent') agent: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getLedgerReport(agent, from, to);
  }

  @Get('occupancy')
  getOccupancyReport(
    @Query('type') type: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.reportsService.getOccupancyReport(type, month, year);
  }

  @Get('salary')
  getSalaryReport(@Query('month') month: string) {
    return this.reportsService.getSalaryReport(month);
  }

  @Get('summary')
  getSummaryData(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getSummaryData(from, to);
  }

  @Get('inventory')
  getInventoryData(@Query('month') month: string) {
    return this.reportsService.getInventoryData(month);
  }
}
