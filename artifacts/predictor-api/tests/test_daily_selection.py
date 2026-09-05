"""Full fixture listing and the AI's daily shortlist."""

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import League, Match, Team
from app.services.analysis import DAILY_MAXIMUM, select_daily, selection_score
from main import app


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _entry(league: str, value: float, probability: float, fixture_id: int) -> dict:
    return {
        "fixture_id": fixture_id,
        "league_name": league,
        "recommendation": {"value": value, "probability": probability, "selection": "1"},
    }


# --- selection ranking -------------------------------------------------------


def test_priced_edge_outranks_a_higher_unpriced_probability() -> None:
    """An unpriced 90% has unknown edge; a priced 60% with real edge is better evidenced."""
    priced = _entry("A", 0.12, 0.60, 1)
    unpriced = _entry("B", 0.0, 0.90, 2)
    assert selection_score(priced["recommendation"]) > selection_score(unpriced["recommendation"])


def test_selection_spreads_across_leagues_before_doubling_up() -> None:
    entries = [
        _entry("Premier League", 0.20, 0.7, 1),
        _entry("Premier League", 0.19, 0.7, 2),
        _entry("Premier League", 0.18, 0.7, 3),
        _entry("La Liga", 0.05, 0.6, 4),
        _entry("Serie A", 0.04, 0.6, 5),
    ]
    chosen = select_daily(entries, target=3)
    assert [c["league_name"] for c in chosen] == ["Premier League", "La Liga", "Serie A"]


def test_selection_backfills_when_leagues_run_out() -> None:
    entries = [
        _entry("Premier League", 0.20, 0.7, 1),
        _entry("Premier League", 0.19, 0.7, 2),
        _entry("La Liga", 0.05, 0.6, 3),
    ]
    chosen = select_daily(entries, target=3)
    assert len(chosen) == 3
    assert {c["fixture_id"] for c in chosen} == {1, 2, 3}


def test_selection_never_exceeds_the_cap() -> None:
    entries = [_entry(f"League {i}", 0.1, 0.7, i) for i in range(30)]
    assert len(select_daily(entries, target=DAILY_MAXIMUM)) == DAILY_MAXIMUM


def test_selection_skips_fixtures_with_no_recommendation() -> None:
    entries = [_entry("A", 0.2, 0.7, 1), {"fixture_id": 2, "league_name": "B", "recommendation": None}]
    chosen = select_daily(entries, target=5)
    assert [c["fixture_id"] for c in chosen] == [1]


def test_selection_of_an_empty_card_is_empty() -> None:
    assert select_daily([], target=7) == []


# --- endpoints ---------------------------------------------------------------


@pytest.fixture()
def card(db_session: Session):
    """Two leagues with history, plus one fixture between brand-new teams."""
    leagues = [League(external_id=1, name="League One", country="X"),
               League(external_id=2, name="League Two", country="Y")]
    db_session.add_all(leagues)
    teams = [Team(name=f"Team {i}") for i in range(8)]
    db_session.add_all(teams)
    db_session.flush()

    base = datetime.utcnow() - timedelta(days=60)
    for i in range(48):
        db_session.add(Match(
            external_id=6000 + i, league_id=leagues[i % 2].id,
            home_team_id=teams[i % 8].id, away_team_id=teams[(i + 3) % 8].id,
            kickoff_time=base + timedelta(days=i), status="FT", season=2025,
            home_goals=i % 4, away_goals=(i + 1) % 3,
            odds_home=2.0, odds_draw=3.4, odds_away=3.5,
        ))

    today = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    for j in range(6):
        db_session.add(Match(
            external_id=6500 + j, league_id=leagues[j % 2].id,
            home_team_id=teams[j % 8].id, away_team_id=teams[(j + 4) % 8].id,
            kickoff_time=today.replace(hour=12) + timedelta(hours=j),
            status="NS", season=2025, odds_home=1.9, odds_draw=3.5, odds_away=4.0,
        ))

    newcomers = [Team(name="Newcomer A"), Team(name="Newcomer B")]
    db_session.add_all(newcomers)
    db_session.flush()
    db_session.add(Match(
        external_id=6999, league_id=leagues[0].id, home_team_id=newcomers[0].id,
        away_team_id=newcomers[1].id, kickoff_time=today.replace(hour=21),
        status="NS", season=2025,
    ))
    db_session.commit()


def test_fixtures_lists_every_match_including_unanalysable(client, card, trained_models) -> None:
    body = client.get("/football/fixtures").json()
    ids = {f["fixture_id"] for f in body["fixtures"]}

    assert 6999 in ids, "an unanalysable fixture must still be listed"
    assert body["total"] == 7
    assert body["analysable"] == 6


def test_unanalysable_fixtures_explain_themselves(client, card, trained_models) -> None:
    fixtures = client.get("/football/fixtures").json()["fixtures"]
    newcomer = next(f for f in fixtures if f["fixture_id"] == 6999)

    assert newcomer["analysis_available"] is False
    assert newcomer["tip"] is None
    assert "completed matches on record" in newcomer["unavailable_reason"]


def test_analysable_fixtures_carry_a_tip(client, card, trained_models) -> None:
    fixtures = client.get("/football/fixtures").json()["fixtures"]
    analysable = [f for f in fixtures if f["analysis_available"]]

    assert analysable
    for fixture in analysable:
        assert fixture["tip"] is None or fixture["tip"]["probability"] >= 0.55


def test_daily_selection_returns_a_shortlist_with_full_analysis(client, card, trained_models) -> None:
    body = client.get("/football/daily-selection").json()

    assert body["considered"] >= body["analysed"] >= body["selected"]
    assert 1 <= body["selected"] <= DAILY_MAXIMUM

    for entry in body["matches"]:
        assert entry["recommendation"]["selection"]
        assert entry["markets"], "each selected fixture carries its full market breakdown"
        assert "head_to_head" in entry
        assert "form" in entry
        assert entry["expected_goals"]["total"] > 0


def test_daily_selection_honours_the_limit(client, card, trained_models) -> None:
    assert len(client.get("/football/daily-selection?limit=2").json()["matches"]) <= 2


def test_daily_selection_rejects_a_limit_beyond_the_cap(client, trained_models) -> None:
    assert client.get(f"/football/daily-selection?limit={DAILY_MAXIMUM + 1}").status_code == 422


def test_daily_selection_excludes_teams_without_history(client, card, trained_models) -> None:
    body = client.get("/football/daily-selection?limit=10").json()
    assert 6999 not in {m["fixture_id"] for m in body["matches"]}
