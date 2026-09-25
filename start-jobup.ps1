$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $root "frontend"
$backendDir = Join-Path $root "backend"
$nodeExe = "C:\Users\Arthur\AppData\Roaming\nvm\v22.9.0\node.exe"
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$pythonExe = if (Test-Path $venvPython) {
    $venvPython
} else {
    "C:\Users\Arthur\AppData\Local\Programs\Python\Python313\python.exe"
}

$frontendPort = 3000
$backendPort = 8000
$frontendAlreadyRunning = [bool](Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue)
$backendAlreadyRunning = [bool](Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue)

Write-Host "Starting JobUp developer stack in a single terminal window..."

$frontendProcess = $null
$backendProcess = $null

if ($frontendAlreadyRunning) {
    Write-Host "Frontend already running on http://127.0.0.1:$frontendPort; reusing it."
} else {
    $frontendProcess = Start-Process -FilePath $nodeExe -ArgumentList "./node_modules/next/dist/bin/next dev -H 127.0.0.1 -p $frontendPort" -WorkingDirectory $frontendDir -NoNewWindow -PassThru
}

if ($backendAlreadyRunning) {
    Write-Host "Backend already running on http://127.0.0.1:$backendPort; reusing it."
} else {
    $backendProcess = Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port $backendPort" -WorkingDirectory $backendDir -NoNewWindow -PassThru
}

Start-Sleep -Seconds 4

$chromeCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browserPath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browserPath) {
    Start-Process $browserPath "http://127.0.0.1:$frontendPort"
} else {
    Start-Process "http://127.0.0.1:$frontendPort"
}

Write-Host "Frontend: http://127.0.0.1:$frontendPort"
Write-Host "Backend: http://127.0.0.1:$backendPort/docs"
Write-Host "Health check: http://127.0.0.1:$backendPort/api/health"
Write-Host "Press Ctrl+C to stop both services."

$processIds = @($frontendProcess, $backendProcess) | Where-Object { $_ -and $_.Id } | Select-Object -ExpandProperty Id
if ($processIds) {
    Wait-Process -Id $processIds -ErrorAction SilentlyContinue
}
