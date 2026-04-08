$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$backendCandidates = @(
  "C:\Users\Acer\OneDrive\Desktop\hackathon",
  (Resolve-Path "$projectRoot\..").Path
)
$defaultBackendDir = ($backendCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1)
$backendDir = if ($env:BACKEND_DIR) { $env:BACKEND_DIR } else { $defaultBackendDir }
$backendRunner = Join-Path $projectRoot "scripts\backend_dev_runner.py"

if (-not (Test-Path $backendDir)) {
  Write-Host "Backend directory not found: $backendDir" -ForegroundColor Red
  Write-Host "Set BACKEND_DIR env var, then run npm run dev:all again." -ForegroundColor Yellow
  exit 1
}

$backendCommand = $env:BACKEND_DEV_CMD
if (-not $backendCommand) {
  if (Test-Path (Join-Path $backendDir "api.py")) {
    $backendCommand = "uvicorn api:app --reload --host 0.0.0.0 --port 5000"
  } elseif (Test-Path (Join-Path $backendDir "server.py")) {
    $backendCommand = "python server.py"
  } elseif (Test-Path (Join-Path $backendDir "app.py")) {
    $backendCommand = "python app.py"
    Write-Host "Warning: found app.py in $backendDir. This may not start a backend API server on port 5000." -ForegroundColor Yellow
  } else {
    $backendCommand = $null
  }
}

Write-Host "Starting backend in a new terminal..." -ForegroundColor Cyan
Write-Host "Backend dir: $backendDir" -ForegroundColor DarkCyan
Write-Host "Backend cmd: $backendCommand" -ForegroundColor DarkCyan

$backendLaunch = "Set-Location '$backendDir'; python `"$backendRunner`" --dir `"$backendDir`" --cmd `"$backendCommand`""
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendLaunch | Out-Null

Write-Host "Starting frontend with Vite HMR..." -ForegroundColor Green
Set-Location $projectRoot
npm run dev
