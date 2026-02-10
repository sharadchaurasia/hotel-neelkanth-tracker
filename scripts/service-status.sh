#!/bin/bash

# Check Auto-Deploy Service Status

PROJECT_DIR="/Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker"

echo "=================================================="
echo "  Auto-Deploy Service Status"
echo "=================================================="
echo ""

# Check if service is running
if launchctl list | grep -q "neelkanth.autodeploy"; then
    echo "Status: ✅ RUNNING"
    echo ""
    launchctl list | grep neelkanth
    echo ""
    echo "Service is watching for file changes 24/7"
else
    echo "Status: ❌ STOPPED"
    echo ""
    echo "Start with: ./service-start.sh"
fi

echo ""
echo "=================================================="
echo "Logs:"
echo "  Live:   ./service-logs.sh"
echo "  File:   $PROJECT_DIR/logs/autodeploy.log"
echo ""
echo "Commands:"
echo "  Start:  ./service-start.sh"
echo "  Stop:   ./service-stop.sh"
echo "  Logs:   ./service-logs.sh"
echo "=================================================="
