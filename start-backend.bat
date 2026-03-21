@echo off
title KrishiSaathi Backend
color 0A

echo.
echo ========================================
echo    KrishiSaathi — Starting Backend
echo ========================================
echo.

echo [1/4] Killing existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
echo Done.
echo.

timeout /t 1 /nobreak >nul

echo [2/4] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% == 0 (
  echo MongoDB is running.
) else (
  echo Starting MongoDB...
  net start MongoDB >nul 2>&1
)
echo.

echo [3/4] Starting all servers...
echo.

start "KrishiSaathi MAIN:3000" /min cmd /c "node src/backend/server.js & pause"
timeout /t 1 /nobreak >nul

start "KrishiSaathi ORDERS:5001" /min cmd /c "node src/backend/ordersServer.js & pause"
timeout /t 1 /nobreak >nul

start "KrishiSaathi USERS:5002" /min cmd /c "node src/backend/userserver.js & pause"
timeout /t 1 /nobreak >nul

start "KrishiSaathi PAYMENT:5000" /min cmd /c "node src/backend/payment.js & pause"
timeout /t 1 /nobreak >nul

echo [4/4] Starting Vite frontend...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo  All servers started!
echo  Main:    http://localhost:3000
echo  Orders:  http://localhost:5001
echo  Users:   http://localhost:5002
echo  Payment: http://localhost:5000
echo  Vite:    http://localhost:5173
echo ========================================
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:5173
npm run dev
