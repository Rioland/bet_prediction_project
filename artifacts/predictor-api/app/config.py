import os
import secrets

# In dev, fall back to a randomly generated secret (invalidates sessions on
# restart, but never a guessable well-known string). In production, set the
# JWT_SECRET env var so tokens survive restarts.
JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("SESSION_SECRET") or secrets.token_hex(32)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

DATABASE_URL = os.getenv("PREDICTOR_DATABASE_URL", "sqlite:///./football_ai.db")

FOOTBALL_API_KEY = os.getenv("FOOTBALL_API_KEY", "").strip()
FOOTBALL_API_BASE = "https://api.football-data.org/v4"

# Admin seeding is opt-in and credential-free by default. A hardcoded default
# password in a public repository is a published super-admin login for every
# deployment that runs this code, which needs no exploit to use.
DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "").strip()
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "").strip()
DEFAULT_ADMIN_NAME = os.getenv("DEFAULT_ADMIN_NAME", "Super Admin").strip()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
IS_PRODUCTION = ENVIRONMENT == "production"

# Demo accounts share one published password and include admin and moderator
# roles, so they must never exist outside local development.
SEED_DEMO_USERS = os.getenv("SEED_DEMO_USERS", "").strip().lower() in {"1", "true", "yes"}

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
