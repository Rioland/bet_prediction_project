"""Insert demo leagues, teams, standings, matches, and predictions when empty."""

from datetime import date, datetime

from sqlalchemy import func, select

from app.db.session import SessionLocal
import app.models.entities  # noqa: F401  (ensure all models are registered)
from app.models.entities import League, Match, Standing, Team
from app.services.prediction_service import generate_and_store

LOGO = "https://media.api-sports.io/football"


def seed_if_empty() -> int:
    db = SessionLocal()
    try:
        count = db.scalar(select(func.count()).select_from(Match)) or 0
        if count > 0:
            return 0

        league = League(
            id=1,
            external_id=39,
            name="Premier League",
            country="England",
            logo_url=f"{LOGO}/leagues/39.png",
        )
        teams = [
            Team(id=1, external_id=33, name="Manchester United", logo_url=f"{LOGO}/teams/33.png"),
            Team(id=2, external_id=40, name="Liverpool", logo_url=f"{LOGO}/teams/40.png"),
            Team(id=3, external_id=49, name="Chelsea", logo_url=f"{LOGO}/teams/49.png"),
            Team(id=4, external_id=50, name="Manchester City", logo_url=f"{LOGO}/teams/50.png"),
        ]
        db.add(league)
        db.add_all(teams)
        db.flush()

        # Standings drive the prediction engine.
        standings = [
            Standing(league_id=1, team_id=4, season=2025, rank=1, points=70, played=30, goals_for=78, goals_against=28, form="WWWDW"),
            Standing(league_id=1, team_id=2, season=2025, rank=2, points=66, played=30, goals_for=72, goals_against=33, form="WWDWW"),
            Standing(league_id=1, team_id=3, season=2025, rank=4, points=55, played=30, goals_for=58, goals_against=40, form="WDLWD"),
            Standing(league_id=1, team_id=1, season=2025, rank=6, points=48, played=30, goals_for=50, goals_against=45, form="LWDLW"),
        ]
        db.add_all(standings)
        db.flush()

        today = date.today()
        matches = [
            Match(league_id=1, home_team_id=1, away_team_id=2,
                  kickoff_time=datetime(today.year, today.month, today.day, 15, 0), status="scheduled"),
            Match(league_id=1, home_team_id=3, away_team_id=4,
                  kickoff_time=datetime(today.year, today.month, today.day, 17, 30), status="live",
                  home_score=1, away_score=1, elapsed=58),
            Match(league_id=1, home_team_id=2, away_team_id=3,
                  kickoff_time=datetime(today.year, today.month, today.day, 20, 0), status="scheduled"),
        ]
        db.add_all(matches)
        db.commit()

        for match in matches:
            generate_and_store(db, match)

        return len(matches)
    finally:
        db.close()


if __name__ == "__main__":
    created = seed_if_empty()
    print(f"Seeded {created} demo matches" if created else "Database already has matches")
