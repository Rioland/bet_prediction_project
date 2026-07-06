from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select

from app.api.deps import DbSession, require_admin
from app.models.entities import Notification, User

router = APIRouter(prefix="/admin", tags=["admin"])

CURRENT_SEASON = date.today().year if date.today().month >= 7 else date.today().year - 1
# World Cup, UEFA competitions, and major domestic leagues (API-Football IDs).
TRACKED_LEAGUES = [1, 2, 3, 4, 5, 848, 39, 140, 135, 78, 61, 88, 94, 203, 71, 253]


class BroadcastRequest(BaseModel):
    title: str
    body: str


@router.post("/sync/live")
def trigger_live_sync(db: DbSession, _: Annotated[object, Depends(require_admin)]) -> dict:
    from app.services.football_sync import sync_live
    from app.services.prediction_service import generate_for_upcoming

    synced = sync_live(db)
    predicted = generate_for_upcoming(db)
    return {"status": "ok", "live_synced": synced, "predicted": predicted}


@router.post("/sync/fixtures")
def trigger_fixture_sync(db: DbSession, _: Annotated[object, Depends(require_admin)]) -> dict:
    from app.services.football_sync import sync_fixtures_for_date, sync_standings
    from app.services.prediction_service import generate_for_upcoming

    fixtures = sync_fixtures_for_date(db, date.today())
    standings = 0
    for league_id in TRACKED_LEAGUES:
        try:
            standings += sync_standings(db, league_id, CURRENT_SEASON)
        except Exception:  # noqa: BLE001
            continue
    predicted = generate_for_upcoming(db)
    return {"status": "ok", "fixtures": fixtures, "standings_rows": standings, "predicted": predicted}


@router.post("/predictions/generate")
def trigger_prediction_generation(
    db: DbSession, _: Annotated[object, Depends(require_admin)]
) -> dict:
    from app.services.prediction_service import generate_for_upcoming

    predicted = generate_for_upcoming(db)
    return {"status": "ok", "predicted": predicted}


@router.post("/ml/retrain")
def retrain(_: Annotated[object, Depends(require_admin)]) -> dict:
    try:
        from app.workers.tasks import retrain_models_task

        task = retrain_models_task.delay()
        return {"task_id": task.id, "status": "queued"}
    except Exception:  # noqa: BLE001 - broker unavailable, run inline
        from app.workers.tasks import retrain_models_task

        return retrain_models_task.run()


@router.get("/users")
def list_users(db: DbSession, _: Annotated[object, Depends(require_admin)]) -> list[dict]:
    users = db.scalars(select(User).order_by(User.created_at.desc()).limit(200))
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "subscription_type": u.subscription_type.value,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.get("/analytics")
def analytics(db: DbSession, _: Annotated[object, Depends(require_admin)]) -> dict:
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    sent_notifications = (
        db.scalar(select(func.count()).select_from(Notification).where(Notification.sent.is_(True)))
        or 0
    )
    return {"total_users": total_users, "sent_notifications": sent_notifications}


@router.post("/notifications/broadcast")
def broadcast_notification(
    payload: BroadcastRequest, db: DbSession, _: Annotated[object, Depends(require_admin)]
) -> dict:
    from app.services.push import send_push_to_users

    sent = send_push_to_users(db, payload.title, payload.body, user_ids=None)
    return {"status": "ok", "pushed": sent}
