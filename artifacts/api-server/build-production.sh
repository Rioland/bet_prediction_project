#!/bin/bash
set -e

# Create a virtualenv for the Python API so packages are isolated from the
# system Nix Python (which has a broken sitecustomize in the prod container).
VENV_DIR="artifacts/predictor-api/.venv"

echo "[build] Creating Python virtualenv at $VENV_DIR ..."
python3 -m venv "$VENV_DIR"

echo "[build] Installing Python dependencies into venv ..."
"$VENV_DIR/bin/pip" install --quiet -r artifacts/predictor-api/requirements.txt

echo "[build] Python venv ready. Installed packages:"
"$VENV_DIR/bin/pip" list --format=columns

# Build the Express API server
echo "[build] Building Express API server ..."
pnpm --filter @workspace/api-server run build

echo "[build] Done."
