# 🗄️ Hotel Neelkanth — Data Access Guide

## 📍 Where is Your Data?

### **Primary Storage: PostgreSQL Database**
- **Location**: AWS EC2 Server (65.1.252.58)
- **Database**: `hotel_neelkanth`
- **Size**: ~500KB (very efficient!)
- **Backup**: Daily at 2:00 AM IST → S3 bucket

---

## 🔑 5 Ways to Access Your Data

### **Method 1: CRM Web Interface** ⭐ **EASIEST**

**URL**: https://neelkanth.akshospitality.in

**Login**:
- Email: sharad.chaurasia@akshospitality.in
- PIN: (your 4-digit PIN)

**What you can do**:
- ✅ View all bookings
- ✅ Download reports
- ✅ View daybook
- ✅ Check agent ledger
- ✅ Export to Excel

**Best for**: Daily operations, viewing data, generating reports

---

### **Method 2: Export to CSV/Excel** ⭐ **RECOMMENDED**

**Run this command** (on your Mac):
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker
./scripts/export-data.sh
```

**This will export ALL data to**:
```
~/Downloads/hotel-neelkanth-exports/
├── bookings_2026-02-08_16-30.csv
├── daybook_entries_2026-02-08_16-30.csv
├── aks_office_payments_2026-02-08_16-30.csv
├── agent_settlements_2026-02-08_16-30.csv
├── staff_2026-02-08_16-30.csv
└── users_2026-02-08_16-30.csv
```

**Export specific table only**:
```bash
./scripts/export-data.sh bookings
./scripts/export-data.sh daybook_entries
```

**Then open in**:
- Microsoft Excel
- Google Sheets
- Numbers

**Best for**: Data analysis, backup, sharing with accountant

---

### **Method 3: Direct Database Access (Terminal)**

**Step 1**: Connect to server
```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58
```

**Step 2**: Access database
```bash
PGPASSWORD="JBrr85MttexyXBg15tdDfQUz" psql -U hotel_admin -d hotel_neelkanth -h localhost
```

**Step 3**: Run SQL queries
```sql
-- View all bookings
SELECT * FROM bookings ORDER BY check_out DESC;

-- Today's collections
SELECT * FROM daybook_entries WHERE date = CURRENT_DATE;

-- Agent pending amounts
SELECT source_name,
       SUM(total_amount) as total,
       SUM(advance_received + balance_received) as received,
       SUM(total_amount - advance_received - balance_received) as pending
FROM bookings
WHERE payment_type = 'Ledger'
GROUP BY source_name;

-- Exit
\q
```

**Best for**: Complex queries, custom reports, troubleshooting

---

### **Method 4: Database GUI Tool (pgAdmin/TablePlus)**

**Option A: TablePlus** (Recommended for Mac)
1. Download: https://tableplus.com/
2. Create new connection:
   - **Type**: PostgreSQL
   - **Host/Socket**: 65.1.252.58
   - **Port**: 5432 (need SSH tunnel - see below)
   - **User**: hotel_admin
   - **Password**: JBrr85MttexyXBg15tdDfQUz
   - **Database**: hotel_neelkanth

**SSH Tunnel Setup** (Required):
```bash
# Run this in a separate terminal (keep it running)
ssh -i ~/.ssh/hotel-neelkanth.pem -L 5432:localhost:5432 ubuntu@65.1.252.58
```

Then connect TablePlus to: `localhost:5432`

**Option B: pgAdmin**
1. Download: https://www.pgadmin.org/download/
2. Same setup as TablePlus

**Best for**: Visual data browsing, editing individual records

---

### **Method 5: API Access (Programmatic)**

**Base URL**: https://neelkanth.akshospitality.in/api

**Login first**:
```bash
curl -X POST https://neelkanth.akshospitality.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","pin":"1234"}'
```

**Get bookings**:
```bash
curl https://neelkanth.akshospitality.in/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Best for**: Automation, integration with other systems

---

## 📊 Database Structure

### **Main Tables**:

1. **bookings** — All hotel bookings
   - booking_id (NKH-0001, NKH-0002...)
   - guest_name, phone, room_no
   - check_in, check_out
   - total_amount, advance_received, balance_received
   - status (PENDING/PARTIAL/COLLECTED)

2. **daybook_entries** — Daily income/expenses
   - date, type (income/expense)
   - category, amount
   - payment_mode, ref_booking_id

3. **aks_office_payments** — AKS Office transactions
   - ref_booking_id, amount
   - sub_category, date

4. **agent_settlements** — Agent payment settlements
   - agent_name, amount
   - payment_mode, date

5. **staff** — Staff records
   - name, designation, salary
   - status (active/fnf)

6. **users** — Login accounts
   - email, role, permissions

---

## 🔒 Database Credentials

**⚠️ IMPORTANT - Keep these secret!**

```
Host: localhost (via SSH tunnel) or 65.1.252.58 (from server)
Port: 5432
Database: hotel_neelkanth
User: hotel_admin
Password: JBrr85MttexyXBg15tdDfQUz
```

---

## 💾 Backups

**Location**:
- **S3**: `s3://hotel-neelkanth-backups/db-backups/`
- **Local Server**: `/home/ubuntu/db-backups/`

**Schedule**: Daily at 2:00 AM IST

**Restore from backup**:
```bash
# Download latest backup
aws s3 cp s3://hotel-neelkanth-backups/db-backups/hotel_neelkanth_2026-02-08_20-30.sql.gz .

# Restore
gunzip hotel_neelkanth_2026-02-08_20-30.sql.gz
PGPASSWORD="JBrr85MttexyXBg15tdDfQUz" psql -U hotel_admin -d hotel_neelkanth -h localhost < hotel_neelkanth_2026-02-08_20-30.sql
```

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Export all data to CSV
./scripts/export-data.sh

# Export specific table
./scripts/export-data.sh bookings

# Connect to database
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58
PGPASSWORD="JBrr85MttexyXBg15tdDfQUz" psql -U hotel_admin -d hotel_neelkanth -h localhost

# Create SSH tunnel for GUI tools
ssh -i ~/.ssh/hotel-neelkanth.pem -L 5432:localhost:5432 ubuntu@65.1.252.58

# Download latest backup
aws s3 cp s3://hotel-neelkanth-backups/db-backups/hotel_neelkanth_LATEST.sql.gz .
```

---

## 📞 Need Help?

If you need to access specific data or create custom reports, the Master can help! Just ask! 🧙
