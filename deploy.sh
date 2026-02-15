#!/bin/bash

# Hotel Neelkanth Tracker - Deployment Script
# Run this script to deploy frontend changes to production

echo "🚀 Starting deployment..."

# Check if server is reachable
echo "📡 Checking server connection..."
if ! ssh -i ~/.ssh/hotel-neelkanth.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@65.1.252.58 "echo 'Server reachable'" 2>/dev/null; then
    echo "❌ Server is not reachable. Please check:"
    echo "   - AWS EC2 instance is running"
    echo "   - Security group allows SSH from your IP"
    echo "   - Network connection is stable"
    exit 1
fi

echo "✅ Server is reachable"

# Deploy frontend
echo "📦 Deploying frontend to production..."
rsync -avz --delete -e "ssh -i ~/.ssh/hotel-neelkanth.pem -o StrictHostKeyChecking=no" localhost/ ubuntu@65.1.252.58:/var/www/hotel-neelkanth/frontend

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Frontend deployed to: http://65.1.252.58"
else
    echo "❌ Deployment failed"
    exit 1
fi
