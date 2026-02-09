# 💰 Hotel Neelkanth AWS — Actual Cost Analysis

## 📊 CURRENT USAGE (Real Data from API)

### **EC2 Instance:**
```
Type:        t3.micro
vCPUs:       2 (burstable)
Memory:      1 GB
Current CPU: 0% (idle - excellent!)
Memory:      458 MB / 914 MB (50%)
Uptime:      6 days, 17 hours
```

### **Storage (EBS):**
```
Total:       29 GB SSD (gp3)
Used:        4.5 GB (16%)
Free:        24 GB
Database:    71 MB
Backups:     212 KB
```

### **Network:**
```
Traffic:     Very low (< 1 GB/month estimated)
API Calls:   Minimal (booking operations)
```

---

## 💵 AWS PRICING (Mumbai Region - ap-south-1)

### **1. EC2 t3.micro Instance**

**On-Demand Pricing:**
- **Rate**: $0.0104 per hour
- **Monthly**: $0.0104 × 730 hours = **$7.59/month**
- **INR**: ₹7.59 × 83 = **₹630/month**

**With Reserved Instance (1-year commitment):**
- **Rate**: $0.0063 per hour (40% discount)
- **Monthly**: **$4.60/month** = **₹382/month**
- **Upfront**: $55 (₹4,568) one-time
- **Savings**: ₹248/month × 12 = ₹2,976/year saved!

---

### **2. EBS Storage (SSD gp3)**

**Current Usage: 4.5 GB**
- **Rate**: $0.088 per GB-month
- **Cost**: 4.5 × $0.088 = **$0.40/month**
- **INR**: **₹33/month**

**Note:** You have 29GB allocated, but only using 4.5GB. You're paying for full 29GB!
- **Actual cost**: 29 × $0.088 = **$2.55/month** = **₹212/month**

---

### **3. S3 Storage (Backups)**

**Current Usage: 212 KB (0.0002 GB)**
- **Rate**: $0.023 per GB-month
- **Cost**: **< $0.01/month**
- **INR**: **₹0.50/month** (negligible)

---

### **4. Data Transfer OUT**

**Estimated: < 1 GB/month**
- **Free Tier**: First 100 GB/month FREE
- **Your Usage**: 0.5-1 GB/month
- **Cost**: **₹0/month** (within free tier forever!)

---

### **5. Elastic IP**

**Status: Attached to running instance**
- **Cost**: **₹0/month** (free when attached)

---

### **6. Other Services**

- **CloudWatch**: Basic metrics FREE
- **Route 53**: Not used
- **Load Balancer**: Not used
- **RDS**: Not used (using PostgreSQL on EC2)

---

## 📊 TOTAL MONTHLY COST BREAKDOWN

### **Option A: Current Setup (On-Demand)**

| Service | Cost/Month |
|---------|------------|
| EC2 t3.micro | ₹630 |
| EBS Storage (29GB) | ₹212 |
| S3 Backups | ₹1 |
| Data Transfer | ₹0 (free) |
| Elastic IP | ₹0 (free) |
| **TOTAL** | **₹843/month** |

**Annual**: ₹843 × 12 = **₹10,116**

---

### **Option B: Optimized Setup (Recommended)**

| Service | Cost/Month | Savings |
|---------|------------|---------|
| EC2 Reserved (1-year) | ₹382 | ₹248/mo |
| EBS Storage (reduce to 15GB) | ₹110 | ₹102/mo |
| S3 Backups | ₹1 | - |
| Data Transfer | ₹0 | - |
| Elastic IP | ₹0 | - |
| **TOTAL** | **₹493/month** | **₹350/mo** |

**Annual**: ₹493 × 12 = **₹5,916**
**Savings**: ₹10,116 - ₹5,916 = **₹4,200/year saved!**

---

### **Option C: Budget Setup (Most Economical)**

| Service | Cost/Month |
|---------|------------|
| EC2 t3.micro Spot Instance | ₹150-200 |
| EBS Storage (10GB) | ₹73 |
| S3 Backups | ₹1 |
| **TOTAL** | **₹225-275/month** |

**Annual**: ~₹3,000

**⚠️ Risk**: Spot instances can be terminated by AWS (rare, but possible)

---

## 🎯 REALISTIC PROJECTION

### **Your Actual Usage Pattern:**
- ✅ CPU: 0% (very light load)
- ✅ Memory: 50% (efficient)
- ✅ Storage: 16% (4.5GB of 29GB)
- ✅ Traffic: < 1GB/month (minimal)

### **After Free Credits End (July 30, 2026):**

**With Current Setup:**
```
Monthly: ₹843
Daily:   ₹28
Yearly:  ₹10,116
```

**With Optimization (Recommended):**
```
Monthly: ₹493
Daily:   ₹16
Yearly:  ₹5,916
```

---

## 💡 COST OPTIMIZATION RECOMMENDATIONS

### **Immediate (Can Save ₹350/month):**

1. **Reduce EBS Volume**
   - Current: 29 GB (₹212/mo)
   - Need: 10-15 GB (₹73-110/mo)
   - **Savings**: ₹102-139/month

2. **Buy Reserved Instance**
   - Pay upfront: ₹4,568 (one-time)
   - **Savings**: ₹248/month × 12 = ₹2,976/year
   - **ROI**: Break-even in 18.4 months

### **Future (When Traffic Grows):**

3. **Use CloudFront CDN**
   - Cache static files
   - Reduce data transfer costs

4. **Implement Auto-Scaling**
   - Scale down at night (save 50%)
   - Only when traffic increases

---

## 📅 COST TIMELINE

### **Feb - July 2026 (Credits Active):**
```
AWS Cost:  ₹0 (covered by $92.62 credits)
Email:     ₹200/month
Domain:    ₹0 (paid until Jan 2027)
─────────────────
TOTAL:     ₹200/month
```

### **Aug 2026 - Jan 2027 (After Credits):**

**Option 1: No Optimization**
```
AWS:       ₹843/month
Email:     ₹200/month
Domain:    ₹0
─────────────────
TOTAL:     ₹1,043/month
```

**Option 2: Optimized (Recommended)**
```
AWS:       ₹493/month
Email:     ₹200/month
Domain:    ₹0
─────────────────
TOTAL:     ₹693/month
```

### **Jan 2027 onwards:**
```
AWS:       ₹493/month
Email:     ₹200/month
Domain:    ₹100/month (₹1,200/year amortized)
─────────────────
TOTAL:     ₹793/month
```

---

## 🔍 DETAILED COST COMPARISON

### **Full Year Cost (Aug 2026 - July 2027):**

| Setup | Monthly | Annual | 3-Year |
|-------|---------|--------|--------|
| **Current (No optimization)** | ₹1,043 | ₹12,516 | ₹37,548 |
| **Optimized (Recommended)** | ₹693 | ₹8,316 | ₹24,948 |
| **Budget (Spot instances)** | ₹475 | ₹5,700 | ₹17,100 |

**Savings (Optimized vs Current):**
- Monthly: ₹350
- Annual: ₹4,200
- 3-Year: ₹12,600

---

## ✅ RECOMMENDED ACTION PLAN

### **Before July 2026 (Do This):**

1. **Reduce EBS Volume from 29GB to 15GB**
   ```
   Savings: ₹102/month
   Risk: Low (you're only using 4.5GB)
   ```

2. **Buy 1-Year Reserved Instance**
   ```
   Upfront: ₹4,568
   Savings: ₹2,976/year
   Payback: 18 months
   ```

3. **Setup Billing Alerts**
   ```
   Alert when: ₹500, ₹1,000, ₹1,500
   Email: sharad.chaurasia@akshospitality.in
   ```

4. **Enable Cost Explorer**
   ```
   Track daily/monthly costs
   Identify spending patterns
   ```

---

## 🎯 FINAL ANSWER

### **Your Actual AWS Cost After Credits:**

**Without Optimization:**
- ₹843/month AWS + ₹200 Email = **₹1,043/month**
- **₹35/day**

**With Optimization (Recommended):**
- ₹493/month AWS + ₹200 Email = **₹693/month**
- **₹23/day**

**Best Case (Budget):**
- ₹275/month AWS + ₹200 Email = **₹475/month**
- **₹16/day**

---

## 💰 BOTTOM LINE

```
╔════════════════════════════════════════════════╗
║  AFTER FREE CREDITS END (July 30, 2026)       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                ║
║  Current Setup:    ₹1,043/month (₹35/day)     ║
║  Optimized:        ₹693/month   (₹23/day)     ║
║  Budget:           ₹475/month   (₹16/day)     ║
║                                                ║
║  Recommendation: Optimize → Save ₹4,200/year  ║
╚════════════════════════════════════════════════╝
```

**That's less than 1 booking per month to cover all costs!** ✅

---

## 📞 NEXT STEPS

Want me to help you:
1. Reduce EBS volume size (save ₹102/month)?
2. Setup Reserved Instance (save ₹248/month)?
3. Create optimization scripts?

Just say the word! 🧙
