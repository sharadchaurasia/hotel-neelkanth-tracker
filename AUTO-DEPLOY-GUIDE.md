# 🚀 Auto-Deploy System - Complete Guide

## Kya Hai Ye?

Ye system **automatically** commit, push aur deploy karta hai jab aap koi file save karte ho. Aapko manually commands nahi chalani padti.

---

## ⚡ Quick Start

### Option 1: Safe Auto-Deploy (Recommended) ✅

**Kya hoga:**
- File save karo → Auto commit
- Auto push to GitHub
- Deploy se pehle **puchega** (yes/no)
- Backup automatic

**Command:**
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./auto-deploy.sh
```

Terminal open rakhna - ye changes watch karega!

---

### Option 2: Full Auto-Deploy ⚠️

**Kya hoga:**
- File save karo → Auto commit
- Auto push to GitHub
- **Automatic deploy** (koi confirmation nahi)
- Backup automatic

**Command:**
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./auto-deploy-full.sh
```

⚠️ **Warning:** Ye production pe directly deploy karega without asking!

---

## 📋 Setup (Pehli baar)

### Install fswatch:
```bash
brew install fswatch
```

### Make scripts executable:
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
chmod +x auto-deploy.sh auto-deploy-full.sh
```

Done! ✅

---

## 🎯 Kaise Use Karein?

### Normal Work Day (Safe Mode):

1. Terminal open karo
2. Run karo:
   ```bash
   cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
   ./auto-deploy.sh
   ```
3. VS Code me changes karo
4. File save karo (⌘+S)
5. Terminal me dekho - automatically:
   - ✅ Commit ho jayega
   - ✅ Push ho jayega
   - ⚠️ Deploy ke liye puchega: `yes` type karo

### Emergency/Quick Changes (Full Auto):

1. Terminal open karo
2. Run karo:
   ```bash
   cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
   ./auto-deploy-full.sh
   ```
3. File save karo → Automatic deploy!

---

## 🛡️ Safety Features

✅ **Automatic Backup** - Har deployment se pehle
✅ **Git History** - Har change committed
✅ **Rollback Ready** - Galat ho jaye toh `./quick-rollback.sh`
✅ **Watch Mode** - Sirf src/ folders ko watch karta hai

---

## ⚙️ Technical Details

### Ye folders watch hote hain:
- `frontend/src/`
- `backend/src/`

### Ye ignore hote hain:
- `node_modules/`
- `dist/`
- `.git/`
- Other build files

### Commit Message Format:
```
auto: Update filename.tsx - 2026-02-10 14:30:45

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 🔄 Workflow Examples

### Example 1: UI Change
```
1. Open NewBooking.tsx in VS Code
2. Change button color
3. Save file (⌘+S)
4. Terminal shows:
   📝 Changes detected: frontend/src/pages/NewBooking.tsx
   ✅ Committed
   ✅ Pushed to GitHub
   🚀 Ready to deploy? (yes/no): yes
   🚀 Deploying with backup...
   ✅ Deployment complete!
```

### Example 2: Multiple Files
```
1. Edit Dashboard.tsx and DayBook.tsx
2. Save both files
3. Auto-commit with both filenames
4. Auto-push
5. Ask once for deploy
```

---

## 🛑 How to Stop

Press **Ctrl+C** in terminal

Auto-deploy mode band ho jayega.

---

## ⚠️ Important Notes

1. **Terminal open rakhna hai** - Band kar diya toh auto-deploy band ho jayega
2. **One terminal per project** - Ek hi terminal me chalao
3. **Production pe careful** - Safe mode use karo production ke liye
4. **Testing** - Pehle test environment pe try karo
5. **Backup hai** - Galat ho jaye toh `./quick-rollback.sh`

---

## 🎬 Start Karo Aise:

### Morning - Work Start
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./auto-deploy.sh
```
Terminal open rakho → Kaam karo → Save → Auto commit/push/deploy!

### Evening - Work Done
Press **Ctrl+C** → Terminal band karo → Done!

---

## 📊 Status Check

Auto-deploy chal raha hai ya nahi?

Terminal me ye dikhna chahiye:
```
👀 Watching for more changes...
```

---

## 🆘 Troubleshooting

### fswatch not found?
```bash
brew install fswatch
```

### Permission denied?
```bash
chmod +x scripts/*.sh
```

### Deploy fail ho gaya?
```bash
./quick-rollback.sh
```

---

## ✅ Best Practices

1. **Safe mode use karo** normal work ke liye
2. **Terminal always open** rakho jab kaam kar rahe ho
3. **Test before deploy** - Pehle local test, phir deploy
4. **Backup check** - Deployment se pehle backup confirm ho
5. **One change at a time** - Ek feature → Save → Deploy → Test

---

**Happy Auto-Deploying! 🚀**

Ab aapko manually git commands nahi chalani padegi!
