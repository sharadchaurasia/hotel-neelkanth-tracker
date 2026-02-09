# 📊 Disk Space Monitoring - Complete Guide

## 🎯 How Will You Know Disk is Full?

---

## **Method 1: Manual Check** ⚡ **INSTANT (30 seconds)**

### **Anytime Check Karo:**

```bash
# Connect to server
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58

# Check disk space (one command)
df -h /
```

### **Output Example:**
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/root        15G  4.5G  10G  31% /
                                ↑
                          This is percentage!
```

### **What it means:**
```
✅ 0-70%   = Healthy (green zone)
⚠️  70-85% = Warning (yellow zone) - Plan to increase soon
🚨 85-95% = Critical (red zone) - Increase NOW!
❌ 95%+    = Emergency - Server may crash!
```

---

## **Method 2: Automated Daily Email** 📧 **RECOMMENDED**

### **Setup Once (5 minutes):**

**Step 1: Create monitoring script on Hotel Neelkanth**
```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58

# Create script
cat > ~/disk-monitor.sh << 'EOF'
#!/bin/bash
THRESHOLD=80
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

echo "=== Hotel Neelkanth Disk Check ==="
echo "Date: $(date)"
echo "Usage: $USAGE%"
df -h /

if [ $USAGE -ge $THRESHOLD ]; then
    echo "⚠️ WARNING: Disk $USAGE% full!"
    # Log to file for review
    echo "$(date): Disk usage $USAGE%" >> ~/disk-alerts.log
fi
EOF

chmod +x ~/disk-monitor.sh
```

**Step 2: Setup daily cron job**
```bash
# Run every day at 9 AM
crontab -e

# Add this line:
0 9 * * * /home/ubuntu/disk-monitor.sh >> /home/ubuntu/disk-check.log 2>&1
```

**Step 3: Repeat for AKS Noida**
```bash
ssh -i ~/.ssh/aksnoida.pem ubuntu@3.6.202.196
# Same setup as above
```

### **How it works:**
```
Every day at 9 AM:
✅ Script checks disk usage
✅ Logs to file
✅ If > 80%, writes alert

You check log:
cat ~/disk-check.log
```

---

## **Method 3: Real-time Dashboard** 📊 **VISUAL**

### **Add to Your CRM (15 minutes):**

**Option A: Simple API endpoint**
```typescript
// backend/src/system/system.controller.ts
@Get('disk-usage')
async getDiskUsage() {
  const { execSync } = require('child_process');
  const output = execSync('df -h / | tail -1').toString();
  const parts = output.split(/\s+/);

  return {
    total: parts[1],
    used: parts[2],
    available: parts[3],
    percentage: parseInt(parts[4]),
    status: parseInt(parts[4]) > 80 ? 'warning' : 'healthy'
  };
}
```

**Option B: Add to admin dashboard**
```tsx
// Show disk usage widget
<Card>
  <h3>Server Health</h3>
  <Progress value={diskUsage.percentage} />
  <p>{diskUsage.used} / {diskUsage.total} used</p>
</Card>
```

---

## **Method 4: WhatsApp Alert** 📱 **INSTANT NOTIFICATION**

### **Using Existing Daily Summary Email:**

**Add disk check to daily email**
```typescript
// In your daily summary email
async sendDailyEmail() {
  const diskUsage = await this.getDiskUsage();

  let emailContent = `
    Daily Summary - ${today}

    📊 Server Status:
    - Disk Usage: ${diskUsage.percentage}%
    ${diskUsage.percentage > 80 ? '⚠️ WARNING: Disk getting full!' : '✅ Healthy'}

    ... rest of email ...
  `;
}
```

**Benefit:** You already get daily emails, just add disk status!

---

## 📅 **Monitoring Schedule (Recommended):**

### **Daily (Automatic):**
```
✅ Cron job runs at 9 AM
✅ Checks disk usage
✅ Logs to file
✅ Includes in daily email
```

### **Weekly (Manual - 1 minute):**
```bash
# Every Sunday, quick check
ssh ubuntu@65.1.252.58 "df -h /"
ssh ubuntu@3.6.202.196 "df -h /"
```

### **Monthly (Review logs):**
```bash
# Check trend
cat ~/disk-check.log | grep "Usage:"
# See if usage is growing
```

---

## 🚨 **Alert Thresholds:**

### **Set up 3-tier alerts:**

**Tier 1: Info (70%)** ℹ️
```
Action: Just FYI, monitor
Time frame: Check in 2-3 months
```

**Tier 2: Warning (80%)** ⚠️
```
Action: Plan disk increase
Time frame: 1-2 weeks
Email subject: "⚠️ Disk Space Alert - 80% Full"
```

**Tier 3: Critical (90%)** 🚨
```
Action: Increase disk NOW
Time frame: 24 hours
Email subject: "🚨 URGENT: Disk 90% Full!"
```

---

## 📊 **Quick Reference Card:**

```
┌─────────────────────────────────────┐
│   DISK SPACE QUICK CHECK            │
├─────────────────────────────────────┤
│ Command: df -h /                    │
│                                     │
│ 0-70%   ✅ All good                 │
│ 70-85%  ⚠️  Plan increase           │
│ 85-95%  🚨 Increase NOW             │
│ 95%+    ❌ EMERGENCY                │
│                                     │
│ Increase time: 2-3 minutes          │
│ Cost increase: ~₹30-40/month        │
└─────────────────────────────────────┘
```

---

## 💡 **Smart Monitoring Tips:**

### **1. Check After Major Activities:**
```
✅ After bulk data import
✅ After large backup restore
✅ After big file uploads
✅ After database migrations
```

### **2. Review Monthly Trends:**
```bash
# See usage over time
for month in Jan Feb Mar Apr; do
  grep "$month.*Usage:" ~/disk-check.log
done

# See growth pattern
Jan: 31%
Feb: 33%  (+2% per month)
Mar: 35%
Apr: 37%

# Calculate: 15GB × 0.02 = 0.3GB/month growth
# At 80% (12GB), you have: (12-5.5)/0.3 = 21 months
```

---

## 🎯 **RECOMMENDED SETUP (Do This Now):**

### **5-Minute Setup:**

**Step 1: Create monitoring script** ✅
```bash
ssh ubuntu@65.1.252.58
# Copy disk-monitor.sh script (from above)
```

**Step 2: Setup daily cron** ✅
```bash
crontab -e
# Add: 0 9 * * * ~/disk-monitor.sh >> ~/disk-check.log
```

**Step 3: Test it** ✅
```bash
~/disk-monitor.sh
# Should show current usage
```

**Step 4: Repeat for AKS Noida** ✅

**Step 5: Set calendar reminder** ✅
```
Google Calendar:
- Weekly reminder: "Check server disk space"
- Takes 1 minute
```

---

## ✅ **You'll Know Disk is Full When:**

1. ✅ **Daily log shows warning** (automated)
2. ✅ **Weekly manual check** (1 min every Sunday)
3. ✅ **Monthly trend review** (growing too fast?)
4. ✅ **Dashboard widget** (if you add it)
5. ✅ **Daily email includes status** (already sending daily email)

---

## 🎯 **Bottom Line:**

**You will know because:**
- ✅ Script checks daily (automatic)
- ✅ You check weekly (1 minute)
- ✅ Logs are available anytime
- ✅ Clear thresholds (70%, 80%, 90%)
- ✅ Easy to increase (2 minutes)

**No surprise full disk!** 💯

---

## 📞 **Quick Commands Reference:**

```bash
# Check disk NOW
ssh ubuntu@65.1.252.58 "df -h /"

# View monitoring logs
ssh ubuntu@65.1.252.58 "tail ~/disk-check.log"

# View alerts only
ssh ubuntu@65.1.252.58 "grep WARNING ~/disk-alerts.log"

# Check both servers at once
for host in 65.1.252.58 3.6.202.196; do
  echo "=== $host ===";
  ssh ubuntu@$host "df -h /";
done
```

---

**Setup karein monitoring ab?** 🚀
