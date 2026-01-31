#!/bin/bash
set -euo pipefail

# ============================================================
# Hotel Neelkanth CRM — Deploy to EC2
# Run from your local machine (project root):
#   bash deploy/deploy.sh
# ============================================================

# ---- Configuration ----
EC2_HOST="${EC2_HOST:-ubuntu@YOUR_ELASTIC_IP}"
KEY="${SSH_KEY:-~/.ssh/hotel-neelkanth.pem}"
REMOTE_DIR="/var/www/hotel-neelkanth"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ---- Validate configuration ----
if [[ "$EC2_HOST" == *"YOUR_ELASTIC_IP"* ]]; then
    echo "ERROR: Set your EC2 host first."
    echo "  export EC2_HOST=ubuntu@<your-elastic-ip>"
    echo "  OR edit this script and replace YOUR_ELASTIC_IP"
    exit 1
fi

if [ ! -f "${KEY/#\~/$HOME}" ]; then
    echo "ERROR: SSH key not found at ${KEY}"
    echo "  export SSH_KEY=~/.ssh/your-key.pem"
    exit 1
fi

SSH_CMD="ssh -i ${KEY} -o StrictHostKeyChecking=no"
RSYNC_SSH="ssh -i ${KEY} -o StrictHostKeyChecking=no"

echo "=== Deploying Hotel Neelkanth CRM ==="
echo "Target: ${EC2_HOST}"
echo "Project: ${PROJECT_ROOT}"
echo ""

# ---- 1. Sync backend ----
echo "[1/5] Syncing backend..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.env' \
    -e "${RSYNC_SSH}" \
    "${PROJECT_ROOT}/backend/" \
    "${EC2_HOST}:${REMOTE_DIR}/backend/"

# ---- 2. Sync frontend ----
echo "[2/5] Syncing frontend..."
rsync -avz \
    -e "${RSYNC_SSH}" \
    "${PROJECT_ROOT}/localhost/index.html" \
    "${PROJECT_ROOT}/localhost/book.html" \
    "${PROJECT_ROOT}/localhost/sw.js" \
    "${PROJECT_ROOT}/localhost/manifest.json" \
    "${PROJECT_ROOT}/localhost/icon-192.png" \
    "${PROJECT_ROOT}/localhost/icon-512.png" \
    "${EC2_HOST}:${REMOTE_DIR}/frontend/"

# ---- 3. Nginx config (skip by default — Certbot manages SSL on server) ----
if [[ "${SYNC_NGINX:-no}" == "yes" ]]; then
    echo "[3/5] Syncing nginx config..."
    rsync -avz \
        -e "${RSYNC_SSH}" \
        "${PROJECT_ROOT}/deploy/nginx.conf" \
        "${EC2_HOST}:~/nginx.conf"
else
    echo "[3/5] Skipping nginx config (Certbot-managed). Use SYNC_NGINX=yes to force."
fi

# ---- 3b. Sync backup script ----
if [ -f "${PROJECT_ROOT}/deploy/backup-db.sh" ]; then
    echo "[3b] Syncing backup script..."
    rsync -avz \
        -e "${RSYNC_SSH}" \
        "${PROJECT_ROOT}/deploy/backup-db.sh" \
        "${EC2_HOST}:/home/ubuntu/backup-db.sh"
    ${SSH_CMD} "${EC2_HOST}" 'chmod +x /home/ubuntu/backup-db.sh'
fi

# ---- 4. Sync .env.production → .env ----
echo "[4/5] Syncing environment file..."
if [ -f "${PROJECT_ROOT}/deploy/.env.production" ]; then
    rsync -avz \
        -e "${RSYNC_SSH}" \
        "${PROJECT_ROOT}/deploy/.env.production" \
        "${EC2_HOST}:${REMOTE_DIR}/backend/.env"
else
    echo "WARNING: deploy/.env.production not found. Skipping .env sync."
    echo "  Create it from deploy/.env.production template first."
fi

# ---- 5. Remote: install, build, restart ----
echo "[5/5] Building and restarting on server..."
${SSH_CMD} "${EC2_HOST}" << 'REMOTE'
set -euo pipefail

cd /var/www/hotel-neelkanth/backend

echo "  Installing dependencies (including dev for build)..."
npm ci 2>/dev/null || npm install

echo "  Building..."
npm run build

echo "  Pruning dev dependencies..."
npm prune --omit=dev

echo "  Restarting PM2 process..."
pm2 delete hotel-api 2>/dev/null || true
pm2 start ecosystem.config.js

pm2 save

# Update nginx config only if synced
if [ -f ~/nginx.conf ] && [ ~/nginx.conf -nt /etc/nginx/sites-available/hotel-neelkanth ]; then
    echo "  Updating Nginx config..."
    sudo cp ~/nginx.conf /etc/nginx/sites-available/hotel-neelkanth
    sudo ln -sf /etc/nginx/sites-available/hotel-neelkanth /etc/nginx/sites-enabled/hotel-neelkanth
    sudo nginx -t && sudo systemctl reload nginx
else
    echo "  Nginx config unchanged, skipping."
    sudo nginx -t && sudo systemctl reload nginx
fi

echo ""
echo "  Deploy complete!"
REMOTE

echo ""
echo "============================================"
echo "  Deployment successful!"
echo "  App: https://neelkanth.akshospitality.in"
echo "============================================"
