#!/usr/bin/env bash
# exit on error
set -o errexit

echo "=== Building CrowdGuard AI Single-Service ==="

echo "1. Installing Python backend dependencies..."
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

echo "2. Installing Node dependencies & building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "=== Build completed successfully! ==="
