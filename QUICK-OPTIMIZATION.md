# ⚡ Quick Optimization Guide (5 Minutes)

## ✅ Backup Already Done!
```
File: pre-optimization-backup-2026-02-08_12-53.sql.gz
Status: ✅ Safe
```

---

## 🎯 TWO SIMPLE STEPS

### **STEP 1: Buy Reserved Instance** (5 minutes)

1. Open: https://console.aws.amazon.com/ec2/
2. Click: Reserved Instances → Purchase
3. Select:
   - Type: **t3.micro**
   - Term: **1 year**
   - Payment: **All Upfront**
4. Pay: **₹4,568** (one-time)
5. **Done!** Save ₹248/month

---

### **STEP 2: Reduce Storage** (10 minutes)

1. EC2 → Volumes → Create Snapshot
2. Create 15GB volume from snapshot
3. Stop instance
4. Swap old → new volume
5. Start instance
6. **Done!** Save ₹102/month

---

## 💰 RESULT

**Monthly Savings: ₹350**
**Annual Savings: ₹4,200**
**Cost: ₹492/month (was ₹842)**

---

**Full guide:** See OPTIMIZATION-GUIDE.md

**Questions?** Ask the Master! 🧙
