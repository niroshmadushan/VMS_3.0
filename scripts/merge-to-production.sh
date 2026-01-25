#!/bin/bash
# Script to merge development branch to main (production)
# This script merges development changes to main and prepares for production build

set -e

echo "========================================"
echo "Merging Development to Production"
echo "========================================"
echo ""

# Check if we're on development branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "ERROR: You must be on the development branch to run this script"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

echo "[1/5] Fetching latest changes from remote..."
git fetch origin

echo "[2/5] Switching to main branch..."
git checkout main

echo "[3/5] Pulling latest main branch..."
git pull origin main

echo "[4/5] Merging development into main..."
git merge development --no-ff -m "Merge development into main for production release" || {
    echo "ERROR: Merge conflict detected! Please resolve conflicts manually."
    echo "After resolving, run: git commit"
    exit 1
}

echo "[5/5] Pushing main branch to remote..."
git push origin main

echo ""
echo "========================================"
echo "Merge completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run: npm run build:production"
echo "2. Deploy the build to your hosting platform"
echo ""
echo "Switching back to development branch..."
git checkout development

echo "Done!"











