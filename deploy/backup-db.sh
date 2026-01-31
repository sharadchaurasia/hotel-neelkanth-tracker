#!/bin/bash
# ============================================================
# Hotel Neelkanth — Daily PostgreSQL Backup to S3
# Cron: 30 20 * * * /home/ubuntu/backup-db.sh
# (Runs daily at 2:00 AM IST = 20:30 UTC)
# ============================================================

set -euo pipefail

# ---- Configuration ----
DB_NAME="hotel_neelkanth"
DB_USER="hotel_admin"
BACKUP_DIR="/home/ubuntu/db-backups"
S3_BUCKET="s3://hotel-neelkanth-backups/db-backups"
KEEP_LOCAL_DAYS=7
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
FILENAME="${DB_NAME}_${TIMESTAMP}.sql.gz"

# ---- Ensure backup directory exists ----
mkdir -p "$BACKUP_DIR"

echo "$(date '+%Y-%m-%d %H:%M:%S') — Starting backup: $FILENAME"

# ---- Dump and compress ----
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

FILESIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "  Local backup created: $FILENAME ($FILESIZE)"

# ---- Upload to S3 ----
if command -v aws &> /dev/null; then
    aws s3 cp "$BACKUP_DIR/$FILENAME" "$S3_BUCKET/$FILENAME" --quiet
    echo "  Uploaded to S3: $S3_BUCKET/$FILENAME"
else
    echo "  WARNING: AWS CLI not found. Backup saved locally only."
fi

# ---- Clean old local backups ----
DELETED=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +${KEEP_LOCAL_DAYS} -delete -print | wc -l)
echo "  Cleaned $DELETED local backups older than ${KEEP_LOCAL_DAYS} days"

echo "$(date '+%Y-%m-%d %H:%M:%S') — Backup complete."
echo "---"
