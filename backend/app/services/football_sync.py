"""Maps API-Football payloads into our database (idempotent upserts)."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import League, Match, Standing, Team
from app.services.football_api import FootballApiClient

_FINISHED = {"FT", "AET", "PEN"}
_LIVE = {"1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"}


def _map_status(short: str | None) -> str:
    if short in _FINISHED:
        return "finished"
    if short in _LIVE:
        return "live"
    return "scheduled"


def _parse_dt(value: str | None) -> datetime:
    if not value:
        return datetime.utcnow()
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)


def upsert_league(db: Session, payload: dict) -> League:
    ext = payload.get("id")
    league = db.scalar(select(League).where(League.external_id == ext)) if ext else None
    if not league:
        league = League(external_id=ext)
        db.add(league)
    league.name = payload.get("name", league.name or "Unknown")
    league.country = payload.get("country")
    league.logo_url = payload.get("logo")
    db.flush()
    return league


def upsert_team(db: Session, payload: dict) -> Team:
    ext = payload.get("id")
    team = db.scalar(select(Team).where(Team.external_id == ext)) if ext else None
    if not team:
        team = Team(external_id=ext)
        db.add(team)
    team.name = payload.get("name", team.name or "Unknown")
    team.logo_url = payload.get("logo")
    db.flush()
    return team


def upsert_fixture(db: Session, item: dict) -> Match:
    fixture = item.get("fixture", {})
    ext = fixture.get("id")
    league = upsert_league(db, item.get("league", {}))
    home = upsert_team(db, item.get("teams", {}).get("home", {}))
    away = upsert_team(db, item.get("teams", {}).get("away", {}))

    match = db.scalar(select(Match).where(Match.external_id == ext)) if ext else None
    if not match:
        match = Match(external_id=ext)
        db.add(match)
    match.league_id = league.id
    match.home_team_id = home.id
    match.away_team_id = away.id
    match.kickoff_time = _parse_dt(fixture.get("date"))
    status = fixture.get("status", {})
    match.status = _map_status(status.get("short"))
    match.elapsed = status.get("elapsed")
    goals = item.get("goals", {})
    match.home_score = goals.get("home")
    match.away_score = goals.get("away")
    db.flush()
    return match


def sync_fixtures_for_date(db: Session, on_date: date | None = None) -> int:
    client = FootballApiClient()
    data = client.get_fixtures(on_date or date.today())
    items = data.get("response", [])
    for item in items:
        upsert_fixture(db, item)
    db.commit()
    return len(items)


def sync_live(db: Session) -> int:
    client = FootballApiClient()
    data = client.get_live()
    items = data.get("response", [])
    for item in items:
        upsert_fixture(db, item)
    db.commit()
    return len(items)


def sync_standings(db: Session, league_id: int, season: int) -> int:
    client = FootballApiClient()
    data = client.get_standings(league_id, season)
    response = data.get("response", [])
    if not response:
        return 0
    league_payload = response[0].get("league", {})
    league = upsert_league(db, league_payload)
    tables = league_payload.get("standings", [])
    count = 0
    for table in tables:
        for row in table:
            team = upsert_team(db, row.get("team", {}))
            existing = db.scalar(
                select(Standing).where(
                    Standing.league_id == league.id,
                    Standing.team_id == team.id,
                    Standing.season == season,
                )
            )
            if not existing:
                existing = Standing(league_id=league.id, team_id=team.id, season=season)
                db.add(existing)
            stats = row.get("all", {})
            goals = stats.get("goals", {})
            existing.rank = row.get("rank", 0)
            existing.points = row.get("points", 0)
            existing.played = stats.get("played", 0)
            existing.goals_for = goals.get("for", 0)
            existing.goals_against = goals.get("against", 0)
            existing.form = row.get("form")
            count += 1
    db.commit()
    return count
