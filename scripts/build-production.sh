#!/bin/bash
# Script to build production-ready code
# This script ensures you're on main branch and builds the production version

set -e

echo "========================================"
echo "Building Production Version"
echo "========================================"
echo ""

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "WARNING: You are not on the main branch"
    echo "Current branch: $CURRENT_BRANCH"
    echo ""
    read -p "Continue anyway? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Build cancelled."
        exit 1
    fi
fi

echo "[1/4] Fetching latest changes..."
git fetch origin

echo "[2/4] Pulling latest code..."
git pull origin main

echo "[3/4] Installing dependencies..."
npm install

echo "[4/4] Building production version..."
npm run build

echo ""
echo "========================================"
echo "Production build completed successfully!"
echo "========================================"
echo ""
echo "Build output is in the .next folder"
echo "You can now deploy this build to your hosting platform"
echo ""
echo "To start the production server locally, run:"
echo "  npm run start"
echo ""











