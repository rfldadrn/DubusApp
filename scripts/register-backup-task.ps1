[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$TaskName = "DubusApp-DB-Backup-GDrive",
  [string]$Time = "01:00",
  [string]$WorkingDirectory = "",
  [string]$LogFile = "logs/db-backup-gdrive.log"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($WorkingDirectory)) {
  $scriptRoot = Split-Path -Parent $PSCommandPath
  $WorkingDirectory = (Resolve-Path (Join-Path $scriptRoot "..")).Path
}

$npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue)
if (-not $npmCmd) {
  $npmCmd = (Get-Command npm -ErrorAction SilentlyContinue)
}
if (-not $npmCmd) {
  throw "npm command not found in PATH. Install Node.js and ensure npm is available."
}

if (-not (Test-Path $WorkingDirectory)) {
  throw "Working directory not found: $WorkingDirectory"
}

$fullLogPath = Join-Path $WorkingDirectory $LogFile
$logDir = Split-Path -Parent $fullLogPath
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$escapedWorkingDir = $WorkingDirectory.Replace('"', '""')
$escapedNpm = $npmCmd.Source.Replace('"', '""')
$escapedLog = $fullLogPath.Replace('"', '""')

$command = "cd /d `"$escapedWorkingDir`" && `"$escapedNpm`" run db:backup:gdrive >> `"$escapedLog`" 2>&1"
$taskRun = "cmd.exe /c $command"

if ($PSCmdlet.ShouldProcess($TaskName, "Create or update scheduled backup task")) {
  schtasks /Create /TN $TaskName /SC DAILY /ST $Time /TR $taskRun /F | Out-Null
  Write-Host "Scheduled task '$TaskName' created/updated at $Time"
  Write-Host "Task command: $taskRun"
  Write-Host "Log file: $fullLogPath"
}
