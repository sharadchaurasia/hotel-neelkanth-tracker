#!/bin/bash

# View Auto-Deploy Service Logs (Live)

PROJECT_DIR="/Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker"
LOG_FILE="$PROJECT_DIR/logs/autodeploy.log"

echo "=================================================="
echo "  Auto-Deploy Live Logs"
echo "=================================================="
echo ""
echo "Watching: $LOG_FILE"
echo "Press Ctrl+C to stop"
echo ""
echo "=================================================="
echo ""

# Create log file if doesn't exist
touch "$LOG_FILE"

# Show live logs
tail -f "$LOG_FILE"
