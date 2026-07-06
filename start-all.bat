@echo off
echo ==============================================
echo      Starting Tranquility App Suite
echo ==============================================

echo Starting Backend Server...
start "Tranquility Backend" cmd /k "cd /d "%~dp0tranquility-backend" && pip install -r requirements.txt && python main.py"

echo Starting Frontend Server...
start "Tranquility Frontend" cmd /k "cd /d "%~dp0tranquility-app" && npm install && npm run dev"

echo Opening Dashboard (will redirect to login if needed)...
start "" "http://localhost:3000"

echo.
echo All services are spinning up! 
echo Keep the new command prompt windows open to keep the servers running.
echo.
pause
