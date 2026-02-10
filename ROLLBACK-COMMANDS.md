# 🛡️ Backup & Rollback - Simple Commands

## ⚡ Quick Commands (Copy-Paste Ready)

### 1. Safe Deployment (Automatic Backup ke saath)
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./deploy-with-backup.sh
```

### 2. Emergency Rollback (Turant wapas jaana)
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./quick-rollback.sh
```

Bas! Type `yes` and press Enter. 2-3 minutes me sab wapas pehle jaisa ho jayega.

---

## 📋 Backup Dekhna (Available backups)

```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 "ls -lt /var/backups/hotel-neelkanth/deployments"
```

---

## 🔄 Specific Backup Restore (Kisi purane version pe jana)

```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58
cd /var/backups/hotel-neelkanth
./restore-backup.sh 20260210_064447  # Replace with your timestamp
```

---

## 💾 Manual Backup (Bina deploy kiye)

```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 "cd /var/backups/hotel-neelkanth && export PGPASSWORD='JBrr85MttexyXBg15tdDfQUz' && ./backup-system.sh"
```

---

## ✅ System Status

**Backup System:** ✅ Active
**Location:** `/var/backups/hotel-neelkanth`
**Database Backups:** Last 30 days
**Code Backups:** Last 10 deployments

---

## 🎯 Usage Examples

### Scenario 1: Normal Update Deploy Karna
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./deploy-with-backup.sh
```
✅ Automatic backup + Deploy

---

### Scenario 2: Deploy ke baad kuch galat ho gaya
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./quick-rollback.sh
```
✅ Last working version restore

---

### Scenario 3: Site completely down
```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./quick-rollback.sh
```
✅ Emergency restore

---

## 📞 Important Notes

1. **Har deployment automatic backup** - Aapko manually kuch nahi karna
2. **Rollback safe hai** - Restore se pehle current state ka backup lega
3. **Zero data loss** - Database + Code dono backup hai
4. **Fast recovery** - 2-3 minutes me restore

---

## 🆘 Emergency? Do This:

```bash
cd ~/Documents/sharad/hotel-neelkanth-tracker/scripts
./quick-rollback.sh
```

Type `yes` → Press Enter → Wait 2 minutes → Site restored! ✅
