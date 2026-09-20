#!/usr/bin/env bash
set -o errexit

PORT="${PORT:-8000}"
echo "=== Starting CrowdGuard AI on port ${PORT} ==="
cd backend
exec uvicorn main:app --host 0.0.0.0 --port "${PORT}"
