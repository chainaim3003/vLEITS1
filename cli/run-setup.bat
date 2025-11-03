@echo off
setlocal enabledelayedexpansion

echo.
echo ===============================================================
echo   🚀 vLEI Setup with Local Schema Server
echo ===============================================================
echo.

:: Check if schema server is already running
netstat -ano | findstr ":7723" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Schema server is already running on port 7723
) else (
    echo Starting schema server...
    start /B node schema-server.js > schema-server.log 2>&1
    echo [OK] Schema server started
    echo     Log: schema-server.log
    
    :: Wait for server to be ready
    echo.
    echo Waiting for schema server to be ready...
    for /L %%i in (1,1,10) do (
        timeout /t 1 /nobreak >nul
        curl -s http://127.0.0.1:7723/ >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            echo [OK] Schema server is ready!
            goto :server_ready
        )
        echo|set /p="."
    )
    :server_ready
    echo.
)

echo.
echo ===============================================================
echo   Running vLEI Setup
echo ===============================================================
echo.

:: Build and run setup
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    exit /b 1
)

node build/index.js setup-vlei
set SETUP_EXIT=%ERRORLEVEL%

echo.
if %SETUP_EXIT% EQU 0 (
    echo ===============================================================
    echo   ✅ Setup Complete!
    echo ===============================================================
) else (
    echo ===============================================================
    echo   ❌ Setup Failed
    echo ===============================================================
)

echo.
echo To stop the schema server, run:
echo   taskkill /F /IM node.exe /FI "WINDOWTITLE eq schema-server*"
echo.

exit /b %SETUP_EXIT%
