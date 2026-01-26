#!/bin/bash
# Development Workflow Script
# This script helps manage the development workflow: merge dev to main and build

set -e

echo "========================================"
echo "Development to Production Workflow"
echo "========================================"
echo ""
echo "This script will:"
echo "1. Merge development branch to main"
echo "2. Build production version"
echo ""
read -p "Continue? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Merging development to main..."
bash scripts/merge-to-production.sh || {
    echo "ERROR: Merge failed. Please fix issues and try again."
    exit 1
}

echo ""
echo "Step 2: Building production version..."
bash scripts/build-production.sh || {
    echo "ERROR: Build failed. Please fix issues and try again."
    exit 1
}

echo ""
echo "========================================"
echo "Workflow completed successfully!"
echo "========================================"
echo ""
echo "Production is ready for deployment!"
echo ""











