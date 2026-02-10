import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DaybookService } from '../src/daybook/daybook.service';

async function migrateExistingBalances() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const daybookService = app.get(DaybookService);

  console.log('=====================================================');
  console.log('  Module 9: Balance Carry Forward Data Migration');
  console.log('=====================================================\n');

  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`Migration date: ${today}\n`);

    // Get all balances (manually entered opening balances)
    const allBalances = await daybookService['balanceRepo'].find({
      order: { date: 'ASC' },
    });

    if (allBalances.length === 0) {
      console.log('❌ No existing balances found. Please set up an initial balance first.');
      await app.close();
      return;
    }

    console.log(`📊 Found ${allBalances.length} existing balance entries\n`);

    // For each date, calculate and save closing balances
    for (const balance of allBalances) {
      const date = balance.date;

      try {
        console.log(`Processing ${date}...`);

        // Calculate balance for this date
        const calculated = await daybookService.calculateDayBalance(date);

        console.log(`  Opening: Cash=₹${calculated.cashOpening}, Bank=₹${calculated.bankSbiOpening}`);
        console.log(`  Closing: Cash=₹${calculated.cashClosing}, Bank=₹${calculated.bankSbiClosing}`);

        // Save the calculated balance
        await daybookService.saveCalculatedBalance(date, calculated);

        console.log(`  ✓ Saved\n`);
      } catch (error) {
        console.error(`  ✗ Error processing ${date}:`, error.message);
      }
    }

    // Now carry forward from the last balance date to today
    const lastBalance = allBalances[allBalances.length - 1];
    const lastDate = lastBalance.date;

    if (lastDate < today) {
      console.log(`\n🔄 Carrying forward balances from ${lastDate} to ${today}...\n`);

      let currentDate = lastDate;
      while (currentDate < today) {
        try {
          await daybookService.carryForwardBalance(currentDate);
          const nextDate = daybookService['getNextDate'](currentDate);
          console.log(`  ✓ Carried forward from ${currentDate} to ${nextDate}`);
          currentDate = nextDate;
        } catch (error) {
          console.error(`  ✗ Error carrying forward from ${currentDate}:`, error.message);
          break;
        }
      }
    }

    // Calculate today's balance
    console.log(`\n📅 Calculating today's balance (${today})...`);
    const todayBalance = await daybookService.calculateDayBalance(today);
    await daybookService.saveCalculatedBalance(today, todayBalance);
    console.log(`  Opening: Cash=₹${todayBalance.cashOpening}, Bank=₹${todayBalance.bankSbiOpening}`);
    console.log(`  Closing: Cash=₹${todayBalance.cashClosing}, Bank=₹${todayBalance.bankSbiClosing}`);

    console.log('\n=====================================================');
    console.log('  ✅ Migration completed successfully!');
    console.log('=====================================================\n');
    console.log('Next steps:');
    console.log('1. Verify balances in the daybook');
    console.log('2. Cron job will run automatically at 11:59 PM daily');
    console.log('3. Opening balances will be carried forward automatically\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
  }

  await app.close();
}

migrateExistingBalances()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
