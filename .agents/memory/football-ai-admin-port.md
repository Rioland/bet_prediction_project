---
name: Football AI Admin Port
description: Key decisions and gotchas from porting the Football AI Next.js admin dashboard to Vite+React on Replit.
---

## What was ported
Next.js 15 (App Router) admin dashboard → `artifacts/admin-web/` react-vite artifact.
No API routes existed — pure frontend calling an external FastAPI backend.

## Key decisions

**Auth guard pattern**
- Added `isHydrated` flag to Zustand store (`store/auth.ts`). `ProtectedRoute` in App.tsx waits for `isHydrated` before making redirect decisions; otherwise user gets kicked to `/login` on every refresh.

**Role enforcement**
- Every protected route MUST have an entry in `ROUTE_MIN_ROLES` (`lib/roles.ts`). A missing entry silently bypasses role checks — `ProtectedRoute` treats `undefined` minRole as no restriction. `/operations: "admin"` was initially missing and caught by code review.

**vite.config.ts**
- The scaffold originally hard-threw when PORT/BASE_PATH were absent. Changed to safe defaults (`PORT=5173`, `BASE_PATH='/'`) so `pnpm --filter @workspace/admin-web run dev` works without workflow env injection.

**Why:** Replit code review validator runs without artifact-injected env vars.

## File map
- `artifacts/admin-web/src/App.tsx` — router + ProtectedRoute with role+hydration guards
- `artifacts/admin-web/src/lib/roles.ts` — ROUTE_MIN_ROLES (add every protected path here)
- `artifacts/admin-web/src/store/auth.ts` — Zustand auth + isHydrated flag
- `artifacts/admin-web/src/lib/api.ts` — Axios, uses VITE_API_URL (not NEXT_PUBLIC_)
