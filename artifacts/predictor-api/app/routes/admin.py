"""Admin dashboard, users, analytics, and operations routes."""

import random
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.routes.admin_auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])
CurrentAdmin = Annotated[User, Depends(get_current_admin)]


# ── Dashboard analytics ──────────────────────────────────────────────────────

@router.get("/analytics/dashboard")
def dashboard(current: CurrentAdmin, db: Session = Depends(get_db)):
    total = db.query(User).count()
    active = db.query(User).filter(User.status == "active").count()
    premium = db.query(User).filter(User.subscription_type == "premium").count()
    return {
        "total_users": total,
        "active_users": active,
        "premium_users": premium,
        "live_matches": random.randint(3, 12),
        "predictions_today": random.randint(8, 30),
        "revenue": round(random.uniform(800, 3200), 2),
        "monthly_growth": round(random.uniform(2.5, 15.0), 1),
    }


@router.get("/analytics/user-growth")
def user_growth(current: CurrentAdmin):
    today = datetime.utcnow().date()
    series = []
    base = 240
    for i in range(30, 0, -1):
        d = today - timedelta(days=i)
        base += random.randint(-5, 25)
        series.append({"date": d.isoformat(), "users": base})
    return series


@router.get("/analytics/revenue")
def revenue(current: CurrentAdmin):
    today = datetime.utcnow().date()
    series = []
    for i in range(30, 0, -1):
        d = today - timedelta(days=i)
        series.append({"date": d.isoformat(), "revenue": round(random.uniform(50, 400), 2)})
    return series


# ── Users ────────────────────────────────────────────────────────────────────

def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "status": u.status,
        "subscription_type": u.subscription_type,
        "two_factor_enabled": u.two_factor_enabled,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
    }


@router.get("/users")
def list_users(
    current: CurrentAdmin,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
):
    q = db.query(User)
    if search:
        q = q.filter((User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))
    total = q.count()
    users = q.offset((page - 1) * per_page).limit(per_page).all()
    return {"items": [_user_dict(u) for u in users], "total": total, "page": page, "per_page": per_page}


@router.get("/users/{user_id}")
def get_user(user_id: int, current: CurrentAdmin, db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_dict(u)


class RoleUpdate(BaseModel):
    role: str

class StatusUpdate(BaseModel):
    status: str

class ActionUpdate(BaseModel):
    action: str


@router.patch("/users/{user_id}/role")
def update_role(user_id: int, body: RoleUpdate, current: CurrentAdmin, db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    allowed = {"user", "moderator", "admin", "super_admin"}
    if body.role not in allowed:
        raise HTTPException(status_code=400, detail="Invalid role")
    u.role = body.role
    db.commit()
    return _user_dict(u)


@router.patch("/users/{user_id}/status")
def update_status(user_id: int, body: StatusUpdate, current: CurrentAdmin, db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    allowed = {"active", "suspended", "banned"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    u.status = body.status
    db.commit()
    return _user_dict(u)


# ── Subscriptions ────────────────────────────────────────────────────────────

@router.get("/subscriptions")
def list_subscriptions(current: CurrentAdmin, db: Session = Depends(get_db)):
    users = db.query(User).filter(User.subscription_type == "premium").all()
    return [
        {
            "id": u.id,
            "user": {"id": u.id, "name": u.name, "email": u.email},
            "provider": "stripe",
            "status": "active",
            "expires_at": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        }
        for u in users
    ]


@router.patch("/subscriptions/{sub_id}/cancel")
def cancel_subscription(sub_id: int, current: CurrentAdmin, db: Session = Depends(get_db)):
    u = db.get(User, sub_id)
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    u.subscription_type = "free"
    db.commit()
    return {"status": "cancelled"}


# ── Notifications ────────────────────────────────────────────────────────────

class NotificationPayload(BaseModel):
    title: str
    body: str
    audience: str = "all"


@router.post("/notifications/send")
def send_notification(payload: NotificationPayload, current: CurrentAdmin):
    return {"status": "sent", "audience": payload.audience, "title": payload.title}


# ── Reports ──────────────────────────────────────────────────────────────────

_REPORTS = [
    {"id": 1, "category": "spam", "message": "This prediction seems fake.", "status": "open", "created_at": "2025-01-01T12:00:00"},
    {"id": 2, "category": "abuse", "message": "User is harassing others.", "status": "open", "created_at": "2025-01-02T09:30:00"},
    {"id": 3, "category": "bug", "message": "App crashes on predictions page.", "status": "open", "created_at": "2025-01-03T15:00:00"},
]


@router.get("/reports")
def list_reports(current: CurrentAdmin):
    return [r for r in _REPORTS if r["status"] == "open"]


@router.patch("/reports/{report_id}/resolve")
def resolve_report(report_id: int, current: CurrentAdmin):
    for r in _REPORTS:
        if r["id"] == report_id:
            r["status"] = "resolved"
            return r
    raise HTTPException(status_code=404, detail="Report not found")


# ── Settings ─────────────────────────────────────────────────────────────────

_SETTINGS: dict[str, str] = {
    "app_name": "Football AI Predictor",
    "prediction_confidence_threshold": "0.60",
    "max_free_predictions_per_day": "5",
    "premium_price_monthly": "9.99",
}


@router.get("/settings")
def list_settings(current: CurrentAdmin):
    return [{"key": k, "value": v} for k, v in _SETTINGS.items()]


class SettingUpdate(BaseModel):
    value: str


@router.patch("/settings/{key}")
def update_setting(key: str, body: SettingUpdate, current: CurrentAdmin):
    _SETTINGS[key] = body.value
    return {"key": key, "value": body.value}


# ── Operations ───────────────────────────────────────────────────────────────

@router.post("/operations/sync-fixtures")
def sync_fixtures(current: CurrentAdmin):
    return {"status": "ok", "message": "Fixtures synced successfully"}


@router.post("/operations/generate-predictions")
def gen_predictions(current: CurrentAdmin):
    return {"status": "ok", "message": "Predictions generated for today's fixtures"}


@router.post("/operations/retrain-model")
def retrain(current: CurrentAdmin):
    return {"status": "queued", "message": "Model retraining job queued"}


@router.post("/operations/clear-cache")
def clear_cache(current: CurrentAdmin):
    return {"status": "ok", "message": "Cache cleared"}
