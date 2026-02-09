# ⏰ JUNE 2026 REMINDER - Reserved Instance Purchase

## 📅 When: June 2026 (Before July 30, 2026)

---

## 🎯 What To Do:

### **Action: Purchase Reserved Instances**

**Why Now:**
- AWS credits expire: July 30, 2026
- Purchase RI in June before credits run out
- Start saving immediately from August

---

## 💰 Expected Savings:

### **Hotel Neelkanth:**
```
Purchase: ₹4,800 (one-time)
Saves: ₹248/month = ₹2,976/year
```

### **AKS Noida:**
```
Purchase: ₹5,500 (one-time)
Saves: ₹496/month = ₹5,952/year
```

### **Total:**
```
Investment: ₹10,300 (one-time)
Savings: ₹744/month = ₹8,928/year
Break-even: 14 months
```

---

## 📋 Ready-Made Guides:

**Everything already prepared:**

1. ✅ **RESERVED-INSTANCE-PURCHASE-GUIDE.md**
   - Step-by-step console purchase
   - Exact settings to use
   - Payment process

2. ✅ **OPTIMIZATION-GUIDE.md**
   - Complete optimization strategy
   - Detailed instructions
   - Verification steps

3. ✅ **QUICK-OPTIMIZATION.md**
   - 5-minute summary
   - Quick reference

---

## 🎯 Quick Steps (June 2026):

**1. Check Credits:**
```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-06-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost
```

**2. Purchase via Console:**
```
Go to: EC2 → Reserved Instances → Purchase
Settings:
  - Type: t3.micro (Hotel) + t3.small (AKS)
  - Term: 1 year
  - Payment: All Upfront
  - Follow: RESERVED-INSTANCE-PURCHASE-GUIDE.md
```

**3. Verify:**
```bash
aws ec2 describe-reserved-instances --region ap-south-1
# Check State = "active"
```

---

## 💳 Payment:

**Method Already Configured:**
- Visa card: •••• 0009
- Set as default: ✅
- Ready to use: ✅

---

## 📊 Current Setup (Feb 2026):

```
✅ Monitoring: Active (daily checks)
✅ Payment method: Added
✅ Guides: Complete
✅ Scripts: Ready
✅ Everything prepared!
```

**Just need to execute in June!**

---

## ⏰ Set Calendar Reminder:

**Google Calendar:**
```
Title: "AWS Reserved Instance Purchase"
Date: June 15, 2026
Time: 10:00 AM
Description: Purchase RI for both servers
            Check: hotel-neelkanth-tracker/JUNE-2026-REMINDER.md
Repeat: None
```

---

## 📞 If You Forget:

**AWS will email you:**
- Free tier expiring warnings (30 days before)
- Billing alerts (when charges start)
- You'll be reminded automatically

---

## 💡 Why We Waited:

**Decision Made (Feb 2026):**
- Use free credits first ($92.62)
- Credits expire July 30, 2026
- Then purchase RI for savings

**Smart because:**
- No upfront cost for 5 months
- Credits utilized fully
- RI purchase when needed

---

## 🎯 Expected Timeline:

```
Feb 2026: Decision made, monitoring setup ✅
Jun 2026: Purchase Reserved Instances ⏳
Jul 2026: Credits expire
Aug 2026: Start saving ₹744/month! 🎉
```

---

## 📁 Files to Reference:

```
Main guide:
  ~/Documents/sharad/hotel-neelkanth-tracker/
    - RESERVED-INSTANCE-PURCHASE-GUIDE.md (detailed)
    - OPTIMIZATION-GUIDE.md (complete process)
    - QUICK-OPTIMIZATION.md (summary)

This reminder:
  - JUNE-2026-REMINDER.md (you're reading it!)

Monitoring:
  - MONITORING-SETUP-COMPLETE.md
  - DISK-MONITORING-GUIDE.md
  - check-servers.sh (run anytime)
```

---

## ✅ Checklist (June 2026):

**Before Purchase:**
- [ ] Check credits balance (should be low)
- [ ] Verify payment method still valid
- [ ] Review current monthly costs
- [ ] Confirm both servers still running

**During Purchase:**
- [ ] Hotel Neelkanth: t3.micro, 1 year, All Upfront
- [ ] AKS Noida: t3.small, 1 year, All Upfront
- [ ] Total payment: ~₹10,300

**After Purchase:**
- [ ] Verify State = "active"
- [ ] Check billing reflects RI
- [ ] Update monitoring if needed
- [ ] Celebrate savings! 🎉

---

## 💰 Final Numbers:

**Investment: ₹10,300 (June 2026)**

**Returns:**
```
Year 1: ₹8,928 savings
Year 2: ₹8,928 savings (renew RI)
Year 3: ₹8,928 savings (renew RI)

3-year total: ₹26,784 saved!
ROI: 260%
```

**Worth it!** 💯

---

## 📞 Need Help in June?

**If stuck:**
1. Read guides (all ready!)
2. AWS Support: 1800-102-1000
3. Follow step-by-step instructions

**All preparation done today!**

---

**See you in June 2026!** 🚀

**Happy savings!** 💰
