# AM DEV Pro Workplace — PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching AM DEV Pro Workplace Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; node server.js"
Write-Host "✅ Backend API starting on http://localhost:3001" -ForegroundColor Green

Start-Sleep -Seconds 2

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
Write-Host "✅ Frontend Portal starting on http://localhost:5174" -ForegroundColor Green

Start-Sleep -Seconds 3

# Launch Browser
Start-Process "http://localhost:5174"
Write-Host "🚀 Browser opened to http://localhost:5174" -ForegroundColor Cyan
