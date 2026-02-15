# Deployment Status - AKS Office Source Integration

## ✅ Completed Changes

### 1. Code Changes
**File: frontend/src/pages/Dashboard.tsx**

- **Removed "AKS Office" from Source dropdown**
  - Source options now: Walk-in, OTA, Agent only

- **Added "AKS Office" to Agent dropdown**
  - When source = "Agent", AKS Office appears as first option
  - All other agents from Agents table appear below it

### 2. Build Status
- ✅ Frontend built successfully
- ✅ Files copied to `localhost/` directory
- ✅ Ready for deployment

## ⏳ Pending

### Deployment to Production
- ❌ Server `13.201.111.154` is currently unreachable
- Reason: SSH connection timeout, 100% packet loss

## 🚀 To Deploy

### Option 1: Use Deployment Script
```bash
./deploy.sh
```

### Option 2: Manual Deployment
```bash
rsync -avz --delete localhost/ ubuntu@13.201.111.154:/var/www/hotel-neelkanth
```

## 📋 What Changed (User Perspective)

**Before:**
- Source dropdown had: Walk-in, OTA, Agent, **AKS Office**
- This was confusing because AKS Office is a type of agent, not a booking source

**After:**
- Source dropdown: Walk-in, OTA, Agent
- When "Agent" is selected → Agent dropdown shows "AKS Office" + all other agents
- This correctly treats AKS Office as an agent, not a separate source

## 🔍 Testing Checklist

After deployment, test:
1. ✓ Create new booking with source = "Agent"
2. ✓ Select "AKS Office" from agent dropdown
3. ✓ Verify booking is created correctly
4. ✓ Check that payment routing works (Office payments → Office tab)
5. ✓ Verify agent commission logic (if applicable)

## Server Troubleshooting

If deployment fails:
1. Check AWS EC2 console - ensure instance is running
2. Verify security group allows SSH (port 22) from your IP
3. Try SSH manually: `ssh ubuntu@13.201.111.154`
4. Check nginx/server logs after deployment

---
Last updated: 2026-02-13
