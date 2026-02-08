# 📅 Month-End Closing & Opening Balance System

**Implementation Date:** February 9, 2026
**Status:** ✅ Complete
**Purpose:** Automatic carry-forward of balances (Cash, Bank, Ledgers) from one month to next

---

## 🎯 What This Solves:

### Problem:
- February 2026 started with -₹18,715 opening balance from AKS Office (hotel's advance)
- This opening balance was NOT tracked in the system
- NET PENDING showed ₹51,294 instead of actual ₹32,579

### Solution:
- **Opening Balance tracking** for all ledgers (AKS Office, Agents)
- **Automatic month-end closing** process
- **Auto carry-forward** to next month
- **Works for:** Cash, Bank (SBI), and all Agent Ledgers

---

## 📊 How It Works:

### Month-End Closing Process:

```
Step 1: Calculate Closing Balances (Feb 28, 2026)
┌──────────────────────────────────────┐
│ Cash Closing:        ₹25,000         │
│ Bank (SBI) Closing:  ₹1,50,000       │
│ AKS Office Closing:  ₹32,579         │
│ Agent A Closing:     ₹5,000          │
└──────────────────────────────────────┘

Step 2: Auto Carry Forward (Mar 1, 2026)
┌──────────────────────────────────────┐
│ Cash Opening:        ₹25,000         │
│ Bank (SBI) Opening:  ₹1,50,000       │
│ AKS Office Opening:  ₹32,579         │
│ Agent A Opening:     ₹5,000          │
└──────────────────────────────────────┘

Done! ✅ March starts with correct openings
```

---

## 🔌 API Endpoints:

### 1. **Set Opening Balance Manually** (One-time fix)
```http
POST /api/month-end/opening-balance
Content-Type: application/json

{
  "agent": "AKS Office",
  "month": "2026-02",
  "openingBalance": -18715,
  "notes": "Previous month advance - manual entry"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Opening balance set successfully",
  "data": {
    "id": 1,
    "agentName": "AKS Office",
    "month": "2026-02",
    "openingBalance": -18715,
    "notes": "Previous month advance - manual entry"
  }
}
```

---

### 2. **Get Opening Balance**
```http
GET /api/month-end/opening-balance?agent=AKS Office&month=2026-02
```

**Response:**
```json
{
  "agent": "AKS Office",
  "month": "2026-02",
  "openingBalance": -18715
}
```

---

### 3. **Calculate Closing Balances**
```http
GET /api/month-end/closing-balances?month=2026-02
```

**Response:**
```json
{
  "month": "2026-02",
  "closingBalances": {
    "cash": 25000,
    "bank": 150000,
    "ledgers": [
      {
        "agentName": "AKS Office",
        "closingBalance": 32579
      },
      {
        "agentName": "Agent A",
        "closingBalance": 5000
      }
    ]
  }
}
```

---

### 4. **Month-End Closing (Automatic Carry Forward)**
```http
POST /api/month-end/carry-forward
Content-Type: application/json

{
  "month": "2026-02"
}
```

**Response:**
```json
{
  "month": "2026-02",
  "nextMonth": "2026-03",
  "closingBalances": {
    "cash": 25000,
    "bank": 150000,
    "ledgers": [...]
  },
  "success": true,
  "message": "Successfully closed 2026-02 and opened 2026-03"
}
```

---

### 5. **Get All Opening Balances for a Month**
```http
GET /api/month-end/all-openings?month=2026-03
```

**Response:**
```json
{
  "month": "2026-03",
  "openings": [
    {
      "id": 1,
      "agentName": "AKS Office",
      "month": "2026-03",
      "openingBalance": 32579,
      "notes": "Auto carried forward from 2026-02",
      "createdAt": "2026-03-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "agentName": "Agent A",
      "month": "2026-03",
      "openingBalance": 5000,
      "notes": "Auto carried forward from 2026-02",
      "createdAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

---

## 💻 Database Schema:

```sql
CREATE TABLE ledger_opening_balance (
  id SERIAL PRIMARY KEY,
  agent_name VARCHAR(100) NOT NULL,
  month VARCHAR(7) NOT NULL,  -- Format: 'YYYY-MM'
  opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_agent_month UNIQUE(agent_name, month)
);

-- Indexes for fast queries
CREATE INDEX idx_ledger_opening_agent ON ledger_opening_balance(agent_name);
CREATE INDEX idx_ledger_opening_month ON ledger_opening_balance(month);
```

---

## 🎨 Ledger Report Changes:

### Before (Without Opening Balance):
```
═══════════════════════════════════
LEDGER REPORT - February 2026
═══════════════════════════════════
Current Month Transactions: ₹51,294
─────────────────────────────────
NET PENDING: ₹51,294  ❌ WRONG!
═══════════════════════════════════
```

### After (With Opening Balance):
```
═══════════════════════════════════
LEDGER REPORT - February 2026
═══════════════════════════════════
Opening Balance: -₹18,715 (Hotel Advance)
Current Month Transactions: +₹51,294
─────────────────────────────────
Closing Balance: ₹32,579  ✅ CORRECT!
═══════════════════════════════════
```

---

## 🚀 Quick Start Guide:

### For February 2026 (One-Time Fix):

**Step 1:** Set opening balance manually
```bash
curl -X POST https://neelkanth.akshospitality.in/api/month-end/opening-balance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "agent": "AKS Office",
    "month": "2026-02",
    "openingBalance": -18715,
    "notes": "Previous month advance"
  }'
```

**Step 2:** Check ledger report - should now show correct balance!

---

### For March 2026 Onwards (Automatic):

**On February 28, 2026:**
```bash
curl -X POST https://neelkanth.akshospitality.in/api/month-end/carry-forward \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ "month": "2026-02" }'
```

**Result:**
- ✅ March 1 automatically gets opening balances
- ✅ No manual work needed!
- ✅ All ledgers (cash, bank, agents) carried forward

---

## 📝 Important Notes:

### 1. **Opening Balance Format:**
- **Negative value** = Hotel has advance/money owed TO hotel
- **Positive value** = Agent/Office owes money to hotel

### 2. **Month Format:**
- Always use `YYYY-MM` format (e.g., `2026-02`)
- Date range in ledger report uses first day of month for opening balance

### 3. **Daybook Opening Balance:**
- Cash & Bank opening balances stored in `daybook_balance` table
- Auto carry-forward already implemented (existing feature)
- This feature adds ledger opening balance support

### 4. **When to Run Month-End Close:**
- Last day of month OR first day of next month
- Can be run multiple times (updates existing openings)
- Safe to re-run if needed

---

## 🧪 Testing:

### Test 1: Set Opening Balance
```bash
# Set AKS Office opening for Feb 2026
POST /api/month-end/opening-balance
{
  "agent": "AKS Office",
  "month": "2026-02",
  "openingBalance": -18715
}

# Verify it was set
GET /api/month-end/opening-balance?agent=AKS Office&month=2026-02

# Should return: { "openingBalance": -18715 }
```

### Test 2: Calculate Closing
```bash
# Get closing balances for Feb 2026
GET /api/month-end/closing-balances?month=2026-02

# Should show all closing balances (cash, bank, ledgers)
```

### Test 3: Carry Forward
```bash
# Close Feb and open March
POST /api/month-end/carry-forward
{ "month": "2026-02" }

# Verify March openings created
GET /api/month-end/all-openings?month=2026-03

# Should show all March opening balances
```

---

## 🎯 Benefits:

1. ✅ **Accurate Reporting** - NET PENDING shows correct amount
2. ✅ **Automatic Process** - No manual tracking needed after setup
3. ✅ **Month-End Simplified** - One API call closes & opens
4. ✅ **Historical Data** - All opening balances stored in database
5. ✅ **Works for All** - Cash, Bank, AKS Office, Agents - all supported

---

## 🔧 Technical Details:

### Files Created:
1. `backend/src/bookings/ledger-opening-balance.entity.ts` - Entity
2. `backend/src/bookings/month-end.service.ts` - Business logic
3. `backend/src/bookings/month-end.controller.ts` - API endpoints
4. `backend/migrations/add-ledger-opening-balance.sql` - Database schema

### Files Modified:
1. `backend/src/bookings/bookings.module.ts` - Added new components
2. `backend/src/reports/reports.service.ts` - Include opening balance in ledger report
3. `backend/src/reports/reports.module.ts` - Import BookingsModule

---

## 📞 Support:

If any issues:
1. Check opening balance set correctly: `GET /api/month-end/opening-balance`
2. Verify month format is `YYYY-MM`
3. Check database has `ledger_opening_balance` table
4. Review logs for errors

---

**Implementation Complete!** ✅

**Next Steps:**
1. Run database migration (create table)
2. Set February opening balance manually
3. From March onwards, run month-end close automatically

**Happy Accounting!** 📊
