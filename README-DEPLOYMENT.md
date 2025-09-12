# School Portal Deployment Guide

This guide provides comprehensive instructions for deploying the School Fee Payment Portal in production.

## Prerequisites

### System Requirements

- **Server**: Ubuntu 20.04+ or CentOS 8+ (minimum 4GB RAM, 2 CPU cores)
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+ (for local development)
- **SSL Certificate**: For HTTPS (recommended: Let's Encrypt)

### Database Requirements

- **MySQL**: 8.0+ (Aiven hosted recommended)
- **SSL/TLS**: Enabled with certificate
- **Backup**: Automated backup strategy

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repository-url>
cd school-portal
```

### 2. Configure Environment

```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env with your production values

# Frontend configuration
cp frontend/.env.example frontend/.env.production
# Edit frontend/.env.production with your production values
```

### 3. SSL Certificate Setup

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy your SSL certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

### 4. Database Certificate

```bash
# Copy your Aiven CA certificate
cp ca.pem backend/.cert/ca.pem
```

### 5. Deploy

```bash
# Make deployment script executable (Linux/Mac)
chmod +x deploy.sh

# Run deployment
./deploy.sh deploy
```

## Manual Deployment

### Backend Deployment

1. **Install Dependencies**

```bash
cd backend
npm install
```

2. **Build Application**

```bash
npm run build
```

3. **Database Migration**

```bash
# Install Liquibase (if not already installed)
# Update database schema
npm run migrate
```

4. **Start with PM2**

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### Frontend Deployment

1. **Build Application**

```bash
cd frontend
npm install
npm run build
```

2. **Configure Nginx**

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/school-portal
sudo ln -s /etc/nginx/sites-available/school-portal /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and Start Services**

```bash
docker-compose up -d --build
```

2. **Check Service Status**

```bash
docker-compose ps
docker-compose logs -f
```

3. **Scale Backend (Optional)**

```bash
docker-compose up -d --scale backend=3
```

### Individual Container Deployment

1. **Build Images**

```bash
# Backend
docker build -t school-portal-backend ./backend

# Frontend
docker build -t school-portal-frontend ./frontend
```

2. **Run Containers**

```bash
# Backend
docker run -d \
  --name school-portal-backend \
  -p 3000:3000 \
  --env-file backend/.env \
  -v $(pwd)/backend/uploads:/app/uploads \
  -v $(pwd)/backend/.cert:/app/.cert:ro \
  school-portal-backend

# Frontend
docker run -d \
  --name school-portal-frontend \
  -p 80:80 \
  -p 443:443 \
  school-portal-frontend
```

## Configuration

### Environment Variables

#### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database (Aiven)
DB_HOST=your-aiven-host.aivencloud.com
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL_CA_PATH=./.cert/ca.pem

# Security
JWT_SECRET=your-super-secure-jwt-secret
OPENAI_API_KEY=your-openai-api-key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Frontend (.env.production)

```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_NAME=School Fee Payment Portal
VITE_ENVIRONMENT=production
```

### SSL/HTTPS Configuration

1. **Obtain SSL Certificate**

```bash
# Using Let's Encrypt (recommended)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

2. **Update Nginx Configuration**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # ... rest of configuration
}
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl -f http://localhost:3000/health
curl -f http://localhost:80/health

# Check with deployment script
./deploy.sh health
```

### Logging

```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# System logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backup Strategy

```bash
# Create backup
./deploy.sh backup

# Manual database backup (if using local MySQL)
mysqldump -u root -p school_portal > backup_$(date +%Y%m%d).sql

# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

### Updates and Rollback

```bash
# Deploy new version
git pull origin main
./deploy.sh deploy

# Rollback if needed
./deploy.sh rollback
```

## Security Considerations

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Database Security

- Use strong passwords
- Enable SSL/TLS connections
- Restrict database access to application servers only
- Regular security updates

### Application Security

- Keep dependencies updated
- Use HTTPS everywhere
- Implement proper CORS policies
- Regular security audits

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

```bash
# Check certificate path
ls -la backend/.cert/ca.pem

# Test database connection
mysql -h your-host -u your-user -p --ssl-ca=backend/.cert/ca.pem
```

2. **File Upload Issues**

```bash
# Check upload directory permissions
ls -la backend/uploads/
chmod 755 backend/uploads/
```

3. **Nginx 502 Bad Gateway**

```bash
# Check backend service
curl http://localhost:3000/health

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

4. **PM2 Process Issues**

```bash
# Restart processes
pm2 restart all

# Check process status
pm2 status
pm2 monit
```

### Performance Optimization

1. **Enable Gzip Compression** (already configured in nginx.conf)
2. **Use CDN** for static assets
3. **Database Optimization**
   - Add proper indexes
   - Regular maintenance
4. **Caching Strategy**
   - Redis for sessions
   - Browser caching for static assets

## Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Use load balancer
# Configure nginx upstream with multiple backend servers
```

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database configuration
- Use SSD storage for better I/O performance

## Support

For deployment issues:

1. Check logs first
2. Verify configuration
3. Test individual components
4. Contact system administrator

## Maintenance Schedule

- **Daily**: Check logs and system health
- **Weekly**: Review performance metrics
- **Monthly**: Security updates and patches
- **Quarterly**: Full system backup and disaster recovery test
