#!/bin/bash
set -e

# Install Python dependencies during the build phase where pip is allowed
echo "[build] Installing Python dependencies..."
pip install --quiet -r artifacts/predictor-api/requirements.txt || \
  pip install --quiet --user -r artifacts/predictor-api/requirements.txt || \
  echo "[build] WARNING: pip install failed — packages may already be available via Nix"

# Build the Express API server
echo "[build] Building Express API server..."
pnpm --filter @workspace/api-server run build
