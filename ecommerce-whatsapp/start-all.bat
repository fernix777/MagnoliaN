@echo off
set ROOT=%~dp0
echo Starting backend...
cd /d "%ROOT%server"
if not exist .env (
    echo Warning: .env not found. Backend may fail to start without credentials.
)
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
) else (
    echo Backend dependencies already installed. Skipping.
)
start "Backend" cmd /k "npm run dev > backend.log 2^>^&1"

cd /d "%ROOT%client"
echo Starting frontend...
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
) else (
    echo Frontend dependencies already installed. Skipping.
)
start "Frontend" cmd /k "npm run dev > frontend.log 2^>^&1"
echo Done. Logs: backend.log, frontend.log
