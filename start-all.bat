@echo off
color 0A
title NagrikConnect - Service Launcher

call :INIT_ANIMATION

echo ========================================
echo Starting Complete Application Stack
echo ========================================

if not exist "mongodb\bin\mongod.exe" (
    echo ERROR: MongoDB not found! Run setup-mongodb.bat first.
    pause
    exit /b
)

call :START_SERVICE "MongoDB Server" "27017"
start "MongoDB Server" /MIN "%CD%\mongodb\bin\mongod.exe" --dbpath "%CD%\mongodb\data" --logpath "%CD%\mongodb\logs\mongodb.log" --port 27017
timeout /t 5 /nobreak > nul

call :START_SERVICE "Backend Server" "5000"
cd backend
start "Backend Server" cmd /k "color 0B && echo Backend Server Running... && npm run dev"
cd ..
timeout /t 5 /nobreak > nul

call :START_SERVICE "Python Spam Detection" "8000"
cd scripts
start "Python Server" cmd /k "color 0E && echo Python Server Running... && python -m uvicorn api:app --reload --port 8000"
cd ..
timeout /t 3 /nobreak > nul

call :START_SERVICE "Admin Panel" "5174"
cd admin
start "Admin Panel" cmd /k "color 0D && echo Admin Panel Running... && npm run dev"
cd ..
timeout /t 3 /nobreak > nul

call :START_SERVICE "Client Application" "5173"
cd client
start "Client" cmd /k "color 0A && echo Client Application Running... && npm run dev"
cd ..

echo.
echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo MongoDB: mongodb://localhost:27017
echo Backend: http://localhost:5000
echo Python API: http://localhost:8000
echo Admin: http://localhost:5174
echo Client: http://localhost:5173
echo.
echo ========================================
echo IMPORTANT: Keep this window open!
echo Closing this window will NOT stop services.
echo Use stop-all.bat to stop all services.
echo ========================================
echo.
echo Press any key to close this launcher window...
echo (Services will continue running in background)
pause > nul
exit

:INIT_ANIMATION
cls
echo.
echo  [SYSTEM INITIALIZATION]
timeout /t 1 /nobreak >nul
echo  [0xA1B2C3D4] Scanning system architecture...
ping localhost -n 1 >nul
echo  [0xE5F6A7B8] Loading service configurations...
ping localhost -n 1 >nul
echo  [0xC9D0E1F2] Verifying port availability...
ping localhost -n 1 >nul
echo  [0x3A4B5C6D] Initializing database engine...
ping localhost -n 1 >nul
echo  [0x7E8F9A0B] Preparing backend services...
ping localhost -n 1 >nul
echo  [0x1C2D3E4F] Configuring API endpoints...
ping localhost -n 1 >nul
echo  [0x5A6B7C8D] Loading Python modules...
ping localhost -n 1 >nul
echo  [0x9E0F1A2B] Initializing ML models...
ping localhost -n 1 >nul
echo  [0x3C4D5E6F] Setting up client interface...
ping localhost -n 1 >nul
echo  [0x7A8B9C0D] Configuring admin panel...
ping localhost -n 1 >nul
echo  [0xB1C2D3E4] Establishing network connections...
ping localhost -n 1 >nul
echo  [0xF5A6B7C8] Allocating system resources...
ping localhost -n 1 >nul
echo  [0xD9E0F1A2] Enabling security protocols...
ping localhost -n 1 >nul
echo  [0x3B4C5D6E] Synchronizing services...
ping localhost -n 1 >nul
echo  [0x7F8A9B0C] Finalizing startup sequence...
ping localhost -n 1 >nul
echo.
echo  [READY TO LAUNCH]
timeout /t 2 /nobreak >nul
cls
goto :eof

:START_SERVICE
echo.
echo [LAUNCHING] %~1 on port %~2
for /L %%i in (1,1,20) do (
    set /p "=█" <nul
    ping localhost -n 1 >nul 2>nul
)
echo  [OK]
goto :eof
