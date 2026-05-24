param(
  [string]$DatabaseUrl = $env:DIRECT_URL,
  [string]$BackupDir = "backups",
  [int]$KeepDays = 14
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  Write-Error "DIRECT_URL is empty. Set DIRECT_URL in environment or pass -DatabaseUrl."
  exit 1
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  Write-Error "pg_dump not found. Install PostgreSQL client tools and ensure pg_dump is in PATH."
  exit 1
}

New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir ("dubusapp_" + $timestamp + ".dump")

Write-Host "Starting backup to $backupFile"
& pg_dump --dbname="$DatabaseUrl" --format=custom --no-owner --no-privileges --file="$backupFile"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Backup failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host "Backup completed: $backupFile"

# Cleanup old backups
$cutoff = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem -Path $BackupDir -Filter "*.dump" -File |
  Where-Object { $_.LastWriteTime -lt $cutoff } |
  Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup done. Kept backups newer than $KeepDays day(s)."
