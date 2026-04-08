$targetScript = if (Test-Path "$PSScriptRoot\start-stack-v3.ps1") {
  "$PSScriptRoot\start-stack-v3.ps1"
} elseif (Test-Path "$PSScriptRoot\start-stack-v2.ps1") {
  "$PSScriptRoot\start-stack-v2.ps1"
} else {
  "$PSScriptRoot\start-stack.ps1"
}
$scriptPath = (Resolve-Path $targetScript).Path
$startupFolder = [Environment]::GetFolderPath("Startup")
$launcherPath = Join-Path $startupFolder "YouOkayAutoStart.cmd"
$ErrorActionPreference = "Stop"

$psCommand = "& '$scriptPath'"
$encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($psCommand))
$launcherContent = "@echo off`r`n" +
  "powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand $encodedCommand`r`n"

Set-Content -Path $launcherPath -Value $launcherContent -Encoding Ascii

if (Test-Path $launcherPath) {
  Write-Host "Autostart installed via Startup folder." -ForegroundColor Green
  Write-Host "Launcher: $launcherPath" -ForegroundColor Green
} else {
  Write-Host "Failed to create Startup launcher." -ForegroundColor Red
  exit 1
}
