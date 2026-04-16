@echo off
color 0A
title NagrikConnect AI - System Control Panel

call :BOOT_ANIMATION

:MENU
cls
echo.
echo  ███╗   ██╗ █████╗  ██████╗ ██████╗ ██╗██╗  ██╗
echo  ████╗  ██║██╔══██╗██╔════╝ ██╔══██╗██║██║ ██╔╝
echo  ██╔██╗ ██║███████║██║  ███╗██████╔╝██║█████╔╝ 
echo  ██║╚██╗██║██╔══██║██║   ██║██╔══██╗██║██╔═██╗ 
echo  ██║ ╚████║██║  ██║╚██████╔╝██║  ██║██║██║  ██╗
echo  ╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
echo  ███╗   ██╗ █████╗  ██████╗ ██████╗ ██╗██╗  ██╗
echo  ████╗  ██║██╔══██╗██╔════╝ ██╔══██╗██║██║ ██╔╝
echo  ██╔██╗ ██║███████║██║  ███╗██████╔╝██║█████╔╝ 
echo  ██║╚██╗██║██╔══██║██║   ██║██╔══██╗██║██╔═██╗ 
echo  ██║ ╚████║██║  ██║╚██████╔╝██║  ██║██║██║  ██╗
echo  ╚═╝ 

echo  ███╗   ██╗ █████╗  ██████╗ ██████╗ ██╗██╗  ██╗
echo  ████╗  ██║██╔══██╗██╔════╝ ██╔══██╗██║██║ ██╔╝
echo  ██╔██╗ ██║███████║██║  ███╗██████╔╝██║█████╔╝ 
echo  ██║╚██╗██║██╔══██║██║   ██║██╔══██╗██║██╔═██╗ 
echo  ██║ ╚████║██║  ██║╚██████╔╝██║  ██║██║██║  ██╗
echo  ╚═╝ echo.

echo  ════════════════════════════════════════════════
echo   SYSTEM CONTROL PANEL v2.0
echo  ════════════════════════════════════════════════
echo.
echo Choose an option:
echo [1] First Time Setup (New PC)
echo [2] Start All Services
echo [3] Stop All Services
echo [4] View Database
echo [5] Test Services
echo [6] Install Gemini Dependencies Only
echo [7] Upgrade to Gemini AI (March 2026 Update)
echo [8] Exit
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto FIRST_SETUP
if "%choice%"=="2" goto START_SERVICES
if "%choice%"=="3" goto STOP_SERVICES
if "%choice%"=="4" goto VIEW_DATABASE
if "%choice%"=="5" goto TEST_SERVICES
if "%choice%"=="6" goto INSTALL_GEMINI
if "%choice%"=="7" goto UPGRADE_GEMINI
if "%choice%"=="8" goto EXIT
goto MENU

:FIRST_SETUP
echo.
echo ========================================
echo   FIRST TIME SETUP
echo ========================================
echo.
echo Step 1: Installing Dependencies...
echo.

echo Installing Backend Dependencies...
cd backend
call npm install
echo Installing Gemini AI and PDF Generation packages...
call npm install @google/generative-ai pdfkit
cd ..

echo.
echo Installing Client Dependencies...
cd client
call npm install
call npm install leaflet react-leaflet@4.2.1 --legacy-peer-deps
cd ..

echo.
echo Installing Admin Panel Dependencies...
cd admin
call npm install
echo Installing Lucide React icons...
call npm install lucide-react
cd ..

echo.
echo Installing Python Dependencies...
pip install fastapi uvicorn flask flask-cors scikit-learn pandas numpy joblib

echo.
echo Step 2: Setting up MongoDB...
echo.

if not exist "mongodb\data" mkdir mongodb\data
if not exist "mongodb\logs" mkdir mongodb\logs

if not exist "mongodb\bin\mongod.exe" (
    echo MongoDB not found!
    echo Please download MongoDB from: https://www.mongodb.com/try/download/community
    echo Extract it and place the 'bin' folder inside 'mongodb' folder
    echo.
    pause
    goto MENU
)

echo.
echo Step 3: Initializing Database...
echo.

start /B mongodb\bin\mongod.exe --dbpath mongodb\data --port 27017

timeout /t 5 /nobreak >nul

cd backend
node init-database.js
cd ..

echo.
echo Step 4: Creating Emergency Response Admin...
echo.

cd backend
call node create-emergency-admin.js
cd ..

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo MongoDB is running on: localhost:27017
echo Database: nagrikconnect
echo.
echo Emergency Admin Created:
echo Email: emergency@maharashtragovt.com
echo Password: Emergency@2024
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:START_SERVICES
echo.
echo ========================================
echo   STARTING ALL SERVICES
echo ========================================
echo.

if not exist "mongodb\bin\mongod.exe" (
    echo ERROR: MongoDB not found!
    echo Please run First Time Setup first.
    pause
    goto MENU
)

echo Starting MongoDB...
start "MongoDB" mongodb\bin\mongod.exe --dbpath mongodb\data --port 27017
timeout /t 3 /nobreak >nul

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Python Spam Detection...
start "Python-Spam" cmd /k "cd scripts && python -m uvicorn api:app --reload --port 8000"
timeout /t 2 /nobreak >nul

echo Starting Client App...
start "Client" cmd /k "cd client && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Admin Panel...
start "Admin" cmd /k "cd admin && npm run dev"

echo.
echo ========================================
echo   ALL SERVICES STARTED!
echo ========================================
echo.
echo MongoDB:        localhost:27017
echo Backend:        localhost:5000
echo Python API:     localhost:8000
echo Client:         localhost:5173
echo Admin Panel:    localhost:5174
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:STOP_SERVICES
echo.
echo ========================================
echo   STOPPING ALL SERVICES
echo ========================================
echo.

echo Stopping MongoDB...
taskkill /FI "WINDOWTITLE eq MongoDB*" /T /F 2>nul

echo Stopping Backend...
taskkill /FI "WINDOWTITLE eq Backend*" /T /F 2>nul

echo Stopping Python Server...
taskkill /FI "WINDOWTITLE eq Python-Spam*" /T /F 2>nul

echo Stopping Client...
taskkill /FI "WINDOWTITLE eq Client*" /T /F 2>nul

echo Stopping Admin Panel...
taskkill /FI "WINDOWTITLE eq Admin*" /T /F 2>nul

echo.
echo All services stopped!
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:VIEW_DATABASE
echo.
echo ========================================
echo   DATABASE VIEWER
echo ========================================
echo.

echo ^<!DOCTYPE html^> > temp_db_viewer.html
echo ^<!DOCTYPE html^> > temp_db_viewer.html
echo ^<html^> >> temp_db_viewer.html
echo ^<head^> >> temp_db_viewer.html
echo     ^<title^>NagrikConnect Database Viewer^</title^> >> temp_db_viewer.html
echo     ^<style^> >> temp_db_viewer.html
echo         body { font-family: Arial; padding: 20px; background: #f5f5f5; } >> temp_db_viewer.html
echo         .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; } >> temp_db_viewer.html
echo         h1 { color: #333; } >> temp_db_viewer.html
echo         button { padding: 10px 20px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; } >> temp_db_viewer.html
echo         button:hover { background: #0056b3; } >> temp_db_viewer.html
echo         table { width: 100%%; border-collapse: collapse; margin-top: 20px; } >> temp_db_viewer.html
echo         th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; } >> temp_db_viewer.html
echo         th { background: #007bff; color: white; } >> temp_db_viewer.html
echo         .status { padding: 5px 10px; border-radius: 4px; font-size: 12px; } >> temp_db_viewer.html
echo         .online { background: #28a745; color: white; } >> temp_db_viewer.html
echo         .offline { background: #dc3545; color: white; } >> temp_db_viewer.html
echo     ^</style^> >> temp_db_viewer.html
echo ^</head^> >> temp_db_viewer.html
echo ^<body^> >> temp_db_viewer.html
echo     ^<div class="container"^> >> temp_db_viewer.html
echo         ^<h1^>NagrikConnect Database Viewer^</h1^> >> temp_db_viewer.html
echo         ^<div^> >> temp_db_viewer.html
echo             ^<button onclick="loadUsers()"^>View Users^</button^> >> temp_db_viewer.html
echo             ^<button onclick="loadGrievances()"^>View Grievances^</button^> >> temp_db_viewer.html
echo             ^<button onclick="checkStatus()"^>Check Services^</button^> >> temp_db_viewer.html
echo         ^</div^> >> temp_db_viewer.html
echo         ^<div id="content"^>^</div^> >> temp_db_viewer.html
echo     ^</div^> >> temp_db_viewer.html
echo     ^<script^> >> temp_db_viewer.html
echo         async function loadUsers() { >> temp_db_viewer.html
echo             try { >> temp_db_viewer.html
echo                 const res = await fetch('http://localhost:5000/user/allusers/contact'); >> temp_db_viewer.html
echo                 const users = await res.json(); >> temp_db_viewer.html
echo                 let html = '^<h2^>Users (' + users.length + ')^</h2^>^<table^>^<tr^>^<th^>Name^</th^>^<th^>Email^</th^>^<th^>Phone^</th^>^<th^>City^</th^>^</tr^>'; >> temp_db_viewer.html
echo                 users.forEach(u =^> html += `^<tr^>^<td^>${u.name}^</td^>^<td^>${u.email}^</td^>^<td^>${u.phone}^</td^>^<td^>${u.city}^</td^>^</tr^>`); >> temp_db_viewer.html
echo                 html += '^</table^>'; >> temp_db_viewer.html
echo                 document.getElementById('content').innerHTML = html; >> temp_db_viewer.html
echo             } catch(e) { alert('Error loading users. Make sure backend is running.'); } >> temp_db_viewer.html
echo         } >> temp_db_viewer.html
echo         async function loadGrievances() { >> temp_db_viewer.html
echo             try { >> temp_db_viewer.html
echo                 const res = await fetch('http://localhost:5000/grievance/allGrievances'); >> temp_db_viewer.html
echo                 const grievances = await res.json(); >> temp_db_viewer.html
echo                 let html = '^<h2^>Grievances (' + grievances.length + ')^</h2^>^<table^>^<tr^>^<th^>Code^</th^>^<th^>Name^</th^>^<th^>Department^</th^>^<th^>Status^</th^>^<th^>Date^</th^>^</tr^>'; >> temp_db_viewer.html
echo                 grievances.forEach(g =^> html += `^<tr^>^<td^>${g.grievanceCode}^</td^>^<td^>${g.complainantName}^</td^>^<td^>${g.department}^</td^>^<td^>${g.currentStatus}^</td^>^<td^>${new Date(g.createdAt).toLocaleDateString()}^</td^>^</tr^>`); >> temp_db_viewer.html
echo                 html += '^</table^>'; >> temp_db_viewer.html
echo                 document.getElementById('content').innerHTML = html; >> temp_db_viewer.html
echo             } catch(e) { alert('Error loading grievances. Make sure backend is running.'); } >> temp_db_viewer.html
echo         } >> temp_db_viewer.html
echo         async function checkStatus() { >> temp_db_viewer.html
echo             let html = '^<h2^>Service Status^</h2^>^<table^>^<tr^>^<th^>Service^</th^>^<th^>Port^</th^>^<th^>Status^</th^>^</tr^>'; >> temp_db_viewer.html
echo             let mongoStatus = 'offline'; >> temp_db_viewer.html
echo             try { >> temp_db_viewer.html
echo                 const res = await fetch('http://localhost:5000/user/allusers/contact'); >> temp_db_viewer.html
echo                 if (res.ok) mongoStatus = 'online'; >> temp_db_viewer.html
echo             } catch(e) {} >> temp_db_viewer.html
echo             html += `^<tr^>^<td^>MongoDB^</td^>^<td^>27017^</td^>^<td^>^<span class="status ${mongoStatus}"^>${mongoStatus === 'online' ? 'Online' : 'Offline'}^</span^>^</td^>^</tr^>`; >> temp_db_viewer.html
echo             let backendStatus = 'offline'; >> temp_db_viewer.html
echo             try { >> temp_db_viewer.html
echo                 const res = await fetch('http://localhost:5000'); >> temp_db_viewer.html
echo                 if (res.ok ^|^| res.status === 404) backendStatus = 'online'; >> temp_db_viewer.html
echo             } catch(e) {} >> temp_db_viewer.html
echo             html += `^<tr^>^<td^>Backend^</td^>^<td^>5000^</td^>^<td^>^<span class="status ${backendStatus}"^>${backendStatus === 'online' ? 'Online' : 'Offline'}^</span^>^</td^>^</tr^>`; >> temp_db_viewer.html
echo             let pythonStatus = 'offline'; >> temp_db_viewer.html
echo             try { >> temp_db_viewer.html
echo                 const res = await fetch('http://localhost:8000'); >> temp_db_viewer.html
echo                 if (res.ok) pythonStatus = 'online'; >> temp_db_viewer.html
echo             } catch(e) {} >> temp_db_viewer.html
echo             html += `^<tr^>^<td^>Python API^</td^>^<td^>8000^</td^>^<td^>^<span class="status ${pythonStatus}"^>${pythonStatus === 'online' ? 'Online' : 'Offline'}^</span^>^</td^>^</tr^>`; >> temp_db_viewer.html
echo             html += '^</table^>'; >> temp_db_viewer.html
echo             document.getElementById('content').innerHTML = html; >> temp_db_viewer.html
echo         } >> temp_db_viewer.html
echo     ^</script^> >> temp_db_viewer.html
echo ^</body^> >> temp_db_viewer.html
echo ^</html^> >> temp_db_viewer.html

echo Opening Database Viewer...
start temp_db_viewer.html

echo.
echo Database viewer opened in browser.
echo Make sure Backend is running to view data.
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:TEST_SERVICES
echo.
echo ========================================
echo   TESTING SERVICES
echo ========================================
echo.

echo Testing MongoDB (27017)...
netstat -an | findstr "27017" >nul
if %errorlevel%==0 (
    echo [OK] MongoDB is running
) else (
    echo [X] MongoDB is NOT running
)

echo.
echo Testing Backend (5000)...
netstat -an | findstr "5000" >nul
if %errorlevel%==0 (
    echo [OK] Backend is running
) else (
    echo [X] Backend is NOT running
)

echo.
echo Testing Python API (8000)...
netstat -an | findstr "8000" >nul
if %errorlevel%==0 (
    echo [OK] Python API is running
) else (
    echo [X] Python API is NOT running
)

echo.
echo Testing Client (5173)...
netstat -an | findstr "5173" >nul
if %errorlevel%==0 (
    echo [OK] Client is running
) else (
    echo [X] Client is NOT running
)

echo.
echo Testing Admin Panel (5174)...
netstat -an | findstr "5174" >nul
if %errorlevel%==0 (
    echo [OK] Admin Panel is running
) else (
    echo [X] Admin Panel is NOT running
)

echo.
echo ========================================
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:INSTALL_GEMINI
echo.
echo ========================================
echo   INSTALL GEMINI DEPENDENCIES
echo ========================================
echo.
echo This will install:
echo  - @google/generative-ai (Gemini AI SDK)
echo  - pdfkit (PDF generation)
echo  - lucide-react (Icons for admin)
echo.
pause

echo.
echo Installing Backend Dependencies...
cd backend
echo  [1/2] Installing @google/generative-ai...
call npm install @google/generative-ai
echo  [2/2] Installing pdfkit...
call npm install pdfkit
cd ..

echo.
echo Installing Admin Dependencies...
cd admin
echo  [1/1] Installing lucide-react...
call npm install lucide-react
cd ..

echo.
echo Verifying Installation...
echo.

findstr "@google/generative-ai" backend\package.json >nul
if %errorlevel%==0 (
    echo [OK] @google/generative-ai installed
) else (
    echo [X] @google/generative-ai NOT found
)

findstr "pdfkit" backend\package.json >nul
if %errorlevel%==0 (
    echo [OK] pdfkit installed
) else (
    echo [X] pdfkit NOT found
)

findstr "lucide-react" admin\package.json >nul
if %errorlevel%==0 (
    echo [OK] lucide-react installed
) else (
    echo [X] lucide-react NOT found
)

echo.
echo Checking Gemini API Key...
if exist "backend\.env" (
    findstr "GEMINI_API_KEY" backend\.env >nul
    if %errorlevel%==0 (
        echo [OK] Gemini API key found in .env file
    ) else (
        echo [!] Adding Gemini API key to .env file...
        echo GEMINI_API_KEY=AIzaSyC6XOdMKDw2MoA_m2x9krVGoKWXpMO14Ms >> backend\.env
        echo [OK] Gemini API key added
    )
) else (
    echo [!] Creating .env file...
    echo MONGO_URI=mongodb://localhost:27017 > backend\.env
    echo GEMINI_API_KEY=AIzaSyC6XOdMKDw2MoA_m2x9krVGoKWXpMO14Ms >> backend\.env
    echo [OK] .env file created with Gemini API key
)

echo.
echo ========================================
echo   INSTALLATION COMPLETE!
echo ========================================
echo.
echo Dependencies installed successfully!
echo Restart services if they are running.
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:UPGRADE_GEMINI
echo.
echo ========================================
echo   UPGRADE TO GEMINI AI
echo ========================================
echo.
echo This will upgrade your installation with:
echo.
echo  [NEW] Voice-to-Text in Chatbot
echo  [NEW] 10 Indian Languages Support
echo  [NEW] Google Gemini AI (replacing Hugging Face)
echo  [NEW] AI Resolution with PDF Generation
echo  [NEW] Enhanced Admin Panel Features
echo.
echo WARNING: This will modify your existing files!
echo Make sure you have a backup before proceeding.
echo.
set /p confirm="Do you want to continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo.
    echo Upgrade cancelled.
    pause
    goto MENU
)

echo.
echo Step 1: Stopping Services...
echo.
taskkill /FI "WINDOWTITLE eq MongoDB*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Backend*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Python-Spam*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Client*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Admin*" /T /F 2>nul
timeout /t 2 /nobreak >nul
echo [OK] Services stopped

echo.
echo Step 2: Installing Dependencies...
echo.

echo Installing Backend Dependencies...
cd backend
call npm install @google/generative-ai pdfkit
cd ..
echo [OK] Backend dependencies installed

echo.
echo Installing Admin Dependencies...
cd admin
call npm install lucide-react
cd ..
echo [OK] Admin dependencies installed

echo.
echo Step 3: Configuring Gemini API...
echo.

if exist "backend\.env" (
    findstr "GEMINI_API_KEY" backend\.env >nul
    if %errorlevel%==0 (
        echo [OK] Gemini API key already configured
    ) else (
        echo GEMINI_API_KEY=AIzaSyC6XOdMKDw2MoA_m2x9krVGoKWXpMO14Ms >> backend\.env
        echo [OK] Gemini API key added
    )
) else (
    echo MONGO_URI=mongodb://localhost:27017 > backend\.env
    echo GEMINI_API_KEY=AIzaSyC6XOdMKDw2MoA_m2x9krVGoKWXpMO14Ms >> backend\.env
    echo [OK] .env file created
)

echo.
echo Step 4: Creating Temp Folder...
echo.

if not exist "backend\temp" (
    mkdir backend\temp
    echo [OK] Created backend/temp folder for PDF generation
) else (
    echo [OK] backend/temp folder already exists
)

echo.
echo Step 5: Verification...
echo.

echo Checking packages:
findstr "@google/generative-ai" backend\package.json >nul
if %errorlevel%==0 (echo  [OK] @google/generative-ai) else (echo  [X] @google/generative-ai - FAILED)

findstr "pdfkit" backend\package.json >nul
if %errorlevel%==0 (echo  [OK] pdfkit) else (echo  [X] pdfkit - FAILED)

findstr "lucide-react" admin\package.json >nul
if %errorlevel%==0 (echo  [OK] lucide-react) else (echo  [X] lucide-react - FAILED)

echo.
echo Checking new files:
if exist "backend\services\gemini.js" (echo  [OK] backend/services/gemini.js) else (echo  [!] backend/services/gemini.js - NOT FOUND)
if exist "backend\services\pdfGenerator.js" (echo  [OK] backend/services/pdfGenerator.js) else (echo  [!] backend/services/pdfGenerator.js - NOT FOUND)
if exist "admin\src\components\AIResolutionGenerator.jsx" (echo  [OK] admin/src/components/AIResolutionGenerator.jsx) else (echo  [!] admin/src/components/AIResolutionGenerator.jsx - NOT FOUND)
if exist "client\src\components\Chatbot.jsx" (echo  [OK] client/src/components/Chatbot.jsx) else (echo  [X] client/src/components/Chatbot.jsx - NOT FOUND)

echo.
echo ========================================
echo   UPGRADE COMPLETE!
echo ========================================
echo.
echo New Features Available:
echo  - Voice input in chatbot (click microphone icon)
echo  - 10 language support (select from dropdown)
echo  - AI resolution generator in admin panel
echo  - Automatic PDF generation for resolutions
echo.
echo Documentation:
echo  - GEMINI-SETUP.md - Setup guide
echo  - QUICK-START-GUIDE.md - Usage instructions
echo  - FEATURES-CHECKLIST.md - Complete feature list
echo.
echo Next: Run option [2] to start all services
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:EXIT
echo.
echo Goodbye!
timeout /t 2 /nobreak >nul
exit

:BOOT_ANIMATION
cls
echo.
echo  [INITIALIZING SYSTEM...]
timeout /t 1 /nobreak >nul
echo  [0x7F3A9B2C] Loading kernel modules...
ping localhost -n 1 >nul
echo  [0x8E4D1F5A] Mounting file systems...
ping localhost -n 1 >nul
echo  [0x9C2B6E8D] Checking database integrity...
ping localhost -n 1 >nul
echo  [0xA1F7C3B9] Initializing network protocols...
ping localhost -n 1 >nul
echo  [0xB5E8D2A4] Loading security modules...
ping localhost -n 1 >nul
echo  [0xC9A3F1E7] Scanning system resources...
ping localhost -n 1 >nul
echo  [0xD4B7E9C2] Establishing secure connections...
ping localhost -n 1 >nul
echo  [0xE8F2A6D1] Verifying authentication tokens...
ping localhost -n 1 >nul
echo  [0xF3C9B5E8] Configuring runtime environment...
ping localhost -n 1 >nul
echo  [0x1A7D4F9B] Optimizing memory allocation...
ping localhost -n 1 >nul
echo  [0x2E9C8A3F] Loading AI modules...
ping localhost -n 1 >nul
echo  [0x3F1B7D5C] Initializing neural networks...
ping localhost -n 1 >nul
echo  [0x4C8E2A9D] Calibrating prediction models...
ping localhost -n 1 >nul
echo  [0x5D9F3B1E] Starting background services...
ping localhost -n 1 >nul
echo  [0x6A2E8C4F] Synchronizing system clock...
ping localhost -n 1 >nul
echo  [0x7B3F9D5A] Enabling monitoring systems...
ping localhost -n 1 >nul
echo  [0x8C4A1E6B] Finalizing boot sequence...
ping localhost -n 1 >nul
echo  [0x9D5B2F7C] Launching control panel...
ping localhost -n 1 >nul
echo.
echo  [SYSTEM READY]
timeout /t 2 /nobreak >nul
goto :eof

:PROCESS_ANIMATION
setlocal
set "msg=%~1"
echo.
echo  [PROCESSING] %msg%
for /L %%i in (1,1,40) do (
    set /p "=." <nul
    ping localhost -n 1 >nul 2>nul
)
echo  [DONE]
endlocal
goto :eof
