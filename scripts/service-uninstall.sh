#!/bin/bash

# Uninstall Auto-Deploy Service

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$LAUNCH_AGENTS_DIR/com.neelkanth.autodeploy.plist"

echo "=================================================="
echo "  Uninstalling Auto-Deploy Service"
echo "=================================================="
echo ""

# Stop the service
./service-stop.sh

# Remove plist file
if [ -f "$PLIST_FILE" ]; then
    rm "$PLIST_FILE"
    echo "✅ Service file removed"
else
    echo "ℹ️  Service file not found"
fi

echo ""
echo "=================================================="
echo "  ✅ Uninstall Complete!"
echo "=================================================="
echo ""
echo "Service has been removed."
echo "To reinstall: ./service-install.sh"
echo ""
