$projectRoot = (Resolve-Path "$PSScriptRoot\\..").Path
$backendCandidates = @(
  "C:\Users\Acer\OneDrive\Desktop\hackathon",
  (Resolve-Path "$projectRoot\\..").Path
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
    if (-not $connected) {
      return $false
    }
    $client.EndConnect($async) | Out-Null
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Wait-UrlReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 45
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $iwrSupportsBasicParsing = (Get-Command Invoke-WebRequest).Parameters.ContainsKey('UseBasicParsing')
  while ((Get-Date) -lt $deadline) {
    try {
      if ($iwrSupportsBasicParsing) {
        $response = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
      } else {
        $response = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 3 -ErrorAction Stop
      }
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      # keep waiting until timeout
    }
    Start-Sleep -Milliseconds 800
  }
  return $false
}

function Wait-PortOpen {
  param(
    [int]$Port,
    [int]$TimeoutSeconds = 20
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortInUse -Port $Port) {
      return $true
    }
    Start-Sleep -Milliseconds 400
  }
  return $false
}

if (-not (Test-Path $backendDir)) {
  Write-Host "Backend directory not found: $backendDir" -ForegroundColor Red
  Write-Host "Set BACKEND_DIR env var first." -ForegroundColor Yellow
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

if (-not (Test-PortInUse -Port 5000)) {
  $backendLaunch = "Set-Location '$backendDir'; python `"$backendRunner`" --dir `"$backendDir`" --cmd `"$backendCommand`""
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", $backendLaunch | Out-Null
  Write-Host "Backend started." -ForegroundColor Green
} else {
  Write-Host "Backend already running on port 5000." -ForegroundColor Cyan
}

if (-not (Test-PortInUse -Port 3000)) {
  $frontendLaunch = "Set-Location '$frontendDir'; npm run dev"
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", $frontendLaunch | Out-Null
  if (Wait-PortOpen -Port 3000 -TimeoutSeconds 45) {
    Write-Host "Frontend started." -ForegroundColor Green
  } else {
    Write-Host "Frontend did not become reachable on port 3000. Check the frontend terminal for errors." -ForegroundColor Yellow
  }
} else {
  Write-Host "Frontend already running on port 3000." -ForegroundColor Cyan
}

function Start-AppWindow {
  param([string]$Url)

  $edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
  $chromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"

  if (Test-Path $edgePath) {
    # Launch as app window (no standard browser tabs/address bar).
    Start-Process -FilePath $edgePath -ArgumentList "--app=$Url"
    return
  }

  if (Test-Path $chromePath) {
    Start-Process -FilePath $chromePath -ArgumentList "--app=$Url"
    return
  }

  try {
    Start-Process -FilePath $Url -ErrorAction Stop
    return
  } catch {}

  try {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "start", "", $Url -ErrorAction Stop | Out-Null
    return
  } catch {}

  try {
    Start-Process -FilePath "explorer.exe" -ArgumentList $Url -ErrorAction Stop | Out-Null
    return
  } catch {}

  Write-Host "Could not auto-open browser. Open this URL manually: $Url" -ForegroundColor Yellow
}

if (-not (Wait-UrlReady -Url $appUrl -TimeoutSeconds 45)) {
  Write-Host "Frontend not reachable yet at $appUrl. Trying to open anyway..." -ForegroundColor Yellow
}
Start-AppWindow -Url $appUrl



