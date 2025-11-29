# Database Backup Strategy

## Overview

This document outlines the database backup strategy for the Restaurant POS system.

## Backup Methods

### 1. Automated Backups (Recommended)

#### Using PostgreSQL Native Tools

**pg_dump** - Full database backup:
```bash
pg_dump -h <host> -U <user> -d <database> -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

**pg_dumpall** - Backup all databases:
```bash
pg_dumpall -h <host> -U <user> -f backup_all_$(date +%Y%m%d_%H%M%S).sql
```

#### Automated Daily Backup Script

Create `scripts/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/restaurant_pos_$DATE.dump"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Using Cron (Linux/Mac)

Add to crontab (`crontab -e`):
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-db.sh
```

### 2. Cloud Provider Backups

#### Vercel Postgres
- Automatic daily backups included
- Access via Vercel dashboard
- Retention: 7 days (free), 30 days (paid)

#### Supabase
- Automatic daily backups
- Point-in-time recovery available
- Access via Supabase dashboard

#### AWS RDS / Google Cloud SQL
- Automated backups enabled by default
- Configurable retention period
- Point-in-time recovery available

### 3. Manual Backup

For immediate backup:
```bash
# Using psql
pg_dump -h localhost -U postgres restaurant_pos > backup_manual.sql

# Or using connection string
pg_dump $DATABASE_URL > backup_manual.sql
```

## Restore Procedures

### From pg_dump File

```bash
# Drop existing database (WARNING: This deletes all data)
dropdb -h <host> -U <user> <database>

# Create new database
createdb -h <host> -U <user> <database>

# Restore from backup
pg_restore -h <host> -U <user> -d <database> backup_file.dump
```

### From SQL File

```bash
psql -h <host> -U <user> -d <database> < backup_file.sql
```

### Using Prisma Migrate

After restoring database:
```bash
npx prisma migrate deploy
npx prisma generate
```

## Backup Verification

### Test Restore Procedure

1. Create test database
2. Restore backup to test database
3. Verify data integrity
4. Test application functionality

### Regular Verification Schedule

- **Weekly:** Verify backup file integrity
- **Monthly:** Test restore procedure
- **Quarterly:** Full disaster recovery drill

## Backup Storage

### Recommended Locations

1. **Local Storage** (Primary)
   - Fast access for quick restores
   - Keep last 7 days

2. **Cloud Storage** (Secondary)
   - AWS S3, Google Cloud Storage, or similar
   - Keep last 90 days
   - Enable versioning

3. **Offsite Backup** (Tertiary)
   - Different geographic region
   - Keep last 365 days
   - For disaster recovery

### Storage Requirements

- **Daily backups:** ~50-200 MB per backup (depends on data size)
- **Monthly retention:** ~1.5-6 GB
- **Yearly retention:** ~18-72 GB

## Backup Schedule Recommendations

### Production Environment

- **Full Backup:** Daily at 2 AM (off-peak hours)
- **Incremental Backup:** Every 6 hours (if supported)
- **Retention:**
  - Daily: 30 days
  - Weekly: 12 weeks
  - Monthly: 12 months

### Development/Staging

- **Full Backup:** Weekly
- **Retention:** 4 weeks

## Monitoring & Alerts

### Backup Monitoring

Set up alerts for:
- Backup failures
- Backup size anomalies
- Backup age (if backup is too old)

### Example Monitoring Script

```bash
#!/bin/bash
# Check if backup exists and is recent
BACKUP_FILE="/path/to/latest/backup.dump"
MAX_AGE_HOURS=25

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ALERT: Backup file not found!"
  exit 1
fi

FILE_AGE=$(($(date +%s) - $(stat -c %Y "$BACKUP_FILE")))
MAX_AGE_SECONDS=$((MAX_AGE_HOURS * 3600))

if [ $FILE_AGE -gt $MAX_AGE_SECONDS ]; then
  echo "ALERT: Backup is older than $MAX_AGE_HOURS hours!"
  exit 1
fi

echo "Backup is recent and valid"
```

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

- **Critical Data Loss:** Restore within 1 hour
- **Full System Failure:** Restore within 4 hours

### Recovery Point Objectives (RPO)

- **Maximum Data Loss:** 24 hours (daily backups)
- **Ideal:** 6 hours (if incremental backups enabled)

### Recovery Steps

1. **Assess Damage**
   - Identify data loss scope
   - Determine backup to restore

2. **Prepare Environment**
   - Set up new database if needed
   - Verify backup file integrity

3. **Restore Database**
   - Restore from backup
   - Run migrations if needed
   - Verify data integrity

4. **Test Application**
   - Verify application functionality
   - Test critical workflows
   - Monitor for errors

5. **Communicate**
   - Notify stakeholders
   - Document recovery process
   - Update backup procedures if needed

## Best Practices

1. **Automate Everything**
   - Use cron jobs or scheduled tasks
   - Don't rely on manual backups

2. **Test Regularly**
   - Test restore procedures monthly
   - Verify backup integrity

3. **Monitor Backups**
   - Set up alerts for failures
   - Check backup logs regularly

4. **Store Offsite**
   - Keep backups in multiple locations
   - Use cloud storage for redundancy

5. **Document Everything**
   - Document backup procedures
   - Keep restore procedures updated
   - Document recovery contacts

6. **Encrypt Backups**
   - Encrypt sensitive data
   - Secure backup storage

## Quick Reference

### Backup Command
```bash
pg_dump $DATABASE_URL -F c -f backup_$(date +%Y%m%d).dump
```

### Restore Command
```bash
pg_restore -d $DATABASE_URL backup_file.dump
```

### Check Backup Size
```bash
ls -lh backup_*.dump
```

### List Backups
```bash
ls -lth /path/to/backups/
```

---

**Important:** Always test your backup and restore procedures before you need them!



