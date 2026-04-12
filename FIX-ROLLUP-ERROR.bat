@echo off
setlocal enabledelayedexpansion
color 0B
title NagrikConnect AI - Fix Node ^& Rollup Error

echo.
echo ================================================================
echo   NAGRIKCONNECT AI - SYSTEM REPAIR
echo ================================================================
echo.

:: NODE VERSION CHECK
echo Checking Node.js version...
for /f "tokens=1,2,3 delims=v." %%a in ('node -v') do (
    set NODE_MAJOR=%%a
)

echo Current Node Version: v%NODE_MAJOR%

if %NODE_MAJOR% LSS 18 (
    color 0E
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo   WARNING: YOUR NODE.JS VERSION IS TOO OLD (v%NODE_MAJOR%)
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo.
    echo Vite 6 / React 19 / Tailwind 4 REQUIRE Node 18 or 20.
    echo You should really upgrade to Node v20 from nodejs.org.
    echo.
    echo [1] Try "Force Install" anyway (Might crash at runtime)
    echo [2] Exit and upgrade Node (Safe / Recommended)
    echo.
    set /p choice="Enter choice (1-2): "
    if "!choice!"=="2" exit
    set FORCE_FLAG=--ignore-engines
) else (
    echo [OK] Node version is compatible.
    set FORCE_FLAG=
)

echo.
echo STEP 1: Closing active Node processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo STEP 2: Deleting folders (this may take a minute)...
echo ----------------------------------------------------

:: Helper function to delete
set folders=client\node_modules admin\node_modules backend\node_modules client\package-lock.json admin\package-lock.json backend\package-lock.json

for %%f in (%folders%) do (
    if exist "%%f" (
        echo Deleting %%f...
        if "%%~xf"==".json" (
            del /f /q "%%f"
        ) else (
            rmdir /s /q "%%f"
        )
    )
)

echo.
echo STEP 3: Clearing npm cache...
echo ----------------------------------------------------
call npm cache clean --force

echo.
echo STEP 4: Installing Client...
echo ----------------------------------------------------
cd /d "%~dp0client"
call npm install %FORCE_FLAG% --legacy-peer-deps

echo.
echo STEP 5: Installing Admin...
echo ----------------------------------------------------
cd /d "%~dp0admin"
call npm install %FORCE_FLAG% --legacy-peer-deps

echo.
echo STEP 6: Installing Backend...
echo ----------------------------------------------------
cd /d "%~dp0backend"
call npm install %FORCE_FLAG% --legacy-peer-deps

echo.
echo ================================================================
echo   REPAIR COMPLETE!
echo ================================================================
echo.
echo Now try running START-ALL.bat
echo.
pause
exit
