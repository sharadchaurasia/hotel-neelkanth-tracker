#!/bin/bash

# Hotel Neelkanth - FULL Auto Deploy (No Confirmation)
# ⚠️ WARNING: Automatically deploys every change without asking!

set -e

PROJECT_DIR="/Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker"
WATCH_DIRS=("frontend/src" "backend/src")

echo "=================================================="
echo "  ⚠️  FULL AUTO-DEPLOY MODE (No Confirmation)"
echo "=================================================="
echo ""
echo "👀 Watching for changes in:"
echo "   - frontend/src/"
echo "   - backend/src/"
echo ""
echo "⚠️  WARNING: Every save will automatically:"
echo "   ✅ Commit"
echo "   ✅ Push to GitHub"
echo "   ✅ Deploy to production (with backup)"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "=================================================="
echo ""

# Function to commit, push and deploy
auto_deploy() {
    cd "$PROJECT_DIR"

    # Check if there are changes
    if [[ -z $(git status -s) ]]; then
        return
    fi

    # Get the list of changed files
    CHANGED_FILES=$(git status -s | awk '{print $2}' | tr '\n' ', ' | sed 's/,$//')

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Changes detected: $CHANGED_FILES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Auto commit
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    git add .
    git commit -m "auto: Update $CHANGED_FILES - $TIMESTAMP

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
    echo "✅ Committed"

    # Auto push
    git push
    echo "✅ Pushed to GitHub"

    # Auto deploy with backup
    echo ""
    echo "🚀 Auto-deploying to production..."
    cd scripts
    ./deploy-with-backup.sh
    echo ""
    echo "✅ Deployment complete!"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "👀 Watching for more changes..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Watch for changes
if command -v fswatch &> /dev/null; then
    # macOS
    fswatch -o "${WATCH_DIRS[@]/#/$PROJECT_DIR/}" | while read f; do
        sleep 2  # Wait 2 seconds to ensure file is fully saved
        auto_deploy
    done
else
    echo "❌ Error: fswatch not installed"
    echo ""
    echo "Install with: brew install fswatch"
    echo ""
    exit 1
fi
