@echo off
color 0C
title NagrikConnect - Service Terminator

call :SHUTDOWN_ANIMATION

echo ========================================
echo STOPPING ALL SERVICES
echo ========================================

call :STOP_SERVICE "MongoDB"
taskkill /F /IM mongod.exe 2>nul

call :STOP_SERVICE "Node.js Services"
taskkill /F /IM node.exe 2>nul

call :STOP_SERVICE "Python Services"
taskkill /F /IM python.exe 2>nul

echo.
echo ========================================
echo All services terminated successfully!
echo ========================================
echo.
echo Press any key to exit...
pause > nul
exit

:SHUTDOWN_ANIMATION
cls
echo.
echo  [INITIATING SHUTDOWN SEQUENCE]
timeout /t 1 /nobreak >nul
echo  [0xDEADBEEF] Closing active connections...
ping localhost -n 1 >nul
echo  [0xCAFEBABE] Terminating background processes...
ping localhost -n 1 >nul
echo  [0xFEEDFACE] Releasing system resources...
ping localhost -n 1 >nul
echo  [0xBADDCAFE] Stopping database engine...
ping localhost -n 1 >nul
echo  [0xDEADC0DE] Shutting down backend services...
ping localhost -n 1 >nul
echo  [0xC0FFEE00] Closing API endpoints...
ping localhost -n 1 >nul
echo  [0xBAADF00D] Unloading Python modules...
ping localhost -n 1 >nul
echo  [0xFACEFEED] Terminating ML processes...
ping localhost -n 1 >nul
echo  [0xDEFACED1] Closing client connections...
ping localhost -n 1 >nul
echo  [0xBEEFCAFE] Stopping admin services...
ping localhost -n 1 >nul
echo  [0xC0DEC0DE] Clearing memory buffers...
ping localhost -n 1 >nul
echo  [0xFADEDEAD] Releasing network ports...
ping localhost -n 1 >nul
echo  [0xBABEFACE] Disabling security modules...
ping localhost -n 1 >nul
echo  [0xDEADFACE] Finalizing shutdown...
ping localhost -n 1 >nul
echo.
echo  [READY TO TERMINATE]
timeout /t 2 /nobreak >nul
cls
goto :eof

:STOP_SERVICE
echo.
echo [TERMINATING] %~1
for /L %%i in (1,1,20) do (
    set /p "=▓" <nul
    ping localhost -n 1 >nul 2>nul
)
echo  [STOPPED]
goto :eof
