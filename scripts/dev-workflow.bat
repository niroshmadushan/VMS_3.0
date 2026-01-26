@echo off
REM Development Workflow Script
REM This script helps manage the development workflow: merge dev to main and build

echo ========================================
echo Development to Production Workflow
echo ========================================
echo.
echo This script will:
echo 1. Merge development branch to main
echo 2. Build production version
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo Step 1: Merging development to main...
call scripts\merge-to-production.bat
if errorlevel 1 (
    echo ERROR: Merge failed. Please fix issues and try again.
    exit /b 1
)

echo.
echo Step 2: Building production version...
call scripts\build-production.bat
if errorlevel 1 (
    echo ERROR: Build failed. Please fix issues and try again.
    exit /b 1
)

echo.
echo ========================================
echo Workflow completed successfully!
echo ========================================
echo.
echo Production is ready for deployment!
echo.











