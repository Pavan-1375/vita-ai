$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$backendCandidates = @(
  "C:\Users\Acer\OneDrive\Desktop\hackathon",
  (Resolve-Path "$projectRoot\..").Path
)
$defaultBackendDir = ($backendCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1)
$backendDir = if ($env:BACKEND_DIR) { $env:BACKEND_DIR } else { $defaultBackendDir }
$frontendDir = $projectRoot
$appUrl = "http://localhost:3000"
$backendRunner = Join-Path $projectRoot "scripts\backend_dev_runner.py"

function Test-PortInUse {
  param([int]$Port)
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(600)
    if (-not $connected) { return $false }
    $client.EndConnect($async) | Out-Null
    return $true
  } catch { return $false } finally { $client.Close() }
}

function Wait-PortOpen {
  param([int]$Port, [int]$TimeoutSeconds = 45)
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortInUse -Port $Port) { return $true }
    Start-Sleep -Milliseconds 400
  }
  return $false
}

if (-not (Test-Path $backendDir)) {
  Write-Host "Backend directory not found: $backendDir" -ForegroundColor Red
  Write-Host "Set BACKEND_DIR env var first." -ForegroundColor Yellow
  exit 1
}

$backendPython = if (Test-Path (Join-Path $backendDir ".venv\Scripts\python.exe")) {
  Join-Path $backendDir ".venv\Scripts\python.exe"
} else {
  "python"
}

$backendCommand = $env:BACKEND_DEV_CMD
if (-not $backendCommand) {
  if (Test-Path (Join-Path $backendDir "api.py")) {
    $backendCommand = "`"$backendPython`" -m uvicorn api:app --reload --host 0.0.0.0 --port 5000"
  } elseif (Test-Path (Join-Path $backendDir "server.py")) {
    $backendCommand = "`"$backendPython`" server.py"
  } elseif (Test-Path (Join-Path $backendDir "app.py")) {
    $backendCommand = "`"$backendPython`" app.py"
  } else {
    $backendCommand = "`"$backendPython`" app.py"
  }
}

if (-not (Test-PortInUse -Port 5000)) {
  $backendLaunch = "Set-Location '$backendDir'; python `"$backendRunner`" --dir `"$backendDir`" --cmd `"$backendCommand`""
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", $backendLaunch | Out-Null
  if (Wait-PortOpen -Port 5000 -TimeoutSeconds 25) {
    Write-Host "Backend started." -ForegroundColor Green
  } else {
    Write-Host "Backend process launched but port 5000 is still not reachable." -ForegroundColor Yellow
    Write-Host "Set BACKEND_DEV_CMD if needed, e.g. `".venv\\Scripts\\python.exe`" server.py" -ForegroundColor Yellow
  }
} else {
  Write-Host "Backend already running on port 5000." -ForegroundColor Cyan
}

if (-not (Test-PortInUse -Port 3000)) {
  $frontendLaunch = "Set-Location '$frontendDir'; npm run dev"
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", $frontendLaunch | Out-Null
  if (Wait-PortOpen -Port 3000 -TimeoutSeconds 45) {
    Write-Host "Frontend started." -ForegroundColor Green
  } else {
    Write-Host "Frontend did not become reachable on port 3000. Check frontend terminal for errors." -ForegroundColor Yellow
  }
} else {
  Write-Host "Frontend already running on port 3000." -ForegroundColor Cyan
}

Start-Process "http://localhost:3000"


