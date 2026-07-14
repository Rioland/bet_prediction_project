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

FOOTBALL_API_KEY = os.getenv("FOOTBALL_API_KEY", "")
FOOTBALL_API_BASE = "https://api.football-data.org/v4"

DEFAULT_ADMIN_EMAIL = "admin@footballai.com"
DEFAULT_ADMIN_PASSWORD = "Admin1234!"
DEFAULT_ADMIN_NAME = "Super Admin"
