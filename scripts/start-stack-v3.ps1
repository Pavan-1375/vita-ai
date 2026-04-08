$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$backendCandidates = @(
  "C:\Users\Acer\OneDrive\Desktop\hackathon",
  (Resolve-Path "$projectRoot\..").Path
)
$defaultBackendDir = ($backendCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1)
$backendDir = if ($env:BACKEND_DIR) { $env:BACKEND_DIR } else { $defaultBackendDir }
$frontendDir = $projectRoot

function Get-PortFromUrl {
  param([string]$Url)
  if (-not $Url) { return $null }
  if ($Url -notmatch '^[a-zA-Z]+://') {
    $Url = "http://$Url"
  }
  try {
    $uri = [uri]$Url
    return $uri.Port
  } catch {
    return $null
  }
}

$backendPort = if ($env:BACKEND_PORT) {
  [int]$env:BACKEND_PORT
} else {
  $proxyPort = Get-PortFromUrl $env:VITE_API_PROXY_TARGET
  $basePort = Get-PortFromUrl $env:VITE_API_BASE_URL
  if ($proxyPort) {
    $proxyPort
  } elseif ($basePort) {
    $basePort
  } else {
    5000
  }
}
$appUrl = "http://localhost:3000"

function Test-PortInUse {
  param([int]$Port)
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(700)
    if (-not $connected) { return $false }
    $client.EndConnect($async) | Out-Null
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
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
    $backendCommand = "& `"$backendPython`" -X utf8 -m uvicorn api:app --reload --host 127.0.0.1 --port $backendPort"
  } elseif (Test-Path (Join-Path $backendDir "server.py")) {
    $backendCommand = "& `"$backendPython`" server.py"
  } elseif (Test-Path (Join-Path $backendDir "app.py")) {
    $backendCommand = "& `"$backendPython`" app.py"
    Write-Host "Warning: found app.py in $backendDir. This may not start a backend API server on port $backendPort." -ForegroundColor Yellow
  } else {
    $backendCommand = $null
  }
}

if (-not $backendCommand) {
  Write-Host "No backend entrypoint found in $backendDir. Set BACKEND_DIR or BACKEND_DEV_CMD to the correct backend project." -ForegroundColor Red
} elseif (-not (Test-PortInUse -Port $backendPort)) {
  $backendLaunch = "Set-Location '$backendDir'; `$env:PYTHONIOENCODING='utf-8'; $backendCommand"
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", $backendLaunch | Out-Null

  if (Wait-PortOpen -Port $backendPort -TimeoutSeconds 35) {
    Write-Host "Backend started on port $backendPort." -ForegroundColor Green
  } else {
    Write-Host "Backend process launched but port $backendPort is still not reachable." -ForegroundColor Yellow
    Write-Host "Set BACKEND_DEV_CMD if needed, e.g. `".venv\Scripts\python.exe`" -X utf8 -m uvicorn api:app --host 127.0.0.1 --port $backendPort" -ForegroundColor Yellow
  }
} else {
  Write-Host "Backend already running on port $backendPort." -ForegroundColor Cyan
}

if (-not (Test-PortInUse -Port 3000)) {
  $frontendLaunch = "Set-Location '$frontendDir'; npm run dev"
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", $frontendLaunch | Out-Null
  if (Wait-PortOpen -Port 3000 -TimeoutSeconds 45) {
    Write-Host "Frontend started on port 3000." -ForegroundColor Green
  } else {
    Write-Host "Frontend did not become reachable on port 3000. Check frontend terminal for errors." -ForegroundColor Yellow
  }
} else {
  Write-Host "Frontend already running on port 3000." -ForegroundColor Cyan
}

Start-Process $appUrl
