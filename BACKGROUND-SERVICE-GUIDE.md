# 🚀 Background Service - Permanent Auto-Deploy

## Kya Hai Ye?

Ye **permanent background service** hai jo:
- ✅ **Hamesha chalti hai** (24/7)
- ✅ **Computer restart ke baad bhi** automatic start
- ✅ **Terminal band karo** toh bhi chalti rahegi
- ✅ **Login pe automatic** start ho jati hai
- ✅ **File changes watch** karti hai continuously
- ✅ **Auto commit + push + deploy** karta hai

**Ab aapko manually start nahi karna padega!**

---

## 📦 Installation (Ek Baar)

### Step 1: Install Karo
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
chmod +x service-*.sh
./service-install.sh
```

Done! ✅ Service installed aur running!

---

## 🎯 Management Commands

### Check Status
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./service-status.sh
```
Dekhega service running hai ya nahi

### Start Service
```bash
./service-start.sh
```
Service start karo (already running ho toh message dega)

### Stop Service
```bash
./service-stop.sh
```
Service band karo (jab chahiye temporary stop)

### View Live Logs
```bash
./service-logs.sh
```
Real-time me dekho kya ho raha hai

### Uninstall Service
```bash
./service-uninstall.sh
```
Service completely remove karo

---

## 📊 How It Works

### Normal Flow:
```
1. Service running hai background me (hamesha)
2. Aap file edit karo → Save (⌘+S)
3. Service detect karta hai change
4. Auto commit → Auto push → Auto deploy (with backup)
5. Done! Site updated!
```

### Computer Restart:
```
1. Computer restart karo
2. Login karo
3. Service automatic start ho jati hai
4. Koi manual command nahi chahiye!
```

---

## 📁 Logs Location

### Live Logs:
```bash
./service-logs.sh
```

### Log Files:
- **Output**: `~/Documents/sharad/hotel-neelkanth-tracker/logs/autodeploy.log`
- **Errors**: `~/Documents/sharad/hotel-neelkanth-tracker/logs/autodeploy-error.log`

### View Logs:
```bash
# Last 50 lines
tail -50 ~/Documents/sharad/hotel-neelkanth-tracker/logs/autodeploy.log

# Live logs
./service-logs.sh
```

---

## 🛡️ Safety Features

| Feature | Status |
|---------|--------|
| Auto Backup | ✅ Har deploy se pehle |
| Auto Restart | ✅ Crash ho toh restart |
| Error Logging | ✅ Errors logged |
| Rollback Ready | ✅ Hamesha available |
| 24/7 Watching | ✅ Continuous monitoring |

---

## 🎬 Daily Workflow

### Subah:
- Computer on karo → Login karo
- **Service automatic start!** ✅
- Koi command nahi chahiye

### Din Bhar:
- File edit → Save → Auto deploy ✅
- Terminal close kar do → Service chalti rahegi ✅

### Shaam:
- Computer band kar do → Service stop (normal)
- Kal automatic start ho jayegi

---

## ⚙️ Technical Details

**Service Name:** `com.neelkanth.autodeploy`

**Type:** macOS LaunchAgent

**Auto-Start:** Yes (on login)

**Auto-Restart:** Yes (if crashes)

**Watches:**
- `frontend/src/`
- `backend/src/`

**Actions:**
- Git commit (with timestamp)
- Git push to GitHub
- Backup creation
- Deploy to production
- Services restart

---

## 🔍 Troubleshooting

### Service not running?
```bash
./service-status.sh
./service-start.sh
```

### Check logs:
```bash
./service-logs.sh
```

### Reinstall:
```bash
./service-uninstall.sh
./service-install.sh
```

### Stop completely:
```bash
./service-stop.sh
```

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| **Install** | `./service-install.sh` |
| **Status** | `./service-status.sh` |
| **Start** | `./service-start.sh` |
| **Stop** | `./service-stop.sh` |
| **Logs** | `./service-logs.sh` |
| **Uninstall** | `./service-uninstall.sh` |
| **Rollback** | `./quick-rollback.sh` |

---

## ✅ Benefits

### Before (Manual):
```
1. Terminal open karo
2. ./auto-deploy-full.sh run karo
3. Terminal open rakho
4. Restart pe phir repeat
```

### After (Background Service):
```
1. Ek baar install karo
2. Bas! Hamesha chalti hai
3. Koi manual work nahi
4. Terminal se independent
```

---

## 🎯 Perfect For:

✅ **Daily development** - Hamesha ready
✅ **Multiple terminals** - Service independent
✅ **Computer restart** - Auto start
✅ **Background work** - Terminal band kar sakte ho
✅ **Zero maintenance** - Ek baar setup, hamesha kaam

---

## 🆘 Emergency Rollback

Service running ho ya na ho, rollback **hamesha kaam karega:**

```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./quick-rollback.sh
```

---

## 📞 Support Commands

### View all running services:
```bash
launchctl list | grep neelkanth
```

### Check service details:
```bash
launchctl list com.neelkanth.autodeploy
```

### Force restart:
```bash
./service-stop.sh
./service-start.sh
```

---

**Ab aap tension-free! Service hamesha chalti rahegi background me!** 🎉

Install karein? One command: `./service-install.sh` ✅
