"""Public football prediction routes (no auth required)."""

import time
from fastapi import APIRouter, HTTPException, Query

from app.football_api import get_leagues, get_today_fixtures, get_live_fixtures

router = APIRouter(prefix="/football", tags=["football"])

# Cache upcoming fixtures — refresh every 2 hours so new matchdays appear promptly
_FIXTURE_TTL = 7200  # 2 hours in seconds
_cached_fixtures: list[dict] = []
_cached_at: float = 0.0


def _get_fixtures() -> list[dict]:
    global _cached_fixtures, _cached_at
    if time.monotonic() - _cached_at > _FIXTURE_TTL:
        _cached_fixtures = get_today_fixtures()
        _cached_at = time.monotonic()
    return _cached_fixtures


@router.get("/leagues")
def leagues():
    return get_leagues()


@router.get("/matches/today")
def matches_today(league_id: int | None = Query(None)):
    fixtures = _get_fixtures()
    if league_id is not None:
        fixtures = [f for f in fixtures if f.get("league_id") == league_id]
    return fixtures


@router.get("/predictions/today")
def predictions_today(league_id: int | None = Query(None)):
    return matches_today(league_id=league_id)


@router.get("/predictions/{fixture_id}")
def prediction_by_id(fixture_id: int):
    fixtures = _get_fixtures()
    for f in fixtures:
        if f.get("fixture_id") == fixture_id:
            return f
    raise HTTPException(status_code=404, detail="Fixture not found")


@router.get("/live")
def live_matches():
    """Return matches currently in-play, refreshed every 60 s via the live API."""
    return get_live_fixtures()
