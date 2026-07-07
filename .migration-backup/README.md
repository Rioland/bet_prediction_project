# Football AI Predictor

Production-ready monorepo for an AI-powered football prediction platform.

## Stack

- Mobile: Expo + TypeScript + Expo Router + NativeWind + Zustand + TanStack Query
- Backend: FastAPI + SQLAlchemy + Alembic + Celery + Redis + PostgreSQL
- ML: scikit-learn + XGBoost
- Infra: Docker Compose + GitHub Actions

## Monorepo Layout

- `backend/` FastAPI API, workers, ML, migrations, tests
- `mobile/` Expo application
- `admin-web/` Next.js 15 admin panel

## Quick Start

1. Copy `backend/.env.example` to `backend/.env`
2. Run locally with Docker **or** deploy API to [Railway](backend/RAILWAY.md) or [Render](backend/RENDER.md)

```bash
docker compose up --build
```

3. API docs: `http://localhost:8000/docs`

4. Start admin panel:

```bash
cd admin-web
npm install
npm run dev
```

## Implemented Capabilities

- JWT auth (`register`, `login`, `refresh`)
- Matches and predictions APIs
- Premium and subscription verification stubs
- Device registration for push notifications
- Admin endpoints for sync and model retraining
- Celery tasks for fixture sync and live updates
- ML training + inference pipeline
- Expo app scaffold with auth, home, predictions, match detail, profile
- Admin hardening: cookie-based admin sessions, CSRF middleware, TOTP 2FA setup/verify

## Admin Security Notes

- Admin login sets secure cookies: `admin_access_token`, `admin_refresh_token`, `admin_csrf_token`
- CSRF validation is enforced on unsafe `/admin/*` methods for cookie-authenticated requests
- Server-side role guards on every protected Next.js page via `requireAuth()`
- Axios client auto-refreshes tokens on 401 with request queue
- Admin 2FA endpoints:
  - `POST /admin/auth/2fa/setup`
  - `POST /admin/auth/2fa/verify`
  - `GET /admin/auth/me`
  - `POST /admin/auth/logout`
