import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MonthEndService } from './month-end.service';
import { JwtAuthGuard } from '../auth/auth.guard';

// IMPORTANT: Do NOT add 'api/' prefix here
// Global prefix 'api' is set in main.ts
// This becomes /api/month-end automatically
@Controller('month-end')
@UseGuards(JwtAuthGuard)
export class MonthEndController {
  constructor(private readonly monthEndService: MonthEndService) {}

  /**
   * Get opening balance for a specific agent and month
   * GET /api/month-end/opening-balance?agent=AKS Office&month=2026-02
   */
  @Get('opening-balance')
  async getOpeningBalance(
    @Query('agent') agent: string,
    @Query('month') month: string,
  ) {
    const balance = await this.monthEndService.getOpeningBalance(agent, month);
    return { agent, month, openingBalance: balance };
  }

  /**
   * Set opening balance manually (for fixing current month)
   * POST /api/month-end/opening-balance
   * Body: { agent: "AKS Office", month: "2026-02", openingBalance: -18715, notes: "..." }
   */
  @Post('opening-balance')
  async setOpeningBalance(
    @Body('agent') agent: string,
    @Body('month') month: string,
    @Body('openingBalance') openingBalance: number,
    @Body('notes') notes?: string,
  ) {
    const result = await this.monthEndService.setOpeningBalance(agent, month, openingBalance, notes);
    return {
      success: true,
      message: 'Opening balance set successfully',
      data: result,
    };
  }

  /**
   * Calculate closing balances for a month
   * GET /api/month-end/closing-balances?month=2026-02
   */
  @Get('closing-balances')
  async getClosingBalances(@Query('month') month: string) {
    const balances = await this.monthEndService.calculateClosingBalances(month);
    return {
      month,
      closingBalances: balances,
    };
  }

  /**
   * Close current month and carry forward to next month
   * POST /api/month-end/carry-forward
   * Body: { month: "2026-02" }
   */
  @Post('carry-forward')
  async carryForward(@Body('month') month: string) {
    const result = await this.monthEndService.carryForwardToNextMonth(month);
    return result;
  }

  /**
   * Get all opening balances for a month
   * GET /api/month-end/all-openings?month=2026-02
   */
  @Get('all-openings')
  async getAllOpeningBalances(@Query('month') month: string) {
    const openings = await this.monthEndService.getMonthOpeningBalances(month);
    return {
      month,
      openings,
    };
  }
}
