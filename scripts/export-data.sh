#!/bin/bash
# ============================================================
# Hotel Neelkanth — Data Export Script
# Usage: ./export-data.sh [table_name]
# Example: ./export-data.sh bookings
# ============================================================

set -euo pipefail

SSH_KEY="$HOME/.ssh/hotel-neelkanth.pem"
SSH_HOST="ubuntu@65.1.252.58"
DB_PASS="JBrr85MttexyXBg15tdDfQUz"
DB_USER="hotel_admin"
DB_NAME="hotel_neelkanth"
OUTPUT_DIR="$HOME/Downloads/hotel-neelkanth-exports"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Table to export (default: all)
TABLE="${1:-all}"

echo "🔄 Exporting data from Hotel Neelkanth database..."
echo "📁 Output directory: $OUTPUT_DIR"
echo ""

if [ "$TABLE" = "all" ]; then
    # Export all main tables
    TABLES=("bookings" "daybook_entries" "aks_office_payments" "agent_settlements" "staff" "users")

    for tbl in "${TABLES[@]}"; do
        FILENAME="${OUTPUT_DIR}/${tbl}_${TIMESTAMP}.csv"
        echo "📊 Exporting $tbl..."

        ssh -i "$SSH_KEY" "$SSH_HOST" "PGPASSWORD='$DB_PASS' psql -U $DB_USER -d $DB_NAME -h localhost -c \"COPY (SELECT * FROM $tbl) TO STDOUT WITH CSV HEADER;\"" > "$FILENAME"

        echo "   ✅ Saved: $FILENAME ($(du -h "$FILENAME" | cut -f1))"
    done
else
    # Export specific table
    FILENAME="${OUTPUT_DIR}/${TABLE}_${TIMESTAMP}.csv"
    echo "📊 Exporting $TABLE..."

    ssh -i "$SSH_KEY" "$SSH_HOST" "PGPASSWORD='$DB_PASS' psql -U $DB_USER -d $DB_NAME -h localhost -c \"COPY (SELECT * FROM $TABLE) TO STDOUT WITH CSV HEADER;\"" > "$FILENAME"

    echo "   ✅ Saved: $FILENAME ($(du -h "$FILENAME" | cut -f1))"
fi

echo ""
echo "✅ Export complete!"
echo "📂 Open folder: open $OUTPUT_DIR"
