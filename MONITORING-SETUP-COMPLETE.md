# ✅ Monitoring Setup - Complete!

## 🎯 What We Just Configured:

---

## 📊 **Both Servers Now Have:**

### **1. Daily Automated Check** ⏰
```
Schedule: Every day at 9:00 AM IST
Action: Checks disk usage automatically
Logs: Saved to ~/disk-check.log
Alerts: Saved to ~/disk-alerts.log (if > 80%)
```

### **2. Monitoring Script** 📝
```
Location: ~/disk-monitor.sh
What it does:
  ✅ Checks disk usage percentage
  ✅ Logs to file with timestamp
  ✅ Shows status (Healthy/Warning/Critical)
  ✅ Records alerts if > 80%
```

### **3. Threshold Alerts** 🚨
```
0-79%:  ✅ Healthy (normal logging)
80-84%: ⚠️  Warning (alert logged)
85-94%: 🚨 Critical (alert logged)
95%+:   ❌ Emergency (alert logged)
```

---

## 🖥️ **Server Status:**

### **Hotel Neelkanth (65.1.252.58)**
```
✅ Monitoring: ACTIVE
✅ Cron job: Configured (9 AM daily)
✅ Script: ~/disk-monitor.sh
✅ Current usage: 16% (4.5G / 29G)
✅ Status: HEALTHY
```

### **AKS Noida (3.6.202.196)**
```
✅ Monitoring: ACTIVE
✅ Cron job: Configured (9 AM daily)
✅ Script: ~/disk-monitor.sh
✅ Current usage: 40% (7.2G / 19G)
✅ Status: HEALTHY
```

---

## 🎛️ **How to Use:**

### **Option 1: Quick Check (From Your Mac)** ⚡
```bash
cd ~/Documents/sharad
./check-servers.sh
```
**Output:**
```
╔════════════════════════════════════╗
║  AWS SERVERS - DISK USAGE STATUS   ║
╚════════════════════════════════════╝

🏨 HOTEL NEELKANTH
  Total: 29G | Used: 4.5G (16%) | Free: 24G
  Status: ✅ HEALTHY

🏢 AKS NOIDA
  Total: 19G | Used: 7.2G (40%) | Free: 12G
  Status: ✅ HEALTHY
```

---

### **Option 2: Check Server Logs** 📋

**Hotel Neelkanth:**
```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58
cat ~/disk-check.log
```

**AKS Noida:**
```bash
ssh -i ~/.ssh/aksnoida.pem ubuntu@3.6.202.196
cat ~/disk-check.log
```

**View only alerts:**
```bash
cat ~/disk-alerts.log
```

---

### **Option 3: Manual Run (Force Check Now)** 🔄
```bash
# Hotel Neelkanth
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 "~/disk-monitor.sh"

# AKS Noida
ssh -i ~/.ssh/aksnoida.pem ubuntu@3.6.202.196 "~/disk-monitor.sh"
```

---

## 📅 **Monitoring Schedule:**

### **Automatic (No Action Needed):**
```
Daily 9:00 AM: Script runs automatically
              ↓
         Checks disk usage
              ↓
         Logs to file
              ↓
         If > 80%, creates alert
```

### **Manual (Your Part):**
```
Weekly: Run ./check-servers.sh (30 seconds)
        OR
        Check logs: cat ~/disk-check.log

Monthly: Review trend
         See if usage growing
```

---

## 🎯 **What Happens at Different Levels:**

### **Scenario 1: Normal (< 70%)** ✅
```
Daily check: ✅ Runs
Log entry: "Status: Healthy - 40%"
Alert file: No entry
Action needed: None
```

### **Scenario 2: Warning (70-84%)** ⚠️
```
Daily check: ✅ Runs
Log entry: "⚠️ WARNING: Disk usage 82%"
Alert file: Creates entry
Action needed: Plan disk increase in 1-2 weeks
```

### **Scenario 3: Critical (85%+)** 🚨
```
Daily check: ✅ Runs
Log entry: "🚨 WARNING: Disk usage 87%"
Alert file: Creates entry
Action needed: Increase disk NOW (within 24 hours)
```

---

## 📊 **Log File Examples:**

### **Daily Check Log:**
```
========================================
Date: Sun Feb  8 09:00:01 IST 2026
Server: Hotel Neelkanth
========================================
Filesystem      Size  Used Avail Use% Mounted on
/dev/root        29G  4.5G   24G  16% /

✅ Status: Healthy - Disk usage 16%

========================================
Date: Mon Feb  9 09:00:01 IST 2026
Server: Hotel Neelkanth
========================================
...
```

### **Alert Log (Only if > 80%):**
```
Sun Feb  8 09:00:02 IST 2026: Disk usage 82%
Mon Feb  9 09:00:02 IST 2026: Disk usage 83%
Tue Feb 10 09:00:02 IST 2026: Disk usage 84%
```

---

## 🛠️ **Useful Commands:**

### **View Last 5 Checks:**
```bash
ssh ubuntu@65.1.252.58 "tail -30 ~/disk-check.log"
```

### **View All Alerts:**
```bash
ssh ubuntu@65.1.252.58 "cat ~/disk-alerts.log"
```

### **Check if Cron is Running:**
```bash
ssh ubuntu@65.1.252.58 "crontab -l | grep disk-monitor"
```

### **Test Script Manually:**
```bash
ssh ubuntu@65.1.252.58 "~/disk-monitor.sh"
```

### **Clear Old Logs (if too big):**
```bash
ssh ubuntu@65.1.252.58 "echo '' > ~/disk-check.log"
```

---

## ⚙️ **Configuration Details:**

### **Cron Job:**
```cron
0 9 * * * /home/ubuntu/disk-monitor.sh
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0=Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23, 9 = 9 AM)
└─────────── Minute (0-59, 0 = :00)
```

### **Script Location:**
```
Hotel Neelkanth: /home/ubuntu/disk-monitor.sh
AKS Noida:       /home/ubuntu/disk-monitor.sh
Local Mac:       ~/Documents/sharad/check-servers.sh
```

---

## 🎯 **Quick Reference Card:**

```
┌──────────────────────────────────────────┐
│  DISK MONITORING - QUICK GUIDE           │
├──────────────────────────────────────────┤
│                                          │
│  Daily Check:   Automatic at 9 AM       │
│  Your Action:   Check weekly (30 sec)   │
│  Command:       ./check-servers.sh       │
│                                          │
│  Log Files:                              │
│    All checks: ~/disk-check.log          │
│    Alerts:     ~/disk-alerts.log         │
│                                          │
│  Thresholds:                             │
│    < 70%  ✅ Healthy                     │
│    70-84% ⚠️  Warning                    │
│    85%+   🚨 Critical                    │
│                                          │
│  To Increase Disk:                       │
│    Time: 2-3 minutes                     │
│    See: OPTIMIZATION-GUIDE.md            │
│                                          │
└──────────────────────────────────────────┘
```

---

## ✅ **Verification Checklist:**

- [x] Hotel Neelkanth monitoring script created
- [x] Hotel Neelkanth cron job configured
- [x] Hotel Neelkanth script tested successfully
- [x] AKS Noida monitoring script created
- [x] AKS Noida cron job configured
- [x] AKS Noida script tested successfully
- [x] Local check-servers.sh script created
- [x] All scripts executable
- [x] Both servers showing HEALTHY status

---

## 🎉 **MONITORING IS NOW LIVE!**

```
✅ Both servers monitored
✅ Daily automated checks
✅ Alert system active
✅ Easy local checking
✅ Ready for optimization!
```

---

## 📞 **Next Steps:**

**You're now ready to optimize!** 🚀

Monitoring is active, so you'll always know:
- Current disk usage
- When it's getting full
- Trend over time

**Proceed with optimization safely!** 💯

---

## 🎯 **Pro Tips:**

1. **Weekly habit:** Every Sunday, run `./check-servers.sh` (30 sec)
2. **Set reminder:** Google Calendar alert for weekly check
3. **Check before changes:** Before any major update, check disk space
4. **After optimization:** Monitor for 1 week to see new usage patterns

---

**All systems monitored and ready!** ✅
