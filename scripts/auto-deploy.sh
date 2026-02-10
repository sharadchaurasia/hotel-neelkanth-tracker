#!/bin/bash

# Hotel Neelkanth - Auto Save, Push & Deploy System
# Watches for file changes and automatically commits, pushes, and deploys

set -e

PROJECT_DIR="/Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker"
WATCH_DIRS=("frontend/src" "backend/src")

echo "=================================================="
echo "  Hotel Neelkanth - Auto Deploy Mode"
echo "=================================================="
echo ""
echo "👀 Watching for changes in:"
echo "   - frontend/src/"
echo "   - backend/src/"
echo ""
echo "When you save a file:"
echo "   ✅ Auto commit"
echo "   ✅ Auto push to GitHub"
echo "   ⚠️  Will ask before deploying"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "=================================================="
echo ""

# Function to commit and push changes
commit_and_push() {
    cd "$PROJECT_DIR"

    # Check if there are changes
    if [[ -z $(git status -s) ]]; then
        return
    fi

    # Get the list of changed files
    CHANGED_FILES=$(git status -s | awk '{print $2}' | tr '\n' ', ' | sed 's/,$//')

    echo ""
    echo "📝 Changes detected: $CHANGED_FILES"
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
    echo ""

    # Ask for deployment
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 Ready to deploy to production?"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "Deploy now? (yes/no/skip): " deploy_choice

    if [ "$deploy_choice" = "yes" ]; then
        echo ""
        echo "🚀 Deploying with backup..."
        cd scripts
        ./deploy-with-backup.sh
        echo ""
        echo "✅ Deployment complete!"
    elif [ "$deploy_choice" = "skip" ]; then
        echo "⏭️  Deployment skipped"
    else
        echo "❌ Deployment cancelled"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "👀 Watching for more changes..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Watch for changes using fswatch (macOS) or inotifywait (Linux)
if command -v fswatch &> /dev/null; then
    # macOS
    fswatch -o "${WATCH_DIRS[@]/#/$PROJECT_DIR/}" | while read f; do
        sleep 2  # Wait 2 seconds to ensure file is fully saved
        commit_and_push
    done
else
    echo "❌ Error: fswatch not installed"
    echo ""
    echo "Install with: brew install fswatch"
    echo ""
    exit 1
fi
