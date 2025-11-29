#!/bin/bash

# Database Backup Script for Restaurant POS
# Usage: ./backup-db.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_URL="${DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DB_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/restaurant_pos_$DATE.dump"

echo -e "${YELLOW}Starting database backup...${NC}"
echo "Backup file: $BACKUP_FILE"

# Perform backup
if pg_dump "$DB_URL" -F c -f "$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    
    # Compress backup
    echo "Compressing backup..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup compressed: $BACKUP_SIZE${NC}"
    
    # Clean up old backups
    echo "Cleaning up backups older than $RETENTION_DAYS days..."
    DELETED=$(find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    if [ "$DELETED" -gt 0 ]; then
        echo -e "${YELLOW}Deleted $DELETED old backup(s)${NC}"
    else
        echo -e "${GREEN}No old backups to delete${NC}"
    fi
    
    # List remaining backups
    echo ""
    echo "Remaining backups:"
    ls -lth "$BACKUP_DIR"/*.dump.gz 2>/dev/null | head -10 || echo "No backups found"
    
    echo ""
    echo -e "${GREEN}Backup completed: $BACKUP_FILE${NC}"
    exit 0
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi



