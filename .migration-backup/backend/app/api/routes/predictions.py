from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.api.deps import DbSession, get_current_user
from app.models.entities import Match, Prediction, SubscriptionType, User
from app.schemas.common import (
    MatchPredictionOut,
    PredictionCardOut,
    PredictionOut,
)
from app.services.prediction_service import predict_match
from app.api.routes.matches import _match_out

router = APIRouter(tags=["predictions"])


def _today_bounds() -> tuple[datetime, datetime]:
    today = date.today()
    return (
        datetime(today.year, today.month, today.day),
        datetime(today.year, today.month, today.day, 23, 59, 59),
    )


def _match_query():
    return select(Match).options(
        joinedload(Match.home_team),
        joinedload(Match.away_team),
        joinedload(Match.league),
    )


def _card(db: DbSession, match: Match) -> PredictionCardOut:
    result = predict_match(db, match)
    return PredictionCardOut(
        match=_match_out(match),
        winner_label=result["winner"]["label"],
        winner_confidence=result["winner"]["confidence"],
        winner_probabilities=result["winner"]["probabilities"],
        over_under=result["over_under_2_5"],
        btts=result["btts"],
        correct_score=result["correct_score"],
        home_xg=result["home_xg"],
        away_xg=result["away_xg"],
    )


@router.get("/predictions/today", response_model=list[PredictionOut])
def get_today_predictions(db: DbSession) -> list[Prediction]:
    start, end = _today_bounds()
    stmt = (
        select(Prediction)
        .join(Match, Prediction.match_id == Match.id)
        .where(Match.kickoff_time >= start, Match.kickoff_time <= end)
    )
    return list(db.scalars(stmt))


@router.get("/predictions/cards/today", response_model=list[PredictionCardOut])
def get_today_prediction_cards(db: DbSession) -> list[PredictionCardOut]:
    """Aggregated prediction cards (winner, O/U, BTTS, xG) for today's matches."""
    start, end = _today_bounds()
    matches = list(
        db.scalars(_match_query().where(Match.kickoff_time >= start, Match.kickoff_time <= end))
    )
    return [_card(db, m) for m in matches]


@router.get("/predictions/match/{match_id}", response_model=MatchPredictionOut)
def get_match_prediction(match_id: int, db: DbSession) -> MatchPredictionOut:
    match = db.scalar(_match_query().where(Match.id == match_id))
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return MatchPredictionOut(**predict_match(db, match))


@router.get("/predictions/{match_id}", response_model=list[PredictionOut])
def get_match_predictions(match_id: int, db: DbSession) -> list[Prediction]:
    return list(db.scalars(select(Prediction).where(Prediction.match_id == match_id)))


@router.get("/premium/predictions", response_model=list[PredictionCardOut])
def get_premium_predictions(
    db: DbSession, current_user: Annotated[User, Depends(get_current_user)]
) -> list[PredictionCardOut]:
    if current_user.subscription_type != SubscriptionType.PREMIUM:
        raise HTTPException(status_code=402, detail="Premium subscription required")
    matches = list(
        db.scalars(_match_query().where(Match.status.in_(["scheduled", "live"])).limit(50))
    )
    return [_card(db, m) for m in matches]
