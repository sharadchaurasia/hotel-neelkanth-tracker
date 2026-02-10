#!/bin/bash

# Start Auto-Deploy Service

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "🚀 Starting Auto-Deploy Service..."
echo ""

launchctl load "$LAUNCH_AGENTS_DIR/com.neelkanth.autodeploy.plist" 2>/dev/null || echo "Service already running"

sleep 2

./service-status.sh
