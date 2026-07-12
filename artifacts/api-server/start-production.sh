#!/bin/bash
set -e

# Install Python dependencies (fast no-op if already installed)
echo "[startup] Installing Python dependencies..."
pip install -q -r artifacts/predictor-api/requirements.txt

# Start the Python FastAPI backend in the background
echo "[startup] Starting Python API on port 5000..."
cd artifacts/predictor-api
python3 -m uvicorn main:app --host 0.0.0.0 --port 5000 &
PYTHON_PID=$!
cd ../..

# Wait until the Python API is healthy (up to 30s)
echo "[startup] Waiting for Python API to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:5000/healthz > /dev/null 2>&1; then
    echo "[startup] Python API is ready."
    break
  fi
  sleep 1
done

# Start the Express API server (foreground — keeps the container alive)
echo "[startup] Starting Express API server on port 8080..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
