#!/bin/bash

# Install Auto-Deploy as Permanent Background Service

set -e

PROJECT_DIR="/Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker"
PLIST_FILE="$PROJECT_DIR/scripts/com.neelkanth.autodeploy.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
LOGS_DIR="$PROJECT_DIR/logs"

echo "=================================================="
echo "  Installing Auto-Deploy Background Service"
echo "=================================================="
echo ""

# Create logs directory
mkdir -p "$LOGS_DIR"
echo "✅ Logs directory created: $LOGS_DIR"
echo ""

# Copy plist to LaunchAgents
cp "$PLIST_FILE" "$LAUNCH_AGENTS_DIR/"
echo "✅ Service file copied to LaunchAgents"
echo ""

# Load the service
launchctl load "$LAUNCH_AGENTS_DIR/com.neelkanth.autodeploy.plist"
echo "✅ Service loaded and started"
echo ""

echo "=================================================="
echo "  ✅ Installation Complete!"
echo "=================================================="
echo ""
echo "Service Status:"
launchctl list | grep neelkanth || echo "Service starting..."
echo ""
echo "Features:"
echo "  ✅ Auto-starts on login"
echo "  ✅ Runs in background always"
echo "  ✅ Auto-restarts if crashed"
echo "  ✅ Watches for file changes 24/7"
echo ""
echo "Logs Location:"
echo "  Output: $LOGS_DIR/autodeploy.log"
echo "  Errors: $LOGS_DIR/autodeploy-error.log"
echo ""
echo "Management Commands:"
echo "  Start:   ./service-start.sh"
echo "  Stop:    ./service-stop.sh"
echo "  Status:  ./service-status.sh"
echo "  Logs:    ./service-logs.sh"
echo ""
