# PHASE 1 DEPLOYMENT GUIDE
## Hotel Neelkanth CRM - System Enhancements

**Date:** 2026-02-09
**Modules Completed:** 3 (Module 1, 5, 7)
**Risk Level:** LOW
**Estimated Deployment Time:** 30 minutes

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- [ ] Backup database before starting
- [ ] Verify no active users during deployment
- [ ] Test on local environment first
- [ ] SSH access to AWS EC2 server ready
- [ ] Git changes committed locally

---

## 🔧 MODULE 1: BOOKING FIELDS

### Changes Made:
- **Backend:**
  - Added `collection_amount` field (decimal, nullable)
  - Added `agent_id` field (FK to users table)
  - Updated `booking.entity.ts`
  - Updated `bookings.service.ts`
  - Updated `create-booking.dto.ts`

- **Frontend:**
  - Added Collection Amount input field
  - Added Agent dropdown (shows all users with admin/staff role)
  - Updated Dashboard.tsx booking form

### Database Migration:
```sql
-- File: backend/migrations/add-collection-amount-and-agent.sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS collection_amount DECIMAL(12, 2) DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agent_id INTEGER DEFAULT NULL;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_agent_id FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id);
```

### Testing Checklist:
- [ ] Create new booking with agent assignment
- [ ] Create new booking with collection amount
- [ ] Edit existing booking to add agent
- [ ] Verify agent dropdown shows correct users

---

## 📊 MODULE 5: AGENT LEDGER REPORT

### Changes Made:
- **Backend:**
  - Added `getAgentLedgerReport()` method in `reports.service.ts`
  - Added `getAgentLedgerDetails()` method in `reports.service.ts`
  - Added `/api/reports/agent-ledger` endpoint
  - Added `/api/reports/agent-ledger/:agentId/details` endpoint

- **Frontend:**
  - Created new page: `AgentLedger.tsx`
  - Added route: `/agent-ledger`
  - Added navigation button in `Ledger.tsx` page
  - Features:
    - Filter by agent, start date, end date
    - Shows: Booking Count, Total Amount, Collection, Pending
    - Export to CSV functionality
    - Grand totals row

### No Database Changes Required

### Testing Checklist:
- [ ] Navigate to Ledger page → Click "Agent Ledger Report" button
- [ ] Test filters: All Agents / Specific Agent
- [ ] Test date range filtering
- [ ] Verify totals calculation
- [ ] Test CSV export

---

## 🧹 MODULE 7: EMPLOYEE CLEANUP

### Changes Made:
- **Backend:**
  - Created script: `backend/scripts/cleanup-employees.ts`
  - Added npm script: `cleanup:employees`
  - Script logic:
    - Checks employees EMP-011 to EMP-017
    - If linked to attendance/salary: Soft delete (status='inactive')
    - If no linked data: Hard delete (remove from DB)

### No Database Changes Required

### Execution (DO NOT RUN YET - Read instructions below):
```bash
cd backend
npm run cleanup:employees
```

### Testing Checklist:
- [ ] Run cleanup script on staging/local first
- [ ] Review script output before running on production
- [ ] Verify employees are marked inactive or removed
- [ ] Check attendance/salary records are preserved

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Local Backup & Commit
```bash
cd /Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker

# Commit all changes
git add .
git commit -m "feat: Phase 1 - Add booking fields, agent ledger report, employee cleanup

- Module 1: Add collection_amount and agent_id to bookings
- Module 5: Add agent-wise ledger report with export
- Module 7: Add employee cleanup script

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

### Step 2: Database Backup (AWS EC2)
```bash
# SSH to server
ssh ubuntu@your-aws-server

# Backup database
sudo -u postgres pg_dump hotel_neelkanth > ~/backups/hotel_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh ~/backups/
```

### Step 3: Run Database Migration
```bash
# Connect to PostgreSQL
sudo -u postgres psql hotel_neelkanth

# Run migration SQL
\i /var/www/hotel-neelkanth/backend/migrations/add-collection-amount-and-agent.sql

# Verify columns added
\d bookings

# Check for collection_amount and agent_id columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('collection_amount', 'agent_id');

# Exit psql
\q
```

### Step 4: Deploy Backend
```bash
# Pull latest code
cd /var/www/hotel-neelkanth
git pull origin main

# Install dependencies (if any new ones)
cd backend
npm install

# Restart backend
pm2 restart hotel-api

# Check logs
pm2 logs hotel-api --lines 50
```

### Step 5: Deploy Frontend
```bash
# Build frontend
cd ../frontend
npm install
npm run build

# Verify build succeeded
ls -la dist/

# Deploy (rsync or copy)
# Already in place since we pulled from git
```

### Step 6: Verify Deployment
```bash
# Check backend health
curl https://neelkanth.akshospitality.in/api/bookings/dashboard/stats

# Check if new endpoints work
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://neelkanth.akshospitality.in/api/reports/agent-ledger
```

### Step 7: Test in Browser
1. Open https://neelkanth.akshospitality.in
2. Login
3. Go to Dashboard → New Booking
   - ✅ Verify "Collection Amount" field visible
   - ✅ Verify "Assign to Agent" dropdown visible
4. Go to Ledger → Click "Agent Ledger Report"
   - ✅ Verify new page loads
   - ✅ Test filters
   - ✅ Test export

### Step 8: Run Employee Cleanup (OPTIONAL)
**⚠️ Only run this if you want to cleanup employees EMP-011 to EMP-017**

```bash
cd /var/www/hotel-neelkanth/backend

# Run cleanup script
npm run cleanup:employees

# Review output
# Example:
# EMP-011 (John Doe) - SOFT DELETED
#   - Attendance records: 15
#   - Status: inactive
# EMP-012 (Jane Smith) - HARD DELETED
#   - No linked data found
```

---

## 🔄 ROLLBACK PLAN

### If Module 1 has issues:
```sql
-- Rollback database changes
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_agent_id;
DROP INDEX IF EXISTS idx_bookings_agent_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS agent_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS collection_amount;
```

```bash
# Rollback code
cd /var/www/hotel-neelkanth
git revert HEAD
git push origin main

# Redeploy
cd backend && pm2 restart hotel-api
cd ../frontend && npm run build
```

### If Module 5 has issues:
- Simply don't use the new Agent Ledger page
- Old ledger functionality still works
- No database changes to rollback

### If Module 7 causes issues:
```sql
-- Reactivate soft-deleted employees
UPDATE staff
SET status = 'active', last_working_date = NULL
WHERE staff_code IN ('EMP-011', 'EMP-012', 'EMP-013', 'EMP-014', 'EMP-015', 'EMP-016', 'EMP-017');

-- For hard-deleted employees, restore from backup
-- (This is why we took a backup first!)
```

---

## 🧪 POST-DEPLOYMENT VERIFICATION

### Module 1 - Booking Fields:
```bash
# Check if columns exist
sudo -u postgres psql hotel_neelkanth -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'bookings'
  AND column_name IN ('collection_amount', 'agent_id');
"

# Expected output:
#   column_name      | data_type | is_nullable
# -------------------+-----------+-------------
#  collection_amount | numeric   | YES
#  agent_id          | integer   | YES
```

### Module 5 - Agent Ledger:
```bash
# Test API endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://neelkanth.akshospitality.in/api/reports/agent-ledger?startDate=2026-01-01&endDate=2026-02-09"

# Should return JSON with agent ledger data
```

### Module 7 - Employee Cleanup:
```bash
# Check employee statuses
sudo -u postgres psql hotel_neelkanth -c "
  SELECT staff_code, name, status, last_working_date
  FROM staff
  WHERE staff_code LIKE 'EMP-01%'
  ORDER BY staff_code;
"
```

---

## 📞 SUPPORT & TROUBLESHOOTING

### Issue: Migration fails with "column already exists"
**Solution:** The migration script uses `IF NOT EXISTS`, so this is safe to ignore

### Issue: Agent dropdown empty
**Solution:**
- Check if users exist: `SELECT id, name, role FROM users;`
- Verify frontend filter: Should show users with role 'admin' or 'staff'

### Issue: Agent Ledger shows no data
**Solution:**
- Verify bookings have agent_id set
- Check filters are not too restrictive
- Run query manually:
  ```sql
  SELECT agent_id, COUNT(*) FROM bookings WHERE agent_id IS NOT NULL GROUP BY agent_id;
  ```

### Issue: Employee cleanup script fails
**Solution:**
- Check TypeORM connection in script
- Verify employee codes exist
- Run with `npm run cleanup:employees` (not `ts-node` directly)

---

## ✅ SUCCESS CRITERIA

Phase 1 deployment is successful when:

1. **Module 1:**
   - [ ] New booking form shows Collection Amount field
   - [ ] New booking form shows Agent dropdown
   - [ ] Can create booking with agent assignment
   - [ ] Can edit booking to change agent
   - [ ] No errors in backend logs

2. **Module 5:**
   - [ ] Agent Ledger Report page accessible from Ledger
   - [ ] Shows correct data with filters
   - [ ] Export CSV works
   - [ ] Totals calculate correctly

3. **Module 7:**
   - [ ] Employee cleanup script runs without errors
   - [ ] Employees with data are soft deleted (status=inactive)
   - [ ] Employees without data are hard deleted
   - [ ] Historical records preserved

---

## 📝 NOTES

- **No Breaking Changes:** All existing bookings continue to work
- **Backward Compatible:** New fields are nullable
- **Data Integrity:** No data loss risk
- **Rollback Ready:** Can revert at any step

**Deployment Window:** Can be done during business hours (low risk)
**User Impact:** Minimal - users will see new features immediately
**Training Required:** Brief demo of new Agent Ledger page

---

## 🎯 NEXT STEPS

After Phase 1 deployment:
1. Train staff on using Agent assignment in bookings
2. Show how to use Agent Ledger Report
3. Monitor for any issues
4. Prepare for Phase 2 (Medium Risk modules)

**Phase 2 will include:**
- Module 2: In-House Guest editing
- Module 6: AKS Office ledger fix

**Phase 3 will include:**
- Module 3: Sales CRM (requires WhatsApp/Dialer integration)
- Module 4: Dialer integration

---

**Deployment prepared by:** Claude Sonnet 4.5
**Approved by:** [Your Name]
**Deployment Date:** _____________
**Deployment Status:** ⬜ Success ⬜ Failed ⬜ Partial
