@echo off
echo.
echo ========================================
echo vLEI Setup Quick Start
echo ========================================
echo.

echo Checking vlei-server on port 7723...
curl -s http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] vlei-server is NOT running on port 7723
    echo.
    echo Please start vlei-server first:
    echo   docker run -d -p 7723:7723 --name vlei-server weboftrust/vlei-server:latest
    echo.
    exit /b 1
)

echo [OK] vlei-server is running
echo.

echo Building project...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    exit /b 1
)

echo.
echo [OK] Build successful!
echo.
echo Starting vLEI setup...
echo.

call npm run setup:vlei
