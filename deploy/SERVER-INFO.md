# Hotel Neelkanth CRM — Server Info

## Live URL
- http://65.1.252.58
- (Future) https://crm.akshospitality.in

## AWS Account
- Account Name: Aks Hospitality
- Account ID: 796869736432
- Region: ap-south-1 (Mumbai)

## EC2 Instance
- Instance ID: i-0e73c7424d7c386c3
- Type: t3.micro (Free Tier)
- OS: Ubuntu 24.04
- Elastic IP: 65.1.252.58

## SSH Access
- Key: ~/.ssh/hotel-neelkanth.pem
- Command: ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58

## Database
- Type: PostgreSQL 16
- Database: hotel_neelkanth
- User: hotel_admin
- Credentials file on server: /home/ubuntu/db-credentials.txt

## App Location on Server
- Frontend: /var/www/hotel-neelkanth/frontend/
- Backend: /var/www/hotel-neelkanth/backend/
- Nginx config: /etc/nginx/sites-available/hotel-neelkanth

## Process Manager
- PM2 process name: hotel-api
- Check status: ssh -i ~/.ssh/hotel-neelkanth.pem ubuntu@65.1.252.58 "pm2 status"

## Deploy (push code changes)
```bash
export EC2_HOST=ubuntu@65.1.252.58
export SSH_KEY=~/.ssh/hotel-neelkanth.pem
bash deploy/deploy.sh
```

## Security Group
- ID: sg-0c7ff571dfd9b9249
- Ports open: 22 (SSH), 80 (HTTP), 443 (HTTPS)
