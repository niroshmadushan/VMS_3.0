@echo off
REM Script to merge development branch to main (production)
REM This script merges development changes to main and prepares for production build

echo ========================================
echo Merging Development to Production
echo ========================================
echo.

REM Check if we're on development branch
git branch --show-current | findstr /C:"development" >nul
if errorlevel 1 (
    echo ERROR: You must be on the development branch to run this script
    echo Current branch: 
    git branch --show-current
    exit /b 1
)

echo [1/5] Fetching latest changes from remote...
git fetch origin

echo [2/5] Switching to main branch...
git checkout main
if errorlevel 1 (
    echo ERROR: Failed to switch to main branch
    exit /b 1
)

echo [3/5] Pulling latest main branch...
git pull origin main
if errorlevel 1 (
    echo ERROR: Failed to pull main branch
    exit /b 1
)

echo [4/5] Merging development into main...
git merge development --no-ff -m "Merge development into main for production release"
if errorlevel 1 (
    echo ERROR: Merge conflict detected! Please resolve conflicts manually.
    echo After resolving, run: git commit
    exit /b 1
)

echo [5/5] Pushing main branch to remote...
git push origin main
if errorlevel 1 (
    echo ERROR: Failed to push to remote
    exit /b 1
)

echo.
echo ========================================
echo Merge completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run build:production
echo 2. Deploy the build to your hosting platform
echo.
echo Switching back to development branch...
git checkout development

echo Done!











