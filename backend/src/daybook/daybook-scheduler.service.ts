import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DaybookService } from './daybook.service';

@Injectable()
export class DaybookSchedulerService {
  private readonly logger = new Logger(DaybookSchedulerService.name);

  constructor(private daybookService: DaybookService) {}

  // Run at 11:59 PM IST every day
  @Cron('59 23 * * *', {
    name: 'daily-balance-carry-forward',
    timeZone: 'Asia/Kolkata',
  })
  async handleDailyBalanceCarryForward() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    this.logger.log(`[${now.toISOString()}] Starting daily balance carry forward for ${today}`);

    try {
      // Calculate and save today's closing balance
      const balance = await this.daybookService.calculateDayBalance(today);
      await this.daybookService.saveCalculatedBalance(today, balance);

      this.logger.log(`Today's closing: Cash=₹${balance.cashClosing}, Bank=₹${balance.bankSbiClosing}`);

      // Carry forward to tomorrow
      await this.daybookService.carryForwardBalance(today);

      this.logger.log(`Balance carried forward to tomorrow successfully`);

      // Optional: Lock today's balance to prevent future edits
      // await this.daybookService.lockBalance(today);

    } catch (error) {
      this.logger.error(`Balance carry forward failed for ${today}:`, error.message);
      this.logger.error(error.stack);
    }
  }

  // Run every hour to catch any missed carry forwards (safety net)
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'hourly-balance-check',
    timeZone: 'Asia/Kolkata',
  })
  async handleHourlyBalanceCheck() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
      // Check if yesterday's balance was calculated
      const yesterdayBalance = await this.daybookService.getBalance(yesterdayStr);

      if (!yesterdayBalance || !yesterdayBalance.isCalculated) {
        this.logger.warn(`Yesterday (${yesterdayStr}) balance not calculated - running now`);
        await this.daybookService.carryForwardBalance(yesterdayStr);
      }

      // Check if today's opening balance exists
      const todayBalance = await this.daybookService.getBalance(today);

      if (!todayBalance) {
        this.logger.warn(`Today (${today}) balance not found - running carry forward`);
        await this.daybookService.carryForwardBalance(yesterdayStr);
      }

    } catch (error) {
      // Silent error - this is just a safety check
      this.logger.debug(`Hourly balance check error: ${error.message}`);
    }
  }

  // Manual trigger for admin (can be called via controller if needed)
  async manualCarryForward(date: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Manual carry forward triggered for ${date}`);

    try {
      await this.daybookService.carryForwardBalance(date);
      return { success: true, message: `Balance carried forward from ${date} successfully` };
    } catch (error) {
      this.logger.error(`Manual carry forward failed for ${date}:`, error.message);
      return { success: false, message: error.message };
    }
  }

  // Recalculate all balances from a specific date (admin tool)
  async recalculateFrom(date: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Recalculating balances from ${date}`);

    try {
      await this.daybookService.recalculateSubsequentDays(date);
      return { success: true, message: `Balances recalculated from ${date} successfully` };
    } catch (error) {
      this.logger.error(`Recalculation failed from ${date}:`, error.message);
      return { success: false, message: error.message };
    }
  }
}
