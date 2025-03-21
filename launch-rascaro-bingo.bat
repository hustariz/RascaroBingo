@echo off
echo ===== RascaroBingo App Launcher =====
echo.
echo Killing processes on ports 8080, 8081 and 3004...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    echo Killing process with PID: %%a on port 8080
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8081" ^| find "LISTENING"') do (
    echo Killing process with PID: %%a on port 8081
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3004" ^| find "LISTENING"') do (
    echo Killing process with PID: %%a on port 3004
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Starting frontend server...
start "RascaroBingo Frontend" cmd /k "cd /d %~dp0 && npx vue-cli-service serve --skip-plugins eslint"

echo.
echo Starting backend server...
start "RascaroBingo Backend" cmd /k "cd /d %~dp0backend && npm start serv"

echo.
echo ===== RascaroBingo App Started! =====
echo Frontend: http://localhost:8081
echo Backend: http://localhost:3004
echo.
echo You can close this window now. The servers will continue running in their own windows.
echo.
