# Backup Plan (Supabase + Local Daily Dump)

## 1) Recommended: Supabase native backup
Use Supabase managed backup/PITR as primary backup strategy.

- Open Supabase project dashboard.
- Go to Database settings and enable Point-in-Time Recovery (PITR) / managed backups (depending on plan).
- Set retention according to your compliance requirement.

## 2) Secondary: Daily local dump from this project
This repository already has a backup script:

- Script: scripts/backup-db.ps1
- NPM command: npm run db:backup

Output location:
- backups/*.dump

Retention:
- Default keep 14 days (configurable in script parameter KeepDays)

## 3) Setup daily schedule on Windows (Task Scheduler)
Create a task:

1. Trigger: Daily (e.g., 01:00 AM)
2. Action Program: powershell.exe
3. Arguments:
   -ExecutionPolicy Bypass -Command "cd C:\laragon\www\dubusApp; npm run db:backup"
4. Run whether user is logged in or not
5. Enable retry on failure (recommended: 3 retries)

## 4) Restore command example
Restore to PostgreSQL with pg_restore:

pg_restore --dbname="<TARGET_DATABASE_URL>" --clean --if-exists --no-owner --no-privileges "backups/<file>.dump"

## 5) Operational checklist
- Test restore at least once per month.
- Store one copy off-machine (cloud drive/S3/private bucket).
- Rotate DB credentials if they were ever exposed in logs or commits.
