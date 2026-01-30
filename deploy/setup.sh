#!/bin/bash
set -euo pipefail

# ============================================================
# Hotel Neelkanth CRM — One-time EC2 Server Setup
# Run this script on the EC2 instance via SSH:
#   ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@<elastic-ip> 'bash -s' < deploy/setup.sh
# ============================================================

echo "=== Hotel Neelkanth CRM — Server Setup ==="

# ---- 1. System updates ----
echo "[1/9] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# ---- 2. Install Node.js 22 (NodeSource) ----
echo "[2/9] Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# ---- 3. Install PostgreSQL 16 ----
echo "[3/9] Installing PostgreSQL 16..."
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ---- 4. Create database and user ----
echo "[4/9] Creating database and user..."
# Generate a random password
DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hotel_admin') THEN
        CREATE ROLE hotel_admin WITH LOGIN PASSWORD '${DB_PASS}';
    ELSE
        ALTER ROLE hotel_admin WITH PASSWORD '${DB_PASS}';
    END IF;
END
\$\$;

SELECT 'CREATE DATABASE hotel_neelkanth OWNER hotel_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotel_neelkanth')\gexec

GRANT ALL PRIVILEGES ON DATABASE hotel_neelkanth TO hotel_admin;
SQL

echo "Database password: ${DB_PASS}"
echo ">>> SAVE THIS PASSWORD — you will need it for the .env file <<<"

# ---- 5. Install Nginx ----
echo "[5/9] Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx

# ---- 6. Install PM2 globally ----
echo "[6/9] Installing PM2..."
sudo npm install -g pm2

# ---- 7. Create application directories ----
echo "[7/9] Creating application directories..."
sudo mkdir -p /var/www/hotel-neelkanth/frontend
sudo mkdir -p /var/www/hotel-neelkanth/backend
sudo chown -R ubuntu:ubuntu /var/www/hotel-neelkanth

# ---- 8. Configure Nginx ----
echo "[8/9] Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default

# Copy nginx config (assumes deploy/nginx.conf was rsynced to home)
if [ -f ~/nginx.conf ]; then
    sudo cp ~/nginx.conf /etc/nginx/sites-available/hotel-neelkanth
elif [ -f /var/www/hotel-neelkanth/deploy/nginx.conf ]; then
    sudo cp /var/www/hotel-neelkanth/deploy/nginx.conf /etc/nginx/sites-available/hotel-neelkanth
else
    echo "WARNING: nginx.conf not found. You'll need to copy it manually."
fi

sudo ln -sf /etc/nginx/sites-available/hotel-neelkanth /etc/nginx/sites-enabled/hotel-neelkanth
sudo nginx -t && sudo systemctl restart nginx

# ---- 9. Configure PM2 startup ----
echo "[9/9] Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# ---- Install Certbot (for future SSL) ----
echo "Installing Certbot for future SSL setup..."
sudo apt-get install -y certbot python3-certbot-nginx

# ---- Write the DATABASE_URL to a reference file ----
cat > /home/ubuntu/db-credentials.txt <<CREDS
Database credentials (generated during setup):
  Host:     localhost
  Port:     5432
  Database: hotel_neelkanth
  User:     hotel_admin
  Password: ${DB_PASS}

DATABASE_URL=postgresql://hotel_admin:${DB_PASS}@localhost:5432/hotel_neelkanth
CREDS
chmod 600 /home/ubuntu/db-credentials.txt

echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "Database credentials saved to: /home/ubuntu/db-credentials.txt"
echo ""
echo "Next steps:"
echo "  1. Copy the DATABASE_URL from /home/ubuntu/db-credentials.txt"
echo "  2. Update deploy/.env.production with the DATABASE_URL"
echo "  3. Run deploy/deploy.sh from your local machine"
echo ""
echo "To set up SSL later:"
echo "  sudo certbot --nginx -d yourdomain.com"
echo ""
