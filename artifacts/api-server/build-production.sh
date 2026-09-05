#!/bin/bash
# NOTE: do NOT use "set -e" here — pip failures must not kill the pnpm build.
# The pnpm build produces dist/index.mjs which Express needs to open port 8080.

VENV_DIR="artifacts/predictor-api/.venv"

echo "[build] Creating Python virtualenv at $VENV_DIR ..."
if python3 -m venv "$VENV_DIR"; then
  echo "[build] Installing Python dependencies into venv ..."
  if "$VENV_DIR/bin/pip" install --quiet -r artifacts/predictor-api/requirements.txt; then
    echo "[build] Python venv ready."
    "$VENV_DIR/bin/pip" list --format=columns
  else
    echo "[build] WARNING: pip install failed — Python API may not start in production."
  fi
else
  echo "[build] WARNING: venv creation failed — Python API may not start in production."
fi

# Build the Express API server — this MUST succeed for the deployment to work.
echo "[build] Building Express API server ..."
set -e
pnpm --filter @workspace/api-server run build

echo "[build] Done."
