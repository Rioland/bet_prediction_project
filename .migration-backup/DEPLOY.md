# Deploy from Git (GitHub → Render or Railway)

## Step 1: Initialize Git and push to GitHub

Run these in your project folder:

```bash
cd /Users/cleaques_sys1/Downloads/betting_prediction

git init
git add .
git commit -m "Initial commit: Football AI Predictor"

# Create a new empty repo on GitHub, then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> `.env` files are gitignored — secrets stay local. Set them in Render/Railway dashboards.

---

## Step 2A: Deploy API on Render (from Git)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. **New** → **Blueprint**
3. Connect your **GitHub** account and select your repo
4. Render detects `render.yaml` and creates API + Postgres + Redis + Worker
5. Enter required secrets when prompted:
   - `FOOTBALL_API_KEY`
   - `CORS_ORIGINS` (e.g. `https://your-admin.vercel.app`)
6. Click **Apply** and wait for deploy
7. Copy your API URL: `https://football-api-xxxx.onrender.com`
8. Test: `https://YOUR-URL/health`

**Manual (without blueprint):**

1. **New** → **Web Service** → connect GitHub repo
2. **Root Directory:** `backend`
3. **Runtime:** Docker
4. Add **PostgreSQL** database and link `DATABASE_URL`
5. Add env vars (see `backend/RENDER.md`)

---

## Step 2B: Deploy API on Railway (from Git)

1. Go to [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Service **Settings** → **Root Directory** → `backend`
5. Add **PostgreSQL** → reference `DATABASE_URL`
6. Add variables (see `backend/RAILWAY.md`)
7. **Settings** → **Networking** → **Generate Domain**

---

## Step 3: Deploy admin panel from Git (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your **same GitHub repo**
3. **Root Directory:** `admin-web`
4. **Environment Variable:**
   ```
   NEXT_PUBLIC_API_URL=https://YOUR-API-URL.onrender.com
   ```
5. Deploy

---

## Step 4: Verify

| Check | URL |
|-------|-----|
| API health | `https://YOUR-API/health` |
| API docs | `https://YOUR-API/docs` |
| Admin login | `https://YOUR-ADMIN.vercel.app/login` |

---

## Git deploy workflow (after first setup)

Every code change:

```bash
git add .
git commit -m "Describe your change"
git push
```

Render, Railway, and Vercel auto-redeploy on push to `main`.

---

## What gets deployed from Git

| Path | Platform | Service |
|------|----------|---------|
| `backend/` | Render / Railway | FastAPI API |
| `admin-web/` | Vercel | Admin panel |
| `mobile/` | Expo EAS (optional) | Mobile app |

---

## Do not commit

- `backend/.env` (API keys, DB passwords)
- `admin-web/.env.local`
- `node_modules/`

These are already in `.gitignore`.
