#!/bin/bash

# Hotel Neelkanth Quick Rollback
# Instantly rollback to last working backup

set -e

echo "=================================================="
echo "  Hotel Neelkanth - Quick Rollback"
echo "=================================================="
echo ""

# Get the last backup timestamp
LAST_BACKUP=$(ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 "ls -t /var/backups/hotel-neelkanth/deployments | head -n 2 | tail -n 1 | sed 's/deploy_//'")

if [ -z "$LAST_BACKUP" ]; then
  echo "❌ Error: No previous backup found"
  exit 1
fi

echo "⚠️  This will rollback to: $LAST_BACKUP"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Rollback cancelled"
  exit 1
fi

echo ""
echo "Rolling back..."
echo ""

# Run restore on server
ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 << EOF
cd /var/backups/hotel-neelkanth
./restore-backup.sh $LAST_BACKUP
EOF

echo ""
echo "=================================================="
echo "  ✅ Rollback Complete!"
echo "=================================================="
echo ""
echo "System restored to: $LAST_BACKUP"
echo "Site: https://neelkanth.akshospitality.in"
echo ""
