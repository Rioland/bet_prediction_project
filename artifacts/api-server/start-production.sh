#!/bin/bash
# Start the Python FastAPI backend in the background
echo "[startup] Starting Python API on port 5000..."
cd artifacts/predictor-api
python3 -m uvicorn main:app --host 0.0.0.0 --port 5000 &
cd ../..

# Start the Express API server in the foreground immediately
# (Express opens port 8080 for the healthcheck; it already handles
#  the case where Python is not yet up via the 502 proxy error message)
echo "[startup] Starting Express API server on port 8080..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
