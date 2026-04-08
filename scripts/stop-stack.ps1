function Stop-PortProcess {
  param([int]$Port)
  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
      try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "Stopped process $pid on port $Port" -ForegroundColor Yellow
      } catch {
        Write-Host "Could not stop process $pid on port $Port" -ForegroundColor Red
      }
    }
  } catch {
    Write-Host "No listener found on port $Port" -ForegroundColor Cyan
  }
}

Stop-PortProcess -Port 3000
Stop-PortProcess -Port 5000

