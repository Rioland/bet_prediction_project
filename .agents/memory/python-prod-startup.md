---
name: Python production startup
description: How to reliably start the Python FastAPI backend in Replit production deployments
---

## The problem

In Replit production containers, Nix's `sitecustomize.py` crashes before it can add `.pythonlibs` to `sys.path`. This means packages installed via `installLanguagePackages` (uv) are invisible to Python at runtime, so `uvicorn`/`fastapi`/etc. are not importable.

## The fix (in index.ts spawnPython)

Explicitly set `PYTHONPATH` in the Node spawn env to include the `.pythonlibs` path:

```
/home/runner/workspace/.pythonlibs/lib/python3.13/site-packages
```

This bypasses sitecustomize entirely. Python always respects `PYTHONPATH` regardless of sitecustomize.

Also include the venv site-packages as a secondary path (built during the production build step).

## What NOT to do

- Do NOT rely on system Python finding packages automatically — sitecustomize fails in prod
- Do NOT use `set -e` in the build script around pip install — a blocked package kills the entire build and dist/index.mjs never gets built, so port 8080 never opens
- `python-jose` is blocked by Replit's package firewall (403) — use `PyJWT` instead

## Build script notes

`build-production.sh` uses `set -e` only AFTER the pip/venv section, so pnpm build always runs even if pip fails.

## Python packages location (dev)

`/home/runner/workspace/.pythonlibs/lib/python3.13/site-packages` — installed via `uv add` / `installLanguagePackages`.

**Why:** sitecustomize adds this path in dev but crashes in production. PYTHONPATH is the reliable cross-env alternative.
