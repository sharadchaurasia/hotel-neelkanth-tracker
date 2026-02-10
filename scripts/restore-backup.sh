#!/bin/bash

# Hotel Neelkanth Restore System
# This script restores database and code to a previous backup

set -e

BACKUP_DIR="/var/backups/hotel-neelkanth"

echo "=================================================="
echo "  Hotel Neelkanth - Restore Backup System"
echo "=================================================="
echo ""

# Check if timestamp provided
if [ -z "$1" ]; then
  echo "❌ Error: No backup timestamp provided"
  echo ""
  echo "Usage: ./restore-backup.sh <timestamp>"
  echo ""
  echo "Available backups:"
  echo ""
  ls -t "$BACKUP_DIR/deployments" | head -n 10
  echo ""
  exit 1
fi

TIMESTAMP=$1
DB_BACKUP_FILE="$BACKUP_DIR/database/db_backup_${TIMESTAMP}.sql.gz"
CODE_BACKUP_DIR="$BACKUP_DIR/deployments/deploy_${TIMESTAMP}"

# Verify backup exists
if [ ! -f "$DB_BACKUP_FILE" ] || [ ! -d "$CODE_BACKUP_DIR" ]; then
  echo "❌ Error: Backup not found for timestamp: $TIMESTAMP"
  echo ""
  echo "Available backups:"
  ls -t "$BACKUP_DIR/deployments" | head -n 10
  echo ""
  exit 1
fi

echo "⚠️  WARNING: This will restore the system to:"
echo "   Timestamp: $TIMESTAMP"
echo "   Database: $DB_BACKUP_FILE"
echo "   Code: $CODE_BACKUP_DIR"
echo ""
echo "Current system will be backed up before restore."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 1
fi

echo ""
echo "Starting restore process..."
echo ""

# 1. Create safety backup of current state
echo "📦 Creating safety backup of current state..."
SAFETY_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SAFETY_DIR="$BACKUP_DIR/safety_before_restore_$SAFETY_TIMESTAMP"
mkdir -p "$SAFETY_DIR"
pg_dump -h localhost -U hotel_admin -d hotel_neelkanth | gzip > "$SAFETY_DIR/database.sql.gz"
cp -r /var/www/hotel-neelkanth/frontend/dist "$SAFETY_DIR/frontend"
cp -r /var/www/hotel-neelkanth/backend/dist "$SAFETY_DIR/backend"
echo "   ✓ Safety backup created: $SAFETY_DIR"
echo ""

# 2. Stop backend service
echo "🛑 Stopping backend service..."
pm2 stop hotel-api || true
echo "   ✓ Backend stopped"
echo ""

# 3. Restore Database
echo "🔄 Restoring database..."
gunzip -c "$DB_BACKUP_FILE" | psql -h localhost -U hotel_admin -d hotel_neelkanth
echo "   ✓ Database restored"
echo ""

# 4. Restore Code
echo "🔄 Restoring frontend..."
rm -rf /var/www/hotel-neelkanth/frontend/dist
cp -r "$CODE_BACKUP_DIR/frontend" /var/www/hotel-neelkanth/frontend/dist
echo "   ✓ Frontend restored"
echo ""

echo "🔄 Restoring backend..."
rm -rf /var/www/hotel-neelkanth/backend/dist
cp -r "$CODE_BACKUP_DIR/backend" /var/www/hotel-neelkanth/backend/dist
echo "   ✓ Backend restored"
echo ""

# 5. Restart services
echo "🚀 Restarting services..."
pm2 start hotel-api
pm2 save
sudo systemctl reload nginx
echo "   ✓ Services restarted"
echo ""

echo "=================================================="
echo "  ✅ Restore Complete!"
echo "=================================================="
echo ""
echo "System restored to: $TIMESTAMP"
echo ""
echo "If something went wrong, safety backup is at:"
echo "$SAFETY_DIR"
echo ""
