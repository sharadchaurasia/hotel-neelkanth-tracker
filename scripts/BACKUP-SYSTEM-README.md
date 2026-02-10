# 🛡️ Hotel Neelkanth Backup & Rollback System

## Kya Hai Ye System?

Ye system **automatic backup** leta hai har deployment se pehle. Agar kuch galat ho jaye, toh ek command se sab kuch pehle jaisa ho jayega - UI, database, code, sab kuch.

## 📋 Features

✅ **Automatic Backup** - Har deployment se pehle automatic backup
✅ **Database Backup** - Complete database ka backup
✅ **Code Backup** - Frontend aur backend dono ka backup
✅ **Easy Rollback** - Ek command se wapas pehle jaisa
✅ **30 Days Database** - Last 30 din ka database history
✅ **10 Deployments** - Last 10 deployments ka backup
✅ **Safety Backup** - Rollback se pehle bhi backup lega

---

## 🚀 Kaise Use Karein?

### 1️⃣ Pehli Baar Setup (Ek baar karna hai)

Server pe scripts install karein:

```bash
cd /Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker/scripts

# Scripts ko executable banao
chmod +x backup-system.sh restore-backup.sh deploy-with-backup.sh quick-rollback.sh

# Scripts ko server pe copy karo
scp -i ~/.ssh/hotel-neelkanth.pem backup-system.sh ubuntu@65.1.252.58:/var/backups/hotel-neelkanth/
scp -i ~/.ssh/hotel-neelkanth.pem restore-backup.sh ubuntu@65.1.252.58:/var/backups/hotel-neelkanth/

# Server pe directory banao
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 "sudo mkdir -p /var/backups/hotel-neelkanth/{database,deployments} && sudo chown -R ubuntu:ubuntu /var/backups/hotel-neelkanth"
```

---

### 2️⃣ Deployment (Backup ke saath)

**Pehle jaisa deploy karne ke bajaye, ab ye command use karein:**

```bash
cd /Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker/scripts
./deploy-with-backup.sh
```

Ye automatically:
- ✅ Pehle backup lega (database + code)
- ✅ Phir build karega
- ✅ Phir deploy karega
- ✅ Agar kuch galat ho, rollback info dega

---

### 3️⃣ Rollback (Wapas Jaana)

Agar kuch galat ho gaya aur aapko **pehle ki state** pe wapas jana hai:

#### 🔴 Option A: Quick Rollback (Sabse Fast)

**Last backup pe instantly wapas jaane ke liye:**

```bash
cd /Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker/scripts
./quick-rollback.sh
```

Bas! Ek command se last working version restore ho jayega.

#### 🔴 Option B: Specific Backup (Kisi specific date pe jaana ho)

**Pehle available backups dekho:**

```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 "ls -lt /var/backups/hotel-neelkanth/deployments | head -n 11"
```

**Phir specific backup restore karo:**

```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58
cd /var/backups/hotel-neelkanth
./restore-backup.sh 20260209_153045  # Replace with your backup timestamp
```

---

### 4️⃣ Manual Backup (Bina Deploy Kiye)

Agar aap sirf backup lena chahte ho (bina deploy kiye):

```bash
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58
cd /var/backups/hotel-neelkanth
./backup-system.sh
```

---

## 📁 Backup Location

Server pe sab backups yahan stored hain:

```
/var/backups/hotel-neelkanth/
├── database/           # Database backups (30 days)
│   ├── db_backup_20260209_153045.sql.gz
│   ├── db_backup_20260209_164530.sql.gz
│   └── ...
├── deployments/        # Code backups (last 10)
│   ├── deploy_20260209_153045/
│   │   ├── frontend/
│   │   ├── backend/
│   │   ├── .env
│   │   └── git_commit.txt
│   └── ...
└── latest_backup.txt   # Last backup timestamp
```

---

## 🎯 Kab Use Karein?

| Situation | Command |
|-----------|---------|
| **Normal deployment** | `./deploy-with-backup.sh` |
| **Kuch galat ho gaya, turant wapas jana hai** | `./quick-rollback.sh` |
| **Purane specific version pe jana hai** | `./restore-backup.sh <timestamp>` |
| **Sirf backup lena hai** | `ssh + ./backup-system.sh` |

---

## ⚠️ Important Notes

1. **Har deployment se pehle backup automatic** - Aapko manually backup nahi lena padega
2. **Last 30 days database** - Database ka 30 din ka backup rahega
3. **Last 10 deployments** - Code ka last 10 deployments ka backup
4. **Rollback se pehle safety backup** - Restore karne se pehle current state ka bhi backup lega
5. **Zero downtime** - Backup system deployment ko slow nahi karega

---

## 🆘 Emergency Rollback (Agar Site Down Ho)

Agar site completely down ho gaya hai:

```bash
# Quick rollback (sabse fast)
cd /Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker/scripts
./quick-rollback.sh
```

Bas 2-3 minutes me sab kuch wapas pehle jaisa ho jayega!

---

## 📞 Support

Agar koi problem ho:

1. Pehle quick rollback try karo: `./quick-rollback.sh`
2. Available backups dekho: `ls -lt /var/backups/hotel-neelkanth/deployments`
3. Specific backup restore karo: `./restore-backup.sh <timestamp>`

---

## ✅ Summary

**Ab aap safe ho!** Kuch bhi change karo, backup automatic hai. Agar kuch galat ho jaye, ek command se wapas pehle jaisa ho jayega - UI, database, code sab kuch! 🎉
