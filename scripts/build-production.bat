@echo off
REM Script to build production-ready code
REM This script ensures you're on main branch and builds the production version

echo ========================================
echo Building Production Version
echo ========================================
echo.

REM Check if we're on main branch
git branch --show-current | findstr /C:"main" >nul
if errorlevel 1 (
    echo WARNING: You are not on the main branch
    echo Current branch: 
    git branch --show-current
    echo.
    set /p confirm="Continue anyway? (y/n): "
    if /i not "%confirm%"=="y" (
        echo Build cancelled.
        exit /b 1
    )
)

echo [1/4] Fetching latest changes...
git fetch origin

echo [2/4] Pulling latest code...
git pull origin main
if errorlevel 1 (
    echo ERROR: Failed to pull latest code
    exit /b 1
)

echo [3/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)

echo [4/4] Building production version...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    exit /b 1
)

echo.
echo ========================================
echo Production build completed successfully!
echo ========================================
echo.
echo Build output is in the .next folder
echo You can now deploy this build to your hosting platform
echo.
echo To start the production server locally, run:
echo   npm run start
echo.











