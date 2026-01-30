import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RequirePermissions } from '../auth/decorators';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('source')
  @RequirePermissions('reports', 'view')
  getSourceReport(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getSourceReport(from, to);
  }

  @Get('payment')
  @RequirePermissions('reports', 'view')
  getPaymentReport(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getPaymentReport(from, to);
  }

  @Get('monthly')
  @RequirePermissions('reports', 'view')
  getMonthlyReport(@Query('month') month: string) {
    return this.reportsService.getMonthlyReport(month);
  }

  @Get('ledger')
  @RequirePermissions('ledger', 'view')
  getLedgerReport(
    @Query('agent') agent: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getLedgerReport(agent, from, to);
  }

  @Get('occupancy')
  @RequirePermissions('reports', 'view')
  getOccupancyReport(
    @Query('type') type: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.reportsService.getOccupancyReport(type, month, year);
  }

  @Get('salary')
  @RequirePermissions('salary', 'view')
  getSalaryReport(@Query('month') month: string) {
    return this.reportsService.getSalaryReport(month);
  }

  @Get('pnl')
  @RequirePermissions('reports', 'view')
  getPnlReport(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getPnlReport(from, to);
  }

  @Get('pnl-table')
  @RequirePermissions('reports', 'view')
  getPnlTable(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getPnlTable(from, to);
  }

  @Get('summary')
  @RequirePermissions('reports', 'view')
  getSummaryData(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getSummaryData(from, to);
  }

  @Get('inventory')
  @RequirePermissions('inventory', 'view')
  getInventoryData(@Query('month') month: string) {
    return this.reportsService.getInventoryData(month);
  }
}
