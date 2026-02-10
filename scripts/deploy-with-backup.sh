#!/bin/bash

# Hotel Neelkanth Safe Deployment Script
# Automatically creates backup before deploying new code

set -e

echo "=================================================="
echo "  Hotel Neelkanth - Safe Deployment"
echo "=================================================="
echo ""

# 1. Create automatic backup before deployment
echo "Step 1: Creating backup of current system..."
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 'bash -s' < ./backup-system.sh
echo ""

# 2. Build frontend
echo "Step 2: Building frontend..."
cd ../frontend

# Clean dist directory before build
rm -rf dist/
echo "   ✓ Cleaned old build"

# Build frontend
if ! npm run build; then
    echo ""
    echo "❌ ERROR: Frontend build failed!"
    echo "❌ Deployment stopped to prevent deploying broken code"
    echo ""
    exit 1
fi

# Verify build output
if [ ! -f "dist/index.html" ]; then
    echo ""
    echo "❌ ERROR: Frontend build incomplete - index.html not found!"
    echo "❌ Deployment stopped"
    echo ""
    exit 1
fi

echo "   ✓ Frontend built successfully"
echo ""

# 3. Build backend
echo "Step 3: Building backend..."
cd ../backend

# Clean dist directory before build
rm -rf dist/
echo "   ✓ Cleaned old build"

# Build backend
if ! npm run build; then
    echo ""
    echo "❌ ERROR: Backend build failed!"
    echo "❌ Deployment stopped to prevent deploying broken code"
    echo ""
    exit 1
fi

# Verify build output
if [ ! -f "dist/main.js" ]; then
    echo ""
    echo "❌ ERROR: Backend build incomplete - main.js not found!"
    echo "❌ Deployment stopped"
    echo ""
    exit 1
fi

echo "   ✓ Backend built successfully"
echo ""

# 4. Deploy frontend
echo "Step 4: Deploying frontend..."
cd ../frontend
rsync -avz --delete -e "ssh -i ~/.ssh/hotel-neelkanth.pem" dist/ ubuntu@65.1.252.58:/var/www/hotel-neelkanth/frontend/dist/
echo "   ✓ Frontend deployed"
echo ""

# 5. Deploy backend
echo "Step 5: Deploying backend..."
cd ../backend
rsync -avz --delete -e "ssh -i ~/.ssh/hotel-neelkanth.pem" dist/ ubuntu@65.1.252.58:/var/www/hotel-neelkanth/backend/dist/
rsync -avz -e "ssh -i ~/.ssh/hotel-neelkanth.pem" package*.json ubuntu@65.1.252.58:/var/www/hotel-neelkanth/backend/
echo "   ✓ Backend deployed"
echo ""

# 6. Restart services
echo "Step 6: Restarting services..."
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 << 'EOF'
cd /var/www/hotel-neelkanth/backend
npm install --production
pm2 restart hotel-api
pm2 save
sudo systemctl reload nginx
EOF
echo "   ✓ Services restarted"
echo ""

echo "=================================================="
echo "  ✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "Site: https://neelkanth.akshospitality.in"
echo ""
echo "If something went wrong, rollback with:"
echo "ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58"
echo "cd /var/backups/hotel-neelkanth"
echo "ls deployments  # to see available backups"
echo "./restore-backup.sh <timestamp>"
echo ""
