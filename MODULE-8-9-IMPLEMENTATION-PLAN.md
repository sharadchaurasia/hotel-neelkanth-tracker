# MODULES 8 & 9 IMPLEMENTATION PLAN
## Hotel Neelkanth CRM - UI Consistency & Balance Carry Forward

**Date:** 2026-02-09
**Status:** Planning Phase
**Risk Level:** MEDIUM (Module 9 has data impact)

---

## MODULE 8: NEW BOOKING UI CONSISTENCY

### Current State Analysis

**Login Page Design System:**
- **Background:** `#1a2332` (dark blue-gray)
- **Card Background:** `#f5f3ef` (cream/beige)
- **Primary Color:** `#c9a35f` (gold)
- **Secondary Color:** `#6b7b93` (blue-gray)
- **Text Dark:** `#1a2332`
- **Text Light:** `#7a8699`
- **Label Color:** `#a67c52` (bronze)
- **Card Shadow:** `0 20px 60px rgba(0,0,0,0.3)`
- **Border Radius:** `10px` - `20px`
- **Input Padding:** `14px 16px`
- **Button Padding:** `16px`
- **Focus Ring:** `0 0 0 3px rgba(201,163,95,0.1)` (gold)

**Current Booking Modal Issues:**
- Uses dark theme with gradient sections
- Different color scheme (blue, gold, green, purple, orange)
- Modal-based instead of page-based
- Inconsistent with login page

### Implementation Plan

#### Step 1: Create Shared Style Constants
```typescript
// frontend/src/styles/theme.ts (NEW FILE)
export const THEME = {
  colors: {
    background: '#1a2332',
    cardBg: '#f5f3ef',
    primary: '#c9a35f',
    secondary: '#6b7b93',
    textDark: '#1a2332',
    textLight: '#7a8699',
    label: '#a67c52',
    border: '#e5e7eb',
    white: 'white',
  },
  shadows: {
    card: '0 20px 60px rgba(0,0,0,0.3)',
    input: '0 0 0 3px rgba(201,163,95,0.1)',
  },
  radius: {
    small: '8px',
    medium: '10px',
    large: '12px',
    xlarge: '20px',
  },
  spacing: {
    inputPadding: '14px 16px',
    buttonPadding: '16px',
    sectionGap: '24px',
  },
};

export const inputStyle = {
  width: '100%',
  padding: THEME.spacing.inputPadding,
  background: THEME.colors.white,
  border: `1px solid ${THEME.colors.border}`,
  borderRadius: THEME.radius.medium,
  fontSize: '15px',
  color: THEME.colors.textDark,
  outline: 'none',
  transition: 'all 0.2s',
};

export const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  color: THEME.colors.label,
  marginBottom: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

export const buttonPrimaryStyle = {
  padding: THEME.spacing.buttonPadding,
  background: THEME.colors.secondary,
  border: 'none',
  borderRadius: THEME.radius.medium,
  color: 'white',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export const sectionStyle = {
  marginBottom: THEME.spacing.sectionGap,
  padding: '20px',
  background: 'white',
  border: `1px solid ${THEME.colors.border}`,
  borderRadius: THEME.radius.large,
};
```

#### Step 2: Update Dashboard Booking Modal

**Option A: Convert Modal to Full Page** (RECOMMENDED)
```typescript
// Create new route: /bookings/new
// Benefits:
// - More space for form fields
// - Better mobile experience
// - Matches login page structure
// - Can use same layout pattern

// Route structure:
<Route path="/bookings/new" element={<NewBooking />} />
<Route path="/bookings/:id/edit" element={<EditBooking />} />
```

**Option B: Update Modal Styling** (Simpler but less ideal)
```typescript
// Keep modal but match login card styling
// - Remove gradient sections
// - Use cream background
// - Use gold accents
// - Simplify form layout
```

#### Step 3: Form Layout Structure

```
┌─────────────────────────────────────────┐
│         The Neelkanth Grand             │ ← Gold text
│         Hotel Management                │ ← Light gray
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  New Booking                            │ ← Card (cream bg)
│  ─────────────────────────────          │
│                                         │
│  GUEST INFORMATION                      │ ← Section
│  ┌─────────────────────────────────┐   │
│  │ Name: [________________]        │   │
│  │ Phone: [________________]       │   │
│  │ Adults: [__] Kids: [__]         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ROOM DETAILS                           │ ← Section
│  ┌─────────────────────────────────┐   │
│  │ Rooms: [__] Category: [______]  │   │
│  │ Meal Plan: [________________]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  BOOKING DATES                          │ ← Section
│  ┌─────────────────────────────────┐   │
│  │ Check-in: [__________]          │   │
│  │ Check-out: [__________]         │   │
│  │ Nights: 3                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ... (more sections)                    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     [Cancel]  [Create Booking]  │   │ ← Buttons
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### Step 4: Responsive Design

**Desktop (> 768px):**
- Max width: 900px
- Two-column layout for form fields
- Centered on page

**Tablet/Mobile (< 768px):**
- Full width with padding
- Single column layout
- Stack all fields vertically

### Files to Modify

**New Files:**
- `frontend/src/styles/theme.ts` - Shared design system
- `frontend/src/pages/NewBooking.tsx` - New full-page booking form
- `frontend/src/components/FormSection.tsx` - Reusable section component

**Modified Files:**
- `frontend/src/App.tsx` - Add new routes
- `frontend/src/pages/Dashboard.tsx` - Change "New Booking" button to navigate
- `frontend/src/components/Layout.tsx` - May need breadcrumb

### Migration Strategy

1. **Phase 1:** Create theme constants
2. **Phase 2:** Build new booking page with consistent styling
3. **Phase 3:** Update Dashboard to link to new page
4. **Phase 4:** Add edit booking page (same styling)
5. **Phase 5:** Remove old modal code (after testing)

### Testing Checklist
- [ ] New booking form matches login page colors
- [ ] All form fields work correctly
- [ ] Responsive on mobile/tablet
- [ ] Form validation works
- [ ] Navigation back to dashboard works
- [ ] Edit booking uses same style

---

## MODULE 9: DAILY BALANCE CARRY FORWARD

### Current State Analysis

**Existing DaybookBalance Table:**
```sql
CREATE TABLE daybook_balances (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  cash_opening DECIMAL(12, 2) DEFAULT 0,
  bank_sbi_opening DECIMAL(12, 2) DEFAULT 0
);
```

**Current Behavior:**
- Opening balances are **manually entered**
- No automatic carry forward
- No closing balance tracking
- No validation of data consistency

**Data Flow:**
```
Income Entries →
Expense Entries →
Manual Opening Balance Entry →
Display Closing Balance (calculated on-the-fly)
```

### Required Changes

#### 1. Database Schema Updates

**Add Closing Balance Fields:**
```sql
-- Migration: Add closing balances and calculation flag
ALTER TABLE daybook_balances
ADD COLUMN IF NOT EXISTS cash_closing DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_sbi_closing DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_calculated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_daybook_balances_date ON daybook_balances(date);
```

**Entity Update:**
```typescript
// backend/src/daybook/daybook-balance.entity.ts
@Entity('daybook_balances')
export class DaybookBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  date: string;

  @Column({ name: 'cash_opening', type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashOpening: number;

  @Column({ name: 'cash_closing', type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashClosing: number;

  @Column({ name: 'bank_sbi_opening', type: 'decimal', precision: 12, scale: 2, default: 0 })
  bankSbiOpening: number;

  @Column({ name: 'bank_sbi_closing', type: 'decimal', precision: 12, scale: 2, default: 0 })
  bankSbiClosing: number;

  @Column({ name: 'is_calculated', default: false })
  isCalculated: boolean;

  @Column({ name: 'calculated_at', type: 'timestamp', nullable: true })
  calculatedAt: Date;

  @Column({ default: false })
  locked: boolean; // Prevent changes to historical data
}
```

#### 2. Balance Calculation Logic

**Core Formula:**
```typescript
// For Date N:
Opening Balance = Previous Day (N-1) Closing Balance

Closing Balance = Opening Balance + Total Income - Total Expense

Where:
- Total Income = SUM(entries WHERE type='income' AND receivedIn='Cash'/'Bank Transfer')
- Total Expense = SUM(entries WHERE type='expense' AND paymentSource='Cash'/'SBI Neelkanth')
```

**Service Implementation:**
```typescript
// backend/src/daybook/daybook.service.ts

async calculateDayBalance(date: string): Promise<{
  cashOpening: number;
  cashClosing: number;
  bankSbiOpening: number;
  bankSbiClosing: number;
}> {
  // 1. Get previous day's closing
  const prevDate = this.getPreviousDate(date);
  const prevBalance = await this.balanceRepo.findOne({ where: { date: prevDate } });

  const cashOpening = prevBalance?.cashClosing || 0;
  const bankSbiOpening = prevBalance?.bankSbiClosing || 0;

  // 2. Get today's entries
  const entries = await this.entryRepo.find({ where: { date } });

  // 3. Calculate income by source
  const cashIncome = entries
    .filter(e => e.type === 'income' && e.receivedIn === 'Cash')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const bankIncome = entries
    .filter(e => e.type === 'income' && (e.receivedIn === 'Bank Transfer' || e.receivedIn === 'SBI Neelkanth'))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // 4. Calculate expense by source
  const cashExpense = entries
    .filter(e => e.type === 'expense' && e.paymentSource === 'Cash')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const bankExpense = entries
    .filter(e => e.type === 'expense' && (e.paymentSource === 'Bank Transfer' || e.paymentSource === 'SBI Neelkanth'))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // 5. Calculate closing
  const cashClosing = cashOpening + cashIncome - cashExpense;
  const bankSbiClosing = bankSbiOpening + bankIncome - bankExpense;

  return {
    cashOpening,
    cashClosing,
    bankSbiOpening,
    bankSbiClosing,
  };
}

async carryForwardBalance(fromDate: string): Promise<void> {
  const balance = await this.calculateDayBalance(fromDate);
  const nextDate = this.getNextDate(fromDate);

  // Check if next date exists
  let nextBalance = await this.balanceRepo.findOne({ where: { date: nextDate } });

  if (!nextBalance) {
    // Create new balance entry
    nextBalance = this.balanceRepo.create({
      date: nextDate,
      cashOpening: balance.cashClosing,
      bankSbiOpening: balance.bankSbiClosing,
      cashClosing: 0, // Will be calculated when day ends
      bankSbiClosing: 0,
      isCalculated: true,
      calculatedAt: new Date(),
    });
  } else if (!nextBalance.locked) {
    // Update opening balance (only if not locked)
    nextBalance.cashOpening = balance.cashClosing;
    nextBalance.bankSbiOpening = balance.bankSbiClosing;
    nextBalance.isCalculated = true;
    nextBalance.calculatedAt = new Date();
  }

  await this.balanceRepo.save(nextBalance);
}

async lockBalance(date: string): Promise<void> {
  const balance = await this.balanceRepo.findOne({ where: { date } });
  if (balance) {
    balance.locked = true;
    await this.balanceRepo.save(balance);
  }
}
```

#### 3. Automatic Carry Forward - Daily Job

**Option A: Scheduled Cron Job** (RECOMMENDED)
```typescript
// backend/src/daybook/daybook-scheduler.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DaybookService } from './daybook.service';

@Injectable()
export class DaybookSchedulerService {
  constructor(private daybookService: DaybookService) {}

  // Run at 11:59 PM every day
  @Cron('59 23 * * *', {
    name: 'daily-balance-carry-forward',
    timeZone: 'Asia/Kolkata',
  })
  async handleDailyBalanceCarryForward() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[${new Date().toISOString()}] Running daily balance carry forward for ${today}`);

    try {
      // Calculate today's closing
      const balance = await this.daybookService.calculateDayBalance(today);

      // Save today's balance
      await this.daybookService.saveBalance(today, balance);

      // Carry forward to tomorrow
      await this.daybookService.carryForwardBalance(today);

      // Lock today's balance (prevent future edits)
      await this.daybookService.lockBalance(today);

      console.log(`[${new Date().toISOString()}] Balance carry forward successful`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Balance carry forward failed:`, error);
    }
  }

  // Run at 12:01 AM on 1st of every month (month-end closing)
  @Cron('1 0 1 * *', {
    name: 'monthly-balance-closing',
    timeZone: 'Asia/Kolkata',
  })
  async handleMonthlyClosing() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const year = lastMonth.getFullYear();
    const month = String(lastMonth.getMonth() + 1).padStart(2, '0');

    console.log(`[${new Date().toISOString()}] Running monthly closing for ${year}-${month}`);

    // Generate month-end report
    // Lock all days in the month
    // etc.
  }
}
```

**Option B: Trigger on Entry Save** (Immediate)
```typescript
// In DaybookService, after adding/updating entry:
async afterEntrySave(date: string) {
  // Recalculate today's balance
  const balance = await this.calculateDayBalance(date);
  await this.saveBalance(date, balance);

  // If date is today, update closing
  const today = new Date().toISOString().split('T')[0];
  if (date === today) {
    // Carry forward will happen at midnight via cron
  } else if (date < today) {
    // Backdated entry - need to recalculate all subsequent days
    await this.recalculateSubsequentDays(date);
  }
}
```

#### 4. Edge Case Handling

**Case 1: Month Change**
```typescript
// Same logic - no special handling needed
// 31 Jan closing → 1 Feb opening (automatic)
```

**Case 2: No Transactions on a Day**
```typescript
// If no entries exist:
// Opening = Previous Closing
// Closing = Opening (no change)

async ensureDayExists(date: string): Promise<void> {
  let balance = await this.balanceRepo.findOne({ where: { date } });

  if (!balance) {
    const prevDate = this.getPreviousDate(date);
    const prevBalance = await this.balanceRepo.findOne({ where: { date: prevDate } });

    balance = this.balanceRepo.create({
      date,
      cashOpening: prevBalance?.cashClosing || 0,
      cashClosing: prevBalance?.cashClosing || 0, // No transactions = no change
      bankSbiOpening: prevBalance?.bankSbiClosing || 0,
      bankSbiClosing: prevBalance?.bankSbiClosing || 0,
      isCalculated: true,
      calculatedAt: new Date(),
    });

    await this.balanceRepo.save(balance);
  }
}
```

**Case 3: Backdated Entries**
```typescript
async recalculateSubsequentDays(fromDate: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  let currentDate = fromDate;

  while (currentDate <= today) {
    const balance = await this.calculateDayBalance(currentDate);
    await this.saveBalance(currentDate, balance);

    // Carry forward to next day
    if (currentDate < today) {
      await this.carryForwardBalance(currentDate);
    }

    currentDate = this.getNextDate(currentDate);
  }

  console.log(`Recalculated balances from ${fromDate} to ${today}`);
}
```

**Case 4: First Day Setup (No Previous Balance)**
```typescript
async initializeFirstDay(date: string, cashOpening: number, bankSbiOpening: number): Promise<void> {
  // Only for very first day in system
  const balance = this.balanceRepo.create({
    date,
    cashOpening,
    cashClosing: cashOpening, // Will be updated when transactions added
    bankSbiOpening,
    bankSbiClosing: bankSbiOpening,
    isCalculated: false, // Manually set
    locked: false,
  });

  await this.balanceRepo.save(balance);
}
```

#### 5. Migration for Existing Data

```typescript
// scripts/migrate-existing-balances.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DaybookService } from '../src/daybook/daybook.service';

async function migrateExistingBalances() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const daybookService = app.get(DaybookService);

  console.log('Starting balance migration...');

  // 1. Get all existing dates with entries
  const entries = await daybookService.getAllEntries();
  const uniqueDates = [...new Set(entries.map(e => e.date))].sort();

  console.log(`Found ${uniqueDates.length} days with transactions`);

  // 2. For each date, calculate and save balance
  for (const date of uniqueDates) {
    console.log(`Processing ${date}...`);

    const balance = await daybookService.calculateDayBalance(date);
    await daybookService.saveBalance(date, {
      ...balance,
      isCalculated: true,
      calculatedAt: new Date(),
    });

    // Carry forward to next day
    const nextDate = daybookService.getNextDate(date);
    if (nextDate <= new Date().toISOString().split('T')[0]) {
      await daybookService.carryForwardBalance(date);
    }
  }

  console.log('Migration completed successfully!');
  await app.close();
}

migrateExistingBalances()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

#### 6. Frontend Changes

**Update DayBook Display:**
```typescript
// Show both opening and closing
<div className="balance-card">
  <h3>Cash Balance</h3>
  <div>Opening: ₹{formatCurrency(balance.cashOpening)}</div>
  <div>Closing: ₹{formatCurrency(balance.cashClosing)}</div>
  <div className={balance.cashClosing > balance.cashOpening ? 'positive' : 'negative'}>
    Change: ₹{formatCurrency(balance.cashClosing - balance.cashOpening)}
  </div>
</div>

<div className="balance-card">
  <h3>SBI Bank Balance</h3>
  <div>Opening: ₹{formatCurrency(balance.bankSbiOpening)}</div>
  <div>Closing: ₹{formatCurrency(balance.bankSbiClosing)}</div>
  <div className={balance.bankSbiClosing > balance.bankSbiOpening ? 'positive' : 'negative'}>
    Change: ₹{formatCurrency(balance.bankSbiClosing - balance.bankSbiOpening)}
  </div>
</div>

{balance.isCalculated && (
  <div className="auto-calculated-badge">
    ✓ Automatically calculated
  </div>
)}

{balance.locked && (
  <div className="locked-badge">
    🔒 Locked (Historical)
  </div>
)}
```

**Remove Manual Balance Entry:**
```typescript
// Option 1: Hide "Set Opening Balance" button for calculated days
{!balance.isCalculated && (
  <button onClick={openBalanceModal}>Set Opening Balance</button>
)}

// Option 2: Show warning if trying to edit calculated balance
{balance.isCalculated && (
  <div className="warning">
    This balance is auto-calculated. Manual changes not recommended.
  </div>
)}
```

### API Endpoints

**New Endpoints:**
```typescript
// GET /api/daybook/balance/:date
// Returns: { cashOpening, cashClosing, bankSbiOpening, bankSbiClosing, isCalculated, locked }

// POST /api/daybook/recalculate/:date
// Recalculates balance for specific date and all subsequent days
// Admin only

// POST /api/daybook/lock/:date
// Locks a date to prevent changes
// Admin only

// GET /api/daybook/balance-history?from=2026-01-01&to=2026-01-31
// Returns array of daily balances for period
```

### Testing Strategy

**Unit Tests:**
```typescript
describe('Balance Calculation', () => {
  it('should calculate closing from opening + income - expense', async () => {
    const balance = await service.calculateDayBalance('2026-01-15');
    expect(balance.cashClosing).toBe(10000 + 5000 - 2000); // 13000
  });

  it('should carry forward closing to next day opening', async () => {
    await service.carryForwardBalance('2026-01-15');
    const nextDay = await service.getBalance('2026-01-16');
    expect(nextDay.cashOpening).toBe(13000);
  });

  it('should handle month transition', async () => {
    await service.carryForwardBalance('2026-01-31');
    const feb1 = await service.getBalance('2026-02-01');
    expect(feb1.cashOpening).toBe(balance31Jan.cashClosing);
  });

  it('should handle no transactions day', async () => {
    // No entries for 2026-01-20
    const balance = await service.calculateDayBalance('2026-01-20');
    expect(balance.cashClosing).toBe(balance.cashOpening);
  });

  it('should recalculate subsequent days after backdated entry', async () => {
    await service.addEntry({ date: '2026-01-10', type: 'expense', amount: 1000 });
    await service.recalculateSubsequentDays('2026-01-10');

    const jan15 = await service.getBalance('2026-01-15');
    // Should reflect the backdated expense
  });
});
```

**Integration Tests:**
```typescript
describe('Balance Carry Forward Integration', () => {
  it('should automatically create next day opening at midnight', async () => {
    // Simulate cron job
    await scheduler.handleDailyBalanceCarryForward();

    const tomorrow = getNextDate(getToday());
    const balance = await service.getBalance(tomorrow);
    expect(balance.cashOpening).toBeGreaterThan(0);
  });
});
```

### Deployment Steps

1. **Backup Database**
2. **Run Migration:**
   ```sql
   psql hotel_neelkanth < migrations/add-closing-balances.sql
   ```
3. **Deploy Backend Code**
4. **Run Data Migration Script:**
   ```bash
   npm run migrate:balances
   ```
5. **Enable Cron Job** (automatic)
6. **Deploy Frontend**
7. **Verify:**
   - Check today's balance
   - Verify calculation
   - Test new entry → recalculation

### Rollback Plan

```sql
-- Remove new columns
ALTER TABLE daybook_balances
DROP COLUMN IF EXISTS cash_closing,
DROP COLUMN IF EXISTS bank_sbi_closing,
DROP COLUMN IF EXISTS is_calculated,
DROP COLUMN IF EXISTS calculated_at,
DROP COLUMN IF EXISTS locked;

-- Revert code via git
git revert <commit-hash>
```

---

## RISK ASSESSMENT

### Module 8: UI Consistency
**Risk Level:** LOW
**Impact:** Cosmetic only
**Reversibility:** HIGH

**Risks:**
- User confusion during transition
- Broken layouts on mobile

**Mitigation:**
- Keep both versions temporarily
- Thorough responsive testing
- User training

### Module 9: Balance Carry Forward
**Risk Level:** MEDIUM
**Impact:** Financial data calculation
**Reversibility:** MEDIUM (data can be recalculated)

**Risks:**
- Incorrect balance calculations
- Historical data inconsistency
- Cron job failures

**Mitigation:**
- Extensive testing on staging
- Manual verification period
- Backup before migration
- Ability to recalculate any date
- Lock mechanism for verified days

---

## IMPLEMENTATION TIMELINE

**Week 1: Module 8 (UI Consistency)**
- Day 1-2: Create theme constants
- Day 3-4: Build new booking page
- Day 5: Testing & refinement

**Week 2: Module 9 (Balance Carry Forward)**
- Day 1-2: Database migration & entity updates
- Day 3: Calculation logic & carry forward
- Day 4: Cron job setup & testing
- Day 5: Data migration & verification

**Week 3: Testing & Deployment**
- Day 1-2: Integration testing
- Day 3: Staging deployment
- Day 4: Production deployment (Module 8)
- Day 5: Production deployment (Module 9)

---

## SUCCESS CRITERIA

### Module 8:
- [ ] New booking form matches login page colors
- [ ] All functionality preserved
- [ ] Responsive on all devices
- [ ] No errors in console
- [ ] User acceptance

### Module 9:
- [ ] Balances carry forward automatically
- [ ] No manual entry needed for opening
- [ ] Backdated entries recalculate correctly
- [ ] Month transitions work
- [ ] Historical data preserved
- [ ] Cron job runs reliably

---

**Plan Created By:** Claude Sonnet 4.5
**Review Required:** Yes
**Approval Status:** Pending
