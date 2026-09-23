@echo off
TITLE Guardian Aegis - Autonomous Multi-Agent Security Gateway (PS002)
COLOR 0B

echo =====================================================================
echo       GUARDIAN AEGIS - MULTI-AGENT INTEGRITY GATEWAY (PS002)
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Backend Dependencies...
cd backend
if not exist node_modules (
    echo Installing backend packages...
    call npm install
)

echo [2/3] Checking Frontend Dependencies...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend packages...
    call npm install
)

cd ..
echo [3/3] Starting Services...
echo.
echo Starting Backend Gateway on http://localhost:4000 (WebSocket: ws://localhost:4000)...
start "Guardian Backend" cmd /k "cd backend && npm start"

timeout /t 2 /nobreak >nul

echo Starting React SOC Dashboard on http://localhost:3000...
start "Guardian Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo   System running! Opening Dashboard at http://localhost:3000 ...
echo   (Optional: To start the Python ML Service, run 'python -m uvicorn app:app --port 8000' inside ml-service)
echo =====================================================================
timeout /t 3 /nobreak >nul
start http://localhost:3000
