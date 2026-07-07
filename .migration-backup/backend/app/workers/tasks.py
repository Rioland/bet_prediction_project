"""Celery tasks: football data sync, prediction generation, push delivery."""

from __future__ import annotations

import logging
from datetime import date

from app.db.session import SessionLocal
from app.workers.celery_app import celery

logger = logging.getLogger("football_ai.workers")

# Leagues/competitions to keep standings fresh for (API-Football league IDs).
# World + UEFA competitions and the major domestic leagues.
TRACKED_LEAGUES = [
    1,    # FIFA World Cup
    2,    # UEFA Champions League
    3,    # UEFA Europa League
    4,    # Euro Championship
    5,    # UEFA Nations League
    848,  # UEFA Europa Conference League
    39,   # Premier League (England)
    140,  # La Liga (Spain)
    135,  # Serie A (Italy)
    78,   # Bundesliga (Germany)
    61,   # Ligue 1 (France)
    88,   # Eredivisie (Netherlands)
    94,   # Primeira Liga (Portugal)
    203,  # Süper Lig (Turkey)
    71,   # Brasileirão Série A (Brazil)
    253,  # Major League Soccer (USA)
]
CURRENT_SEASON = date.today().year if date.today().month >= 7 else date.today().year - 1


def _provider_ready() -> bool:
    from app.core.config import settings

    return bool(settings.football_api_key) and settings.football_api_key not in {
        "replace-me",
        "change-me",
    }


@celery.task
def sync_live_matches_task() -> dict:
    if not _provider_ready():
        return {"status": "skipped", "reason": "FOOTBALL_API_KEY not configured"}
    from app.services.football_sync import sync_live
    from app.services.prediction_service import generate_for_upcoming

    db = SessionLocal()
    try:
        synced = sync_live(db)
        predicted = generate_for_upcoming(db)
        return {"status": "ok", "live_synced": synced, "predicted": predicted}
    except Exception as exc:  # noqa: BLE001
        logger.exception("live sync failed")
        return {"status": "error", "detail": str(exc)}
    finally:
        db.close()


@celery.task
def sync_upcoming_fixtures_task() -> dict:
    if not _provider_ready():
        return {"status": "skipped", "reason": "FOOTBALL_API_KEY not configured"}
    from app.services.football_sync import sync_fixtures_for_date, sync_standings
    from app.services.prediction_service import generate_for_upcoming

    db = SessionLocal()
    try:
        fixtures = sync_fixtures_for_date(db, date.today())
        standings = 0
        for league_id in TRACKED_LEAGUES:
            try:
                standings += sync_standings(db, league_id, CURRENT_SEASON)
            except Exception:  # noqa: BLE001
                logger.warning("standings sync failed for league %s", league_id)
        predicted = generate_for_upcoming(db)
        return {
            "status": "ok",
            "fixtures": fixtures,
            "standings_rows": standings,
            "predicted": predicted,
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("fixtures sync failed")
        return {"status": "error", "detail": str(exc)}
    finally:
        db.close()


@celery.task
def generate_predictions_task() -> dict:
    from app.services.prediction_service import generate_for_upcoming

    db = SessionLocal()
    try:
        count = generate_for_upcoming(db)
        return {"status": "ok", "predicted": count}
    finally:
        db.close()


@celery.task
def retrain_models_task(csv_path: str = "data/historical_matches.csv") -> dict:
    from pathlib import Path

    if not Path(csv_path).exists():
        return {"status": "skipped", "reason": f"training data not found: {csv_path}"}
    from app.ml.train import train_models

    artifacts = train_models(csv_path)
    return {"status": "ok", "artifacts": artifacts}


@celery.task
def send_push_task(title: str, body: str, user_ids: list[int] | None = None) -> dict:
    from app.services.push import send_push_to_users

    db = SessionLocal()
    try:
        sent = send_push_to_users(db, title, body, user_ids)
        return {"status": "ok", "sent": sent}
    finally:
        db.close()
