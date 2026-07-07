# Football AI Admin Dashboard

A Football AI Prediction platform admin dashboard ported from Vercel/Next.js to Replit's pnpm workspace.

## Architecture

- **Frontend** (`artifacts/admin-web/`): React + Vite SPA at `/`. Auth via Zustand + localStorage. Connects to the FastAPI backend via `VITE_API_URL`.
- **API Server** (`artifacts/api-server/`): Express.js backend stub at `/api` (Replit-managed).
- **Original Backend**: Python FastAPI service (`.migration-backup/backend/`) — configure `VITE_API_URL` to point to your deployed FastAPI instance.

## Environment Variables

- `VITE_API_URL` — URL of the deployed FastAPI backend (e.g. `https://your-backend.onrender.com`). Defaults to `http://localhost:8000` if not set.

## Routes

| Path | Page | Min Role |
|------|------|----------|
| `/login` | Login | — |
| `/dashboard` | Stats overview | admin |
| `/users` | User management | moderator |
| `/analytics` | User + revenue analytics | admin |
| `/subscriptions` | Subscription management | admin |
| `/notifications` | Push notification sender | admin |
| `/operations` | Sync / ML retrain triggers | admin |
| `/reports` | Content reports moderation | moderator |
| `/settings` | System settings | super_admin |

## User Preferences

- Dark theme by default (matches original Next.js app)
- Green primary accent (HSL 142.1 70.6% 45.3%)
