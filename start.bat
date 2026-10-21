@echo off
echo ========================================================
echo   Starting AM DEV Pro Workplace Platform
echo ========================================================

echo Starting Backend Server on http://localhost:3001...
start "AM DEV Backend" cmd /k "cd /d backend && node server.js"

timeout /t 2 /nobreak > nul

echo Starting Frontend Dev Server on http://localhost:5174...
start "AM DEV Frontend" cmd /k "cd /d frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo Opening browser to http://localhost:5174...
start http://localhost:5174

echo Platform running! Keep the terminal windows open.
pause
