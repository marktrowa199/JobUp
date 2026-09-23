$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $root "frontend"
$backendDir = Join-Path $root "backend"
$nodeExe = "C:\Users\Arthur\AppData\Roaming\nvm\v22.9.0\node.exe"
$pythonExe = "C:\Users\Arthur\AppData\Local\Programs\Python\Python313\python.exe"

Write-Host "Starting JobUp developer stack in a single terminal window..."

$frontendProcess = Start-Process -FilePath $nodeExe -ArgumentList "./node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3000" -WorkingDirectory $frontendDir -NoNewWindow -PassThru
$backendProcess = Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $backendDir -NoNewWindow -PassThru

if ($env:PYTHONPATH) {
    $env:PYTHONPATH = "$backendDir;$env:PYTHONPATH"
} else {
    $env:PYTHONPATH = $backendDir
}

$backendProcess.StartInfo.Environment["PYTHONPATH"] = $backendDir

Start-Sleep -Seconds 4

$chromeCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browserPath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browserPath) {
    Start-Process $browserPath "http://127.0.0.1:3000"
} else {
    Start-Process "http://127.0.0.1:3000"
}

Write-Host "Frontend: http://127.0.0.1:3000"
Write-Host "Backend: http://127.0.0.1:8000/docs"
Write-Host "Health check: http://127.0.0.1:8000/api/health"
Write-Host "Press Ctrl+C to stop both services."

Wait-Process -Id $frontendProcess.Id, $backendProcess.Id
