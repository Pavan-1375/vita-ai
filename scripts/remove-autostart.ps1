$startupFolder = [Environment]::GetFolderPath("Startup")
$launcherPath = Join-Path $startupFolder "YouOkayAutoStart.cmd"

if (-not (Test-Path $launcherPath)) {
  Write-Host "Autostart launcher not found." -ForegroundColor Cyan
  exit 0
}

Remove-Item -LiteralPath $launcherPath -Force

if (-not (Test-Path $launcherPath)) {
  Write-Host "Autostart launcher removed." -ForegroundColor Yellow
} else {
  Write-Host "Failed to remove autostart launcher." -ForegroundColor Red
  exit 1
}
