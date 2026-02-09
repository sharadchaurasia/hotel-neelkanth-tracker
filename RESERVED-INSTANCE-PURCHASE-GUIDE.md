# 💳 Reserved Instance Purchase - Step-by-Step Guide

## 🎯 What You're Buying:

**Hotel Neelkanth: t3.micro Reserved Instance**
- **Cost**: ₹4,568 one-time payment (1 year)
- **Savings**: ₹248/month × 12 = ₹2,976/year
- **Break-even**: ~18 months
- **After 1 year**: Purchase again or go back to on-demand

---

## 📋 EXACT STEPS:

### **Step 1: Login to AWS Console**
```
URL: https://console.aws.amazon.com/ec2/
Region: Mumbai (ap-south-1) - Verify top-right corner!
```

---

### **Step 2: Navigate to Reserved Instances**
```
1. Left sidebar → Scroll down
2. Click: "Reserved Instances" (under INSTANCES section)
3. Click orange button: "Purchase Reserved Instances"
```

---

### **Step 3: Configure Purchase Settings**

**Fill EXACTLY as shown:**

```
┌─────────────────────────────────────────────┐
│ Purchase Reserved Instances                 │
├─────────────────────────────────────────────┤
│                                             │
│ [1] Instance Attributes                     │
│                                             │
│  Instance Type:                             │
│  [t3.micro ▼]  ← Type or select            │
│                                             │
│  Platform:                                  │
│  (•) Linux/UNIX  ← Select this              │
│  ( ) RHEL                                   │
│  ( ) SUSE Linux                             │
│  ( ) Windows                                │
│                                             │
│  Tenancy:                                   │
│  (•) Default  ← Keep as-is                  │
│  ( ) Dedicated                              │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ [2] Term                                    │
│                                             │
│  (•) 1 year  ← Select this (cheaper)        │
│  ( ) 3 year                                 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ [3] Payment Option                          │
│                                             │
│  (•) All Upfront  ← CHEAPEST! Select this   │
│  ( ) Partial Upfront                        │
│  ( ) No Upfront                             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ [4] Offering Class                          │
│                                             │
│  (•) Standard  ← Select this                │
│  ( ) Convertible                            │
│                                             │
└─────────────────────────────────────────────┘
```

---

### **Step 4: Review Pricing**

**You should see something like:**

```
┌─────────────────────────────────────────────┐
│ Pricing Details                             │
├─────────────────────────────────────────────┤
│                                             │
│  Instance Count:        1                   │
│  Upfront Price:         $55.00              │
│  Recurring Charges:     $0.00/month         │
│  Effective Hourly:      $0.0063             │
│                                             │
│  Compared to On-Demand:                     │
│  On-Demand Hourly:      $0.0104             │
│  Savings:               39%                 │
│                                             │
└─────────────────────────────────────────────┘

✅ This is correct! Proceed.
```

**Convert to INR:**
```
$55 × ₹83 = ₹4,565 (approx)

May vary slightly based on exchange rate
```

---

### **Step 5: Add to Cart**
```
1. Review all settings one more time
2. Click: "Add to Cart" button (bottom right)
3. Cart summary appears
```

---

### **Step 6: Purchase**
```
1. Click: "View Cart" or "Purchase" button
2. Review Order Summary:
   - Instance Type: t3.micro ✅
   - Region: ap-south-1 ✅
   - Term: 1 year ✅
   - Payment: All Upfront ✅
   - Quantity: 1 ✅

3. Click: "Purchase Reserved Instance" button
4. Confirm in popup
```

---

### **Step 7: Payment**
```
AWS will charge your payment method on file
- Credit card
- AWS Credits (if available)
- Bank account

Payment processes immediately
```

---

### **Step 8: Confirmation**
```
You'll see:
  ✅ "Purchase successful"

Email confirmation sent to your AWS account email
```

---

### **Step 9: Verify Purchase**
```
1. Go back to: EC2 → Reserved Instances
2. You should see:

┌──────────────────────────────────────────────────────┐
│ Reserved Instances                                   │
├──────────────────────────────────────────────────────┤
│ ID         Type      State   Count  Zone            │
│ ri-xxxxx   t3.micro  active  1      ap-south-1b     │
└──────────────────────────────────────────────────────┘

Status: "active" ✅
```

---

### **Step 10: Automatic Application**
```
Your running instance (i-0e73c7424d7c386c3) will
AUTOMATICALLY use this reservation!

No action needed!
No restart required!
Billing changes immediately!
```

---

## ✅ VERIFICATION:

### **Check Billing After 24 Hours:**
```
1. Go to: AWS Console → Billing Dashboard
2. Click: "Bills" (left sidebar)
3. Look for: "EC2-Instances (Reserved)"
4. Should show: $0.00/hour (reservation active)
```

---

## 🎯 WHAT HAPPENS NOW:

### **Before Purchase:**
```
Billing: $0.0104/hour (on-demand)
Monthly: ~₹630
Status: Pay-as-you-go
```

### **After Purchase:**
```
Billing: $0.0063/hour (reserved)
Monthly: ~₹382
Status: Pre-paid for 1 year
Savings: ₹248/month!
```

---

## 💡 IMPORTANT NOTES:

### **1. Reservation is Regional:**
```
✅ Works for: Any t3.micro in ap-south-1 (Mumbai)
✅ Even if you stop/start instance
❌ Won't work if you change to different region
```

### **2. Instance Type Specific:**
```
✅ Works for: t3.micro only
❌ Won't work if you resize to t3.small or other types
```

### **3. One-Time Payment:**
```
Today: Pay ₹4,568
Next 12 months: No EC2 charges (pre-paid)
After 1 year: Either buy new reservation or pay on-demand
```

### **4. Can't Refund:**
```
⚠️ AWS does NOT refund Reserved Instance purchases
Make sure you'll use it for full year!

Our case: ✅ Hotel running continuously
          ✅ Safe to purchase!
```

### **5. Credits Still Apply:**
```
✅ Your $92 AWS credits will still be used
✅ Just for other services (S3, backups, etc.)
✅ Won't be used for EC2 (already pre-paid)
```

---

## 🚨 COMMON MISTAKES TO AVOID:

### **Wrong Region:**
```
❌ Buying in us-east-1 (mistake!)
✅ Buy in ap-south-1 (Mumbai) ✅

Check top-right corner of console!
```

### **Wrong Instance Type:**
```
❌ Buying t3.small (wrong!)
❌ Buying t2.micro (wrong!)
✅ Buy t3.micro ✅
```

### **Wrong Payment Option:**
```
❌ No Upfront (expensive!)
❌ Partial Upfront (more expensive)
✅ All Upfront (cheapest!) ✅
```

### **Wrong Quantity:**
```
❌ Quantity: 2 or more (too many!)
✅ Quantity: 1 ✅
```

---

## 📱 MOBILE APP:

**Can also purchase via AWS Mobile App:**
```
1. Download: AWS Console Mobile App
2. Login
3. EC2 → Reserved Instances → Purchase
4. Same steps as above
```

---

## ⏱️ HOW LONG DOES IT TAKE?

```
Purchase process:  2-3 minutes
Payment:           Instant
Activation:        30 seconds
Applied to instance: Automatic
Total time:        5 minutes max!
```

---

## 💰 PRICING BREAKDOWN:

### **On-Demand (Current):**
```
Hourly: $0.0104
Daily:  $0.0104 × 24 = $0.2496
Monthly: $0.2496 × 30 = $7.488
Yearly: $7.488 × 12 = $89.856

INR: $89.856 × ₹83 = ₹7,458/year
```

### **Reserved (1 Year All Upfront):**
```
Upfront: $55
Monthly: $0
Yearly: $55

INR: $55 × ₹83 = ₹4,565/year

Savings: ₹7,458 - ₹4,565 = ₹2,893/year! 🎉
```

---

## ✅ CHECKLIST:

Before clicking "Purchase", verify:

- [ ] Region: ap-south-1 (Mumbai)
- [ ] Instance Type: t3.micro
- [ ] Platform: Linux/UNIX
- [ ] Term: 1 year
- [ ] Payment: All Upfront
- [ ] Quantity: 1
- [ ] Price: ~$55 (₹4,500-4,700)

If all checked ✅ → Proceed!

---

## 📞 NEED HELP?

**If stuck:**
1. Take screenshot
2. Note exact error message
3. Ask the Master! 🧙

**AWS Support:**
- Phone: 1800-102-1000 (India)
- Chat: Available 24/7 in console

---

## 🎉 AFTER PURCHASE:

**You'll save:**
- ₹248/month
- ₹2,976/year
- ₹8,928 over 3 years (if you renew)

**And you did it in 5 minutes!** 💪

---

**Now go purchase!** 🚀

**Come back after purchase to verify and do AKS Noida!** ✅
