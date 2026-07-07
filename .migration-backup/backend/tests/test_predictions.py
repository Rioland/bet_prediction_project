"""Tests for public matches and prediction endpoints."""

from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import League, Match, Standing, Team


def _seed_match(db: Session) -> Match:
    league = League(external_id=39, name="Premier League", country="England")
    home = Team(external_id=33, name="Manchester United")
    away = Team(external_id=40, name="Liverpool")
    db.add_all([league, home, away])
    db.flush()
    db.add_all(
        [
            Standing(league_id=league.id, team_id=home.id, season=2025, rank=6, points=48,
                     played=30, goals_for=50, goals_against=45, form="LWDLW"),
            Standing(league_id=league.id, team_id=away.id, season=2025, rank=2, points=66,
                     played=30, goals_for=72, goals_against=33, form="WWDWW"),
        ]
    )
    now = datetime.utcnow()
    match = Match(
        league_id=league.id,
        home_team_id=home.id,
        away_team_id=away.id,
        kickoff_time=datetime(now.year, now.month, now.day, 15, 0),
        status="scheduled",
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def test_matches_today_includes_team_names(client: TestClient, db_session: Session) -> None:
    _seed_match(db_session)
    resp = client.get("/matches/today")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert len(data) == 1
    assert data[0]["home_team_name"] == "Manchester United"
    assert data[0]["away_team_name"] == "Liverpool"


def test_prediction_cards_today(client: TestClient, db_session: Session) -> None:
    _seed_match(db_session)
    resp = client.get("/predictions/cards/today")
    assert resp.status_code == 200, resp.text
    cards = resp.json()
    assert len(cards) == 1
    card = cards[0]
    assert card["winner_label"] in {"home_win", "draw", "away_win"}
    assert 0 <= card["winner_confidence"] <= 100
    assert set(card["over_under"]) == {"over", "under"}
    assert set(card["btts"]) == {"yes", "no"}
    assert "score" in card["correct_score"]
    assert card["home_xg"] is not None


def test_match_prediction_endpoint(client: TestClient, db_session: Session) -> None:
    match = _seed_match(db_session)
    resp = client.get(f"/predictions/match/{match.id}")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["match_id"] == match.id
    assert "winner" in body and "over_under_2_5" in body and "btts" in body


def test_match_not_found(client: TestClient, db_session: Session) -> None:
    resp = client.get("/predictions/match/999999")
    assert resp.status_code == 404
