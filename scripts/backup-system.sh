#!/bin/bash

# Hotel Neelkanth Backup System
# This script creates automatic backups before every deployment

set -e

BACKUP_DIR="/var/backups/hotel-neelkanth"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="$BACKUP_DIR/database/db_backup_$TIMESTAMP.sql"
CODE_BACKUP_DIR="$BACKUP_DIR/deployments/deploy_$TIMESTAMP"

echo "=================================================="
echo "  Hotel Neelkanth - Automatic Backup System"
echo "=================================================="
echo ""
echo "Creating backup: $TIMESTAMP"
echo ""

# Create backup directories if they don't exist
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/deployments"

# 1. Backup Database
echo "📦 Backing up database..."
pg_dump -h localhost -U hotel_admin -d hotel_neelkanth > "$DB_BACKUP_FILE"
gzip "$DB_BACKUP_FILE"
echo "   ✓ Database backed up: ${DB_BACKUP_FILE}.gz"
echo ""

# 2. Backup Current Deployment
echo "📦 Backing up current deployment..."
mkdir -p "$CODE_BACKUP_DIR"
cp -r /var/www/hotel-neelkanth/frontend/dist "$CODE_BACKUP_DIR/frontend"
cp -r /var/www/hotel-neelkanth/backend/dist "$CODE_BACKUP_DIR/backend"
cp /var/www/hotel-neelkanth/backend/.env "$CODE_BACKUP_DIR/backend/.env"
echo "   ✓ Code backed up: $CODE_BACKUP_DIR"
echo ""

# 3. Save backup metadata
echo "$TIMESTAMP" > "$BACKUP_DIR/latest_backup.txt"
cd /var/www/hotel-neelkanth/backend 2>/dev/null && git rev-parse HEAD > "$CODE_BACKUP_DIR/git_commit.txt" 2>/dev/null || echo "No git info" > "$CODE_BACKUP_DIR/git_commit.txt"
echo "   ✓ Backup metadata saved"
echo ""

# 4. Clean old backups (keep last 30 days for database, last 10 deployments)
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR/database" -name "*.gz" -mtime +30 -delete
ls -t "$BACKUP_DIR/deployments" | tail -n +11 | xargs -I {} rm -rf "$BACKUP_DIR/deployments/{}"
echo "   ✓ Old backups cleaned"
echo ""

echo "=================================================="
echo "  ✅ Backup Complete!"
echo "=================================================="
echo ""
echo "Backup Location: $BACKUP_DIR"
echo "Database: ${DB_BACKUP_FILE}.gz"
echo "Code: $CODE_BACKUP_DIR"
echo ""
echo "To restore, run: ./restore-backup.sh $TIMESTAMP"
echo ""
