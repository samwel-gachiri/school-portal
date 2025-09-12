#!/bin/bash

# School Portal Deployment Script
# This script handles the deployment of the school portal application

set -e  # Exit on any error

# Configuration
APP_NAME="school-portal"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_FILE="/var/log/$APP_NAME-deploy.log"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env files exist
    if [[ ! -f "backend/.env" ]]; then
        error "Backend .env file not found. Please create backend/.env from backend/.env.example"
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p "$BACKUP_DIR"
    
    # Backup timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    # Create backup directory
    sudo mkdir -p "$BACKUP_PATH"
    
    # Backup database (if using local database)
    # Uncomment and modify if using local MySQL
    # docker exec school-portal-mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD school_portal > "$BACKUP_PATH/database.sql"
    
    # Backup uploaded files
    if [[ -d "backend/uploads" ]]; then
        sudo cp -r backend/uploads "$BACKUP_PATH/"
        log "Uploaded files backed up"
    fi
    
    # Backup logs
    if [[ -d "backend/logs" ]]; then
        sudo cp -r backend/logs "$BACKUP_PATH/"
        log "Logs backed up"
    fi
    
    success "Backup created at $BACKUP_PATH"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest changes (if using git)
    if [[ -d ".git" ]]; then
        log "Pulling latest changes from git..."
        git pull origin main || warning "Git pull failed or not in a git repository"
    fi
    
    # Build and start services
    log "Building and starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check if services are running
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        success "Services are running"
    else
        error "Some services failed to start"
    fi
    
    success "Deployment completed successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check backend health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
        success "Frontend is healthy"
    else
        error "Frontend health check failed"
    fi
    
    success "All health checks passed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."
    
    # Stop current services
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Find latest backup
    LATEST_BACKUP=$(sudo ls -t "$BACKUP_DIR" | head -n1)
    
    if [[ -z "$LATEST_BACKUP" ]]; then
        error "No backup found for rollback"
    fi
    
    log "Rolling back to backup: $LATEST_BACKUP"
    
    # Restore files (implement based on your backup strategy)
    # This is a placeholder - implement actual rollback logic
    warning "Rollback functionality needs to be implemented based on your specific requirements"
    
    success "Rollback completed"
}

# Main deployment function
main() {
    log "Starting School Portal deployment process..."
    
    check_root
    check_prerequisites
    
    case "${1:-deploy}" in
        "deploy")
            create_backup
            deploy
            health_check
            cleanup
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "backup")
            create_backup
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|health|backup|cleanup}"
            echo "  deploy  - Full deployment (default)"
            echo "  rollback - Rollback to previous version"
            echo "  health  - Health check only"
            echo "  backup  - Create backup only"
            echo "  cleanup - Cleanup old Docker resources"
            exit 1
            ;;
    esac
    
    success "Operation completed successfully!"
}

# Run main function with all arguments
main "$@"