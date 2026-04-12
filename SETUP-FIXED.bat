@echo off
setlocal enabledelayedexpansion
color 0A
title NagrikConnect AI - Setup

:MENU
cls
echo.
echo ========================================
echo   NAGRIKCONNECT AI - SETUP
echo ========================================
echo.
echo [1] Install Dependencies (Safe Mode)
echo [2] Start All Services
echo [3] Stop All Services
echo [4] Exit
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto START
if "%choice%"=="3" goto STOP
if "%choice%"=="4" exit
goto MENU

:INSTALL
cls
echo.
echo ========================================
echo   INSTALLING DEPENDENCIES
echo ========================================
echo.

echo [1/3] Backend...
cd /d "%~dp0backend"
if exist "package.json" (
    call npm install --no-optional --legacy-peer-deps
    if errorlevel 1 (
        echo WARNING: Backend install had issues, continuing...
    ) else (
        echo SUCCESS: Backend installed
    )
) else (
    echo ERROR: backend/package.json not found
)

echo.
echo [2/3] Client...
cd /d "%~dp0client"
if exist "package.json" (
    call npm install --no-optional --legacy-peer-deps
    if errorlevel 1 (
        echo WARNING: Client install had issues, continuing...
    ) else (
        echo SUCCESS: Client installed
    )
) else (
    echo ERROR: client/package.json not found
)

echo.
echo [3/3] Admin...
cd /d "%~dp0admin"
if exist "package.json" (
    call npm install --no-optional --legacy-peer-deps
    if errorlevel 1 (
        echo WARNING: Admin install had issues, continuing...
    ) else (
        echo SUCCESS: Admin installed
    )
) else (
    echo ERROR: admin/package.json not found
)

cd /d "%~dp0"

echo.
echo ========================================
echo   INSTALLATION COMPLETE
echo ========================================
echo.
echo If you saw errors, try:
echo 1. Close VS Code
echo 2. Delete node_modules folders
echo 3. Run this script again
echo.
pause
goto MENU

:START
cls
echo.
echo ========================================
echo   STARTING SERVICES
echo ========================================
echo.

echo Starting MongoDB...
cd /d "%~dp0"
if exist "mongodb\bin\mongod.exe" (
    start "MongoDB" mongodb\bin\mongod.exe --dbpath mongodb\data --port 27017
    timeout /t 3 /nobreak >nul
    echo [OK] MongoDB started
) else (
    echo [!] MongoDB not found - Download from mongodb.com
)

echo.
echo Starting Backend...
cd /d "%~dp0backend"
if exist "server.js" (
    start "Backend" cmd /k "npm run dev"
    timeout /t 2 /nobreak >nul
    echo [OK] Backend started
) else (
    echo [!] Backend server.js not found
)

echo.
echo Starting Client...
cd /d "%~dp0client"
if exist "package.json" (
    start "Client" cmd /k "npm run dev"
    timeout /t 2 /nobreak >nul
    echo [OK] Client started
) else (
    echo [!] Client not found
)

echo.
echo Starting Admin...
cd /d "%~dp0admin"
if exist "package.json" (
    start "Admin" cmd /k "npm run dev"
    echo [OK] Admin started
) else (
    echo [!] Admin not found
)

cd /d "%~dp0"

echo.
echo ========================================
echo   ALL SERVICES STARTED
echo ========================================
echo.
echo MongoDB:  localhost:27017
echo Backend:  localhost:5000
echo Client:   localhost:5173
echo Admin:    localhost:5174
echo.
pause
goto MENU

:STOP
cls
echo.
echo ========================================
echo   STOPPING SERVICES
echo ========================================
echo.

taskkill /FI "WINDOWTITLE eq MongoDB*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Backend*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Client*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Admin*" /T /F 2>nul

echo.
echo All services stopped!
echo.
pause
goto MENU
