# Second Bloom Admin Panel - Quick Setup Guide

This quick setup guide helps you get started with deploying the Second Bloom Admin Panel to production. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Prerequisites Checklist

- [ ] GitHub repository access
- [ ] Server with SSH access (Digital Ocean or any Linux server)
- [ ] Domain configured
- [ ] SSH keys generated
- [ ] Backend API running on port 3000
- [ ] Docker and Docker Compose installed on server

---

## Quick Start (5 Minutes)

### 1. Clone Repository on Server

```bash
ssh deploy@YOUR_SERVER_IP
git clone https://github.com/YOUR_USERNAME/second-bloom-admin-panel.git second-bloom-admin-panel
cd second-bloom-admin-panel
```

### 2. Create Environment File

```bash
# Copy and edit for production
cp .env.production.example .env.production
nano .env.production
```

Update these values:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_BASE_URL=https://api.yourdomain.com
PORT=3001
```

### 3. Deploy

```bash
# Build and start
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Verify health
curl http://localhost:3001/api/health
```

### 4. Configure Nginx (Recommended)

```bash
sudo nano /etc/nginx/sites-available/admin.yourdomain.com
```

Add:
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/health {
        proxy_pass http://localhost:3001/api/health;
        access_log off;
    }
}
```

Enable and setup SSL:
```bash
sudo ln -s /etc/nginx/sites-available/admin.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d admin.yourdomain.com
```

---

## GitHub Actions Setup (10 Minutes)

### 1. Generate SSH Key

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub deploy@YOUR_SERVER_IP

# Display private key (for GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

### 2. Add GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `PROD_HOST` | Server IP or domain | `123.45.67.89` or `admin.yourdomain.com` |
| `PROD_USER` | SSH username | `deploy` |
| `PROD_SSH_KEY` | SSH private key | Contents of `~/.ssh/github_actions_deploy` |
| `PROD_PORT` | SSH port (optional) | `22` |
| `PROD_API_URL` | Backend API URL | `https://api.yourdomain.com` |

### 3. Enable GitHub Container Registry

1. Go to **Settings → Actions → General**
2. Set "Workflow permissions" to **"Read and write permissions"**
3. Click **Save**

### 4. Deploy

```bash
# Push to main branch to trigger deployment
git add .
git commit -m "Setup deployment"
git push origin main
```

Monitor deployment at: **Repository → Actions**

---

## Deployment Scripts

All scripts are in the `scripts/` directory:

```bash
# Deploy application
./scripts/deploy.sh

# Check application health
./scripts/health-check.sh

# View logs (last 100 lines)
./scripts/logs.sh 100

# View logs (follow mode)
./scripts/logs.sh follow

# Rollback to previous version
./scripts/rollback.sh

# Create backup
./scripts/backup.sh
```

---

## Common Commands

### On Server

```bash
# Deploy manually
cd ~/second-bloom-admin-panel
./scripts/deploy.sh

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart
docker-compose restart

# Health check
curl http://localhost:3001/api/health

# Stop
docker-compose down
```

---

## Server Ports

- **Backend API**: Port 3000 (your existing backend)
- **Admin Panel**: Port 3001 (this application)
- **Nginx**: Port 80 (HTTP) and 443 (HTTPS)

Make sure port 3001 is available or change `PORT` in `.env.production`.

---

## Troubleshooting

### Application Won't Start
```bash
# Check logs
docker-compose logs

# Check if port is in use
sudo lsof -i :3001

# Rebuild from scratch
docker-compose down
docker-compose up -d --build --force-recreate
```

### Can't Connect to Backend
```bash
# Test backend
curl http://localhost:3000/health

# Check environment variables
docker-compose exec admin-panel printenv | grep API

# Update .env.production and restart
nano .env.production
docker-compose restart
```

### GitHub Actions Failing
1. Check Actions logs in GitHub
2. Verify all secrets are set correctly
3. Test SSH connection:
   ```bash
   ssh -i ~/.ssh/github_actions_deploy deploy@YOUR_SERVER_IP
   ```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -af

# Check Docker disk usage
docker system df
```

---

## Project Structure

```
second-bloom-admin-panel/
├── .github/workflows/
│   ├── deploy.yml              # Production CI/CD pipeline
│   └── pr-check.yml            # PR quality checks
├── scripts/
│   ├── deploy.sh               # Deployment script
│   ├── health-check.sh         # Health check
│   ├── rollback.sh             # Rollback script
│   ├── backup.sh               # Backup script
│   └── logs.sh                 # Log viewer
├── app/                        # Next.js application
├── components/                 # React components
├── lib/                        # Utilities
├── services/                   # API services
├── types/                      # TypeScript types
├── docker-compose.yml          # Production configuration
├── Dockerfile                  # Docker image definition
├── .env.production.example     # Environment template
├── DEPLOYMENT.md               # Full deployment guide
├── SETUP.md                    # This file
└── README.md                   # Project documentation
```

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] SSH keys only (no password authentication)
- [ ] Firewall configured (ports 22, 80, 443, 3001)
- [ ] SSL certificates installed
- [ ] Environment files secured (`chmod 600 .env.production`)
- [ ] Regular backups scheduled
- [ ] fail2ban installed (optional)
- [ ] Nginx security headers enabled
- [ ] Rate limiting configured (optional)

---

## Automated Backups

Schedule automated backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/deploy/qclay-admin-panel/scripts/backup.sh

# Save and exit
```

---

## Monitoring

### Check Application Health

```bash
# Health endpoint
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-11T...","uptime":123.45,"environment":"production"}
```

### Monitor Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Search for errors
docker-compose logs | grep -i error
```

### Check Resources

```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Docker disk usage
docker system df
```

---

## Next Steps

1. ✅ Complete quick setup above
2. ✅ Configure GitHub Actions
3. ✅ Test deployment
4. ✅ Setup Nginx and SSL
5. ✅ Configure automated backups
6. ✅ Setup monitoring alerts (optional)
7. ✅ Read full [DEPLOYMENT.md](./DEPLOYMENT.md) for advanced topics

---

## Getting Help

- **Full Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Project Documentation**: [README.md](./README.md)
- **GitHub Issues**: Report problems
- **Check Logs**: `docker-compose logs -f`
- **Health Check**: `curl http://localhost:3001/api/health`

---

## Quick Reference

### Important URLs
- **Production**: `https://admin.yourdomain.com`
- **Health Check**: `/api/health`
- **Backend API**: `https://api.yourdomain.com` (port 3000)

### Key Commands
```bash
# Deploy
./scripts/deploy.sh

# Logs
docker-compose logs -f

# Health
curl http://localhost:3001/api/health

# Restart
docker-compose restart

# Rollback
./scripts/rollback.sh

# Backup
./scripts/backup.sh
```

### Environment File
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_BASE_URL=https://api.yourdomain.com
PORT=3001
```

---

**Ready to deploy!** 🚀

For detailed instructions, advanced configuration, and troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md).
