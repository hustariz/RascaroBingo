@echo off
echo Killing processes on ports 8080 and 3004...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3004" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Starting frontend...
start cmd /k "cd %~dp0 && npm run serve"

echo Starting backend...
start cmd /k "cd %~dp0backend && npm start serv"

echo Application started! Frontend: http://localhost:8080, Backend: http://localhost:3004
pause
