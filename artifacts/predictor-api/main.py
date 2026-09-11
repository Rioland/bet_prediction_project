"""
Football AI Predictor - Python FastAPI backend
Port: 5000  (proxied through Express api-server at /api)

Admin seeding is opt-in: set DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD.
There is deliberately no default admin credential.
"""

import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.config import CORS_ORIGINS, FIXTURE_REFRESH_ENABLED
from app.seed import seed_admin, seed_demo_users
from app.routes.admin_auth import router as admin_auth_router
from app.routes.admin import router as admin_router
from app.routes.football import router as football_router
from app.routes.tips import router as tips_router
from app.routes.news import router as news_router
from app.routes.operations import router as operations_router
from app.routes.predictions import router as predictions_router
from app.football_api import refresh_fixtures_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_demo_users(db)
    finally:
        db.close()
    refresh_task = (
        asyncio.create_task(refresh_fixtures_loop()) if FIXTURE_REFRESH_ENABLED else None
    )
    try:
        yield
    finally:
        if refresh_task is not None:
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
    # A wildcard origin cannot be combined with credentials; browsers reject it,
    # and it would expose authenticated endpoints to any site if they did not.
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_auth_router)
app.include_router(admin_router)
app.include_router(football_router)
app.include_router(tips_router)
app.include_router(news_router)
app.include_router(predictions_router)
app.include_router(operations_router)


@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "football-ai-predictor-api"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PREDICTOR_PORT", "5000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
