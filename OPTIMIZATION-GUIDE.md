# 🚀 AWS Optimization - Step-by-Step Guide

## ✅ PRE-OPTIMIZATION CHECKLIST

- [x] **Backup Created**: pre-optimization-backup-2026-02-08_12-53.sql.gz (16KB)
- [x] **Current System Verified**: Working perfectly
- [ ] **AWS Console Access**: Ready to proceed
- [ ] **15 minutes time**: Set aside for optimization

---

## 📋 OPTIMIZATION STEPS

### **PART 1: Purchase Reserved Instance** (Save ₹248/month)

**Time Required**: 5 minutes
**Downtime**: ZERO
**Difficulty**: Easy

#### **Steps:**

1. **Login to AWS Console**
   - Go to: https://console.aws.amazon.com/
   - Region: **Mumbai (ap-south-1)**

2. **Navigate to EC2 Reserved Instances**
   - Click: Services → EC2
   - Left sidebar → Reserved Instances
   - Click: **"Purchase Reserved Instances"**

3. **Configure Purchase**
   ```
   Instance Type:     t3.micro
   Platform:          Linux/UNIX
   Tenancy:           Default
   Term:              1 year
   Payment Option:    All Upfront (cheapest)
   Offering Class:    Standard
   Quantity:          1
   ```

4. **Review Pricing**
   ```
   Upfront Cost:      ~$55 (₹4,568)
   Monthly Cost:      $0 (fully prepaid)
   Total Savings:     ~40% vs On-Demand
   Hourly Rate:       $0.0063 (vs $0.0104)
   ```

5. **Complete Purchase**
   - Click: **"Add to Cart"**
   - Click: **"Purchase"**
   - Confirm payment
   - Wait for confirmation email

6. **Verify**
   - Reserved Instances → Should show "active"
   - Your running instance will automatically use this reservation

**✅ DONE! Savings: ₹248/month = ₹2,976/year**

---

### **PART 2: Reduce EBS Storage** (Save ₹102/month)

**Time Required**: 10 minutes
**Downtime**: ~30 seconds
**Difficulty**: Medium

#### **Prerequisites:**

- [x] Backup created (✅ already done!)
- [ ] Current volume ID noted
- [ ] Ready to proceed

#### **Steps:**

**A. Get Current Volume Details**

1. Go to: EC2 → Instances
2. Select your instance: `i-0e73c7424d7c386c3`
3. Storage tab → Note down:
   ```
   Volume ID: vol-XXXXX
   Size: 29 GB
   Type: gp3
   ```

**B. Create Snapshot (Safety)**

1. Go to: EC2 → Volumes
2. Select your volume
3. Actions → **Create Snapshot**
   ```
   Description: Pre-optimization snapshot
   Tags: Name = backup-before-resize
   ```
4. Wait until Status = "Completed" (~2 minutes)

**C. Create New Smaller Volume**

1. Go to: EC2 → Snapshots
2. Select your snapshot
3. Actions → **Create Volume from Snapshot**
   ```
   Volume Type:    gp3
   Size:           15 GB (instead of 29 GB)
   Availability Zone: ap-south-1a (same as instance)
   Tags: Name = hotel-neelkanth-optimized
   ```
4. Click: **Create Volume**
5. Wait until State = "Available"

**D. Stop Instance (Brief Downtime)**

1. Go to: EC2 → Instances
2. Select your instance
3. Instance State → **Stop Instance**
4. Wait until State = "Stopped" (~30 seconds)

**E. Swap Volumes**

1. **Detach Old Volume:**
   - Go to: EC2 → Volumes
   - Select old 29GB volume
   - Actions → **Detach Volume**
   - Confirm

2. **Attach New Volume:**
   - Select new 15GB volume
   - Actions → **Attach Volume**
   ```
   Instance:   i-0e73c7424d7c386c3
   Device:     /dev/sda1 (or /dev/xvda)
   ```
   - Click: **Attach**

**F. Start Instance**

1. Go to: EC2 → Instances
2. Select your instance
3. Instance State → **Start Instance**
4. Wait until Status = "Running" (~30 seconds)

**G. Verify Everything Works**

1. **Test Website:**
   - Open: https://neelkanth.akshospitality.in
   - Login and check all features
   - Create test booking
   - Check reports

2. **SSH Verification:**
   ```bash
   ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58

   # Check disk space
   df -h /
   # Should show ~15GB total

   # Check database
   PGPASSWORD="JBrr85MttexyXBg15tdDfQUz" psql -U hotel_admin -d hotel_neelkanth -h localhost -c "SELECT COUNT(*) FROM bookings;"
   # Should show 18 bookings

   # Check PM2
   pm2 status
   # Should show hotel-api online
   ```

3. **If Everything Works:**
   - ✅ Delete old 29GB volume (save money!)
   - ✅ Delete snapshot after 24 hours (optional)

4. **If Something Breaks (Unlikely):**
   - Stop instance
   - Detach new volume
   - Attach old volume back
   - Start instance
   - Everything restored!

**✅ DONE! Savings: ₹102/month = ₹1,224/year**

---

## 📊 VERIFICATION CHECKLIST

After optimization, verify:

- [ ] Website loads: https://neelkanth.akshospitality.in
- [ ] Login works
- [ ] Dashboard shows correct data
- [ ] Can create booking
- [ ] Can collect payment
- [ ] Reports generate correctly
- [ ] Database has all data (18 bookings)
- [ ] PM2 process running
- [ ] SSL certificate working
- [ ] Daily backups continue

If ALL checked ✅ → **Optimization SUCCESS!**

---

## 💰 FINAL SAVINGS SUMMARY

### **Before Optimization:**
```
EC2 On-Demand:    ₹630/month
Storage (29GB):   ₹212/month
────────────────────────────
TOTAL:            ₹842/month
```

### **After Optimization:**
```
EC2 Reserved:     ₹382/month  (↓ ₹248)
Storage (15GB):   ₹110/month  (↓ ₹102)
────────────────────────────
TOTAL:            ₹492/month
────────────────────────────
MONTHLY SAVINGS:  ₹350
ANNUAL SAVINGS:   ₹4,200! 🎉
```

---

## 🔄 ROLLBACK PLAN (If Needed)

If anything goes wrong:

1. **Stop instance**
2. **Detach new volume**
3. **Attach old volume** (we kept it!)
4. **Start instance**
5. **Everything back to normal**

**Old volume will be kept for 7 days** (just in case)

---

## ⚠️ IMPORTANT NOTES

1. **Downtime**: Only ~30 seconds during volume swap
2. **Data Safety**: Backup + old volume = double safe!
3. **Reserved Instance**: Activates immediately, no restart needed
4. **Cost**: Upfront payment ₹4,568, then save ₹350/month
5. **ROI**: Break-even in 13 months

---

## 📞 NEED HELP?

If stuck at any step:
1. Take screenshot
2. Note exact error message
3. Ask the Master! 🧙

---

## ✅ POST-OPTIMIZATION

After completing:

1. **Setup Billing Alerts**
   - AWS Console → Billing → Budgets
   - Alert at: ₹500, ₹1,000
   - Email: sharad.chaurasia@akshospitality.in

2. **Monitor First Week**
   - Check daily: Website working?
   - Check billing: ~₹16/day (₹492/month)

3. **Delete Old Volume** (after 7 days if all good)
   - EC2 → Volumes
   - Select old 29GB volume
   - Actions → Delete Volume
   - Save ₹212/month!

---

**Ready to proceed? Follow Part 1, then Part 2!** 🚀

**Estimated Total Time: 15 minutes**
**Total Savings: ₹4,200/year!** 🎉
