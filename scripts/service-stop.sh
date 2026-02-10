#!/bin/bash

# Stop Auto-Deploy Service

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "🛑 Stopping Auto-Deploy Service..."
echo ""

launchctl unload "$LAUNCH_AGENTS_DIR/com.neelkanth.autodeploy.plist" 2>/dev/null || echo "Service already stopped"

sleep 1

echo "✅ Service stopped"
echo ""
echo "To start again: ./service-start.sh"
