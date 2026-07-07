"""Prediction engine.

Uses trained scikit-learn / XGBoost models when artifacts are present in
``settings.model_dir``; otherwise falls back to a deterministic statistical
model derived from league standings so the API always returns predictions.
"""

from __future__ import annotations

import math
from pathlib import Path

import joblib
import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.ml.features import FEATURE_COLUMNS
from app.models.entities import Match, Prediction, Standing

MARKETS = ("match_winner", "over_under_2_5", "btts", "correct_score")
HOME_ADVANTAGE = 0.25


def _model_path(target: str) -> Path:
    return Path(settings.model_dir) / f"{target}.joblib"


def _load_model(target: str):
    path = _model_path(target)
    if not path.exists():
        return None
    try:
        return joblib.load(path)
    except Exception:
        return None


def _standing(db: Session, match: Match, team_id: int) -> Standing | None:
    return db.scalar(
        select(Standing)
        .where(Standing.league_id == match.league_id, Standing.team_id == team_id)
        .order_by(Standing.season.desc())
    )


def build_features(db: Session, match: Match) -> dict:
    """Derive the FEATURE_COLUMNS vector from standings (falls back to neutral)."""
    home = _standing(db, match, match.home_team_id)
    away = _standing(db, match, match.away_team_id)

    def avg(value: int | None, played: int | None) -> float:
        if not played:
            return 1.2
        return round((value or 0) / played, 2)

    home_gf = avg(home.goals_for if home else None, home.played if home else None)
    home_ga = avg(home.goals_against if home else None, home.played if home else None)
    away_gf = avg(away.goals_for if away else None, away.played if away else None)
    away_ga = avg(away.goals_against if away else None, away.played if away else None)

    def form_points(form: str | None) -> float:
        if not form:
            return 1.5
        pts = {"W": 3, "D": 1, "L": 0}
        last = form[-5:]
        return round(sum(pts.get(ch, 1) for ch in last) / max(len(last), 1), 2)

    return {
        "home_form": form_points(home.form if home else None),
        "away_form": form_points(away.form if away else None),
        "h2h_home_wins": 2,
        "h2h_draws": 1,
        "h2h_away_wins": 2,
        "home_goals_scored_avg": home_gf,
        "away_goals_scored_avg": away_gf,
        "home_goals_conceded_avg": home_ga,
        "away_goals_conceded_avg": away_ga,
        "home_league_position": float(home.rank) if home else 10.0,
        "away_league_position": float(away.rank) if away else 10.0,
        "home_xg": round(home_gf * 0.9 + 0.3, 2),
        "away_xg": round(away_gf * 0.9, 2),
        "home_possession": 52.0,
        "away_possession": 48.0,
        "home_shots_on_target": round(home_gf * 2.5, 1),
        "away_shots_on_target": round(away_gf * 2.5, 1),
    }


def _expected_goals(features: dict) -> tuple[float, float]:
    home_xg = (features["home_goals_scored_avg"] + features["away_goals_conceded_avg"]) / 2
    away_xg = (features["away_goals_scored_avg"] + features["home_goals_conceded_avg"]) / 2
    return round(home_xg + HOME_ADVANTAGE, 2), round(max(away_xg - 0.1, 0.2), 2)


def _poisson(k: int, lam: float) -> float:
    return (lam**k) * math.exp(-lam) / math.factorial(k)


def _heuristic(features: dict) -> dict:
    home_xg, away_xg = _expected_goals(features)

    # Match winner via Poisson scoreline grid.
    p_home = p_draw = p_away = 0.0
    best_score, best_p = (1, 1), 0.0
    for h in range(0, 7):
        for a in range(0, 7):
            p = _poisson(h, home_xg) * _poisson(a, away_xg)
            if h > a:
                p_home += p
            elif h == a:
                p_draw += p
            else:
                p_away += p
            if p > best_p:
                best_p, best_score = p, (h, a)
    total = p_home + p_draw + p_away or 1.0
    winner = {
        "home_win": p_home / total,
        "draw": p_draw / total,
        "away_win": p_away / total,
    }

    # Over/Under 2.5 and BTTS from expected goals.
    p_under = sum(
        _poisson(h, home_xg) * _poisson(a, away_xg)
        for h in range(0, 7)
        for a in range(0, 7)
        if h + a <= 2
    )
    p_over = 1 - p_under
    p_no_home = _poisson(0, home_xg)
    p_no_away = _poisson(0, away_xg)
    p_btts_yes = (1 - p_no_home) * (1 - p_no_away)

    return {
        "home_xg": home_xg,
        "away_xg": away_xg,
        "winner": winner,
        "over_under": {"over": round(p_over, 3), "under": round(p_under, 3)},
        "btts": {"yes": round(p_btts_yes, 3), "no": round(1 - p_btts_yes, 3)},
        "correct_score": f"{best_score[0]}-{best_score[1]}",
        "correct_score_prob": round(best_p / total, 3),
    }


def _ml_probabilities(target: str, features: dict) -> dict | None:
    model = _load_model(target)
    if model is None:
        return None
    vector = np.array([[features.get(k, 0) for k in FEATURE_COLUMNS]])
    try:
        probs = model.predict_proba(vector)[0]
        return {str(c): float(p) for c, p in zip(model.classes_, probs)}
    except Exception:
        return None


def predict_match(db: Session, match: Match) -> dict:
    """Return predictions for all markets for a single match."""
    features = build_features(db, match)
    h = _heuristic(features)

    winner = _ml_probabilities("match_winner", features) or h["winner"]
    winner_label = max(winner, key=winner.get)

    over_under = _ml_probabilities("over_under_2_5", features) or h["over_under"]
    btts = _ml_probabilities("btts", features) or h["btts"]

    return {
        "match_id": match.id,
        "home_xg": h["home_xg"],
        "away_xg": h["away_xg"],
        "winner": {"label": winner_label, "probabilities": winner, "confidence": round(max(winner.values()) * 100, 1)},
        "over_under_2_5": over_under,
        "btts": btts,
        "correct_score": {"score": h["correct_score"], "probability": h["correct_score_prob"]},
    }


def generate_and_store(db: Session, match: Match) -> list[Prediction]:
    """Compute predictions for a match and persist them (replacing existing)."""
    result = predict_match(db, match)
    db.query(Prediction).filter(Prediction.match_id == match.id).delete()

    rows = [
        Prediction(
            match_id=match.id,
            prediction_type="match_winner",
            prediction=result["winner"]["label"],
            confidence=result["winner"]["confidence"],
            probabilities={
                **result["winner"]["probabilities"],
                "home_xg": result["home_xg"],
                "away_xg": result["away_xg"],
            },
        ),
        Prediction(
            match_id=match.id,
            prediction_type="over_under_2_5",
            prediction="over" if result["over_under_2_5"]["over"] >= 0.5 else "under",
            confidence=round(max(result["over_under_2_5"].values()) * 100, 1),
            probabilities=result["over_under_2_5"],
        ),
        Prediction(
            match_id=match.id,
            prediction_type="btts",
            prediction="yes" if result["btts"]["yes"] >= 0.5 else "no",
            confidence=round(max(result["btts"].values()) * 100, 1),
            probabilities=result["btts"],
        ),
        Prediction(
            match_id=match.id,
            prediction_type="correct_score",
            prediction=result["correct_score"]["score"],
            confidence=round(result["correct_score"]["probability"] * 100, 1),
            probabilities={"score": result["correct_score"]["score"], "probability": result["correct_score"]["probability"]},
        ),
    ]
    db.add_all(rows)
    db.commit()
    return rows


def generate_for_upcoming(db: Session) -> int:
    """Generate predictions for all scheduled/live matches without predictions."""
    matches = list(db.scalars(select(Match).where(Match.status.in_(["scheduled", "live"]))))
    count = 0
    for match in matches:
        generate_and_store(db, match)
        count += 1
    return count
