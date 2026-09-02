"""
Football AI Predictor — Python FastAPI backend
Port: 5000  (proxied through Express api-server at /api)

Admin default credentials:
  Email:    admin@footballai.com
  Password: Admin1234!
"""

import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.seed import seed_admin
from app.routes.admin_auth import router as admin_auth_router
from app.routes.admin import router as admin_router
from app.routes.football import router as football_router
from app.football_api import refresh_fixtures_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()
    refresh_task = asyncio.create_task(refresh_fixtures_loop())
    try:
        yield
    finally:
        refresh_task.cancel()
        try:
            await refresh_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="Football AI Predictor API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_auth_router)
app.include_router(admin_router)
app.include_router(football_router)


@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "football-ai-predictor-api"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PREDICTOR_PORT", "5000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
