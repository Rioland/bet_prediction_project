"""
Football data layer.

Tries the api-sports.io API first (if FOOTBALL_API_KEY is set),
then falls back to realistic generated fixtures so the app always works.
"""

import random
from datetime import date, datetime, timezone
from typing import Any

import httpx

from app.config import FOOTBALL_API_KEY, FOOTBALL_API_BASE
from app.predictions import predict_from_strengths

# ── Mock league / team data ──────────────────────────────────────────────────

LEAGUES = [
    {"id": 39,  "name": "Premier League",  "country": "England",  "logo": "https://media.api-sports.io/football/leagues/39.png",  "season": 2024},
    {"id": 140, "name": "La Liga",          "country": "Spain",    "logo": "https://media.api-sports.io/football/leagues/140.png", "season": 2024},
    {"id": 78,  "name": "Bundesliga",       "country": "Germany",  "logo": "https://media.api-sports.io/football/leagues/78.png",  "season": 2024},
    {"id": 135, "name": "Serie A",          "country": "Italy",    "logo": "https://media.api-sports.io/football/leagues/135.png", "season": 2024},
    {"id": 61,  "name": "Ligue 1",          "country": "France",   "logo": "https://media.api-sports.io/football/leagues/61.png",  "season": 2024},
    {"id": 2,   "name": "UEFA Champions League", "country": "Europe", "logo": "https://media.api-sports.io/football/leagues/2.png", "season": 2024},
]

TEAMS_BY_LEAGUE: dict[int, list[dict]] = {
    39: [  # Premier League
        {"id": 33, "name": "Manchester United", "logo": "https://media.api-sports.io/football/teams/33.png",  "attack": 1.12, "defense": 0.95},
        {"id": 40, "name": "Liverpool",          "logo": "https://media.api-sports.io/football/teams/40.png",  "attack": 1.35, "defense": 0.78},
        {"id": 49, "name": "Chelsea",            "logo": "https://media.api-sports.io/football/teams/49.png",  "attack": 1.08, "defense": 0.92},
        {"id": 50, "name": "Manchester City",    "logo": "https://media.api-sports.io/football/teams/50.png",  "attack": 1.42, "defense": 0.72},
        {"id": 42, "name": "Arsenal",            "logo": "https://media.api-sports.io/football/teams/42.png",  "attack": 1.28, "defense": 0.80},
        {"id": 47, "name": "Tottenham",          "logo": "https://media.api-sports.io/football/teams/47.png",  "attack": 1.15, "defense": 0.98},
        {"id": 66, "name": "Aston Villa",        "logo": "https://media.api-sports.io/football/teams/66.png",  "attack": 1.10, "defense": 0.90},
        {"id": 34, "name": "Newcastle United",   "logo": "https://media.api-sports.io/football/teams/34.png",  "attack": 1.05, "defense": 0.88},
    ],
    140: [  # La Liga
        {"id": 541, "name": "Real Madrid",    "logo": "https://media.api-sports.io/football/teams/541.png", "attack": 1.48, "defense": 0.70},
        {"id": 529, "name": "Barcelona",      "logo": "https://media.api-sports.io/football/teams/529.png", "attack": 1.38, "defense": 0.78},
        {"id": 530, "name": "Atlético Madrid","logo": "https://media.api-sports.io/football/teams/530.png", "attack": 1.12, "defense": 0.72},
        {"id": 532, "name": "Valencia",       "logo": "https://media.api-sports.io/football/teams/532.png", "attack": 0.95, "defense": 1.02},
        {"id": 543, "name": "Real Betis",     "logo": "https://media.api-sports.io/football/teams/543.png", "attack": 1.05, "defense": 0.95},
        {"id": 548, "name": "Real Sociedad",  "logo": "https://media.api-sports.io/football/teams/548.png", "attack": 1.08, "defense": 0.90},
    ],
    78: [  # Bundesliga
        {"id": 157, "name": "Bayern München",  "logo": "https://media.api-sports.io/football/teams/157.png", "attack": 1.50, "defense": 0.68},
        {"id": 165, "name": "Borussia Dortmund","logo": "https://media.api-sports.io/football/teams/165.png","attack": 1.25, "defense": 0.85},
        {"id": 168, "name": "Bayer Leverkusen","logo": "https://media.api-sports.io/football/teams/168.png", "attack": 1.30, "defense": 0.75},
        {"id": 173, "name": "RB Leipzig",      "logo": "https://media.api-sports.io/football/teams/173.png", "attack": 1.18, "defense": 0.82},
        {"id": 169, "name": "Eintracht Frankfurt","logo": "https://media.api-sports.io/football/teams/169.png","attack": 1.05,"defense": 0.92},
        {"id": 163, "name": "Wolfsburg",       "logo": "https://media.api-sports.io/football/teams/163.png", "attack": 0.95, "defense": 0.98},
    ],
    135: [  # Serie A
        {"id": 496, "name": "Juventus",   "logo": "https://media.api-sports.io/football/teams/496.png", "attack": 1.15, "defense": 0.80},
        {"id": 489, "name": "AC Milan",   "logo": "https://media.api-sports.io/football/teams/489.png", "attack": 1.20, "defense": 0.82},
        {"id": 505, "name": "Inter",      "logo": "https://media.api-sports.io/football/teams/505.png", "attack": 1.32, "defense": 0.75},
        {"id": 497, "name": "AS Roma",    "logo": "https://media.api-sports.io/football/teams/497.png", "attack": 1.10, "defense": 0.90},
        {"id": 492, "name": "Napoli",     "logo": "https://media.api-sports.io/football/teams/492.png", "attack": 1.28, "defense": 0.78},
        {"id": 487, "name": "Lazio",      "logo": "https://media.api-sports.io/football/teams/487.png", "attack": 1.08, "defense": 0.88},
    ],
    61: [  # Ligue 1
        {"id": 85,  "name": "Paris Saint-Germain","logo": "https://media.api-sports.io/football/teams/85.png",  "attack": 1.55, "defense": 0.65},
        {"id": 81,  "name": "Marseille",           "logo": "https://media.api-sports.io/football/teams/81.png",  "attack": 1.10, "defense": 0.90},
        {"id": 80,  "name": "Lyon",                "logo": "https://media.api-sports.io/football/teams/80.png",  "attack": 1.08, "defense": 0.92},
        {"id": 91,  "name": "Monaco",              "logo": "https://media.api-sports.io/football/teams/91.png",  "attack": 1.15, "defense": 0.85},
        {"id": 94,  "name": "Rennes",              "logo": "https://media.api-sports.io/football/teams/94.png",  "attack": 0.98, "defense": 0.95},
        {"id": 93,  "name": "Nantes",              "logo": "https://media.api-sports.io/football/teams/93.png",  "attack": 0.90, "defense": 1.02},
    ],
    2: [  # UCL — cross-league selection
        {"id": 50,  "name": "Manchester City",    "logo": "https://media.api-sports.io/football/teams/50.png",  "attack": 1.42, "defense": 0.72},
        {"id": 541, "name": "Real Madrid",        "logo": "https://media.api-sports.io/football/teams/541.png", "attack": 1.48, "defense": 0.70},
        {"id": 157, "name": "Bayern München",     "logo": "https://media.api-sports.io/football/teams/157.png", "attack": 1.50, "defense": 0.68},
        {"id": 529, "name": "Barcelona",          "logo": "https://media.api-sports.io/football/teams/529.png", "attack": 1.38, "defense": 0.78},
        {"id": 505, "name": "Inter",              "logo": "https://media.api-sports.io/football/teams/505.png", "attack": 1.32, "defense": 0.75},
        {"id": 40,  "name": "Liverpool",          "logo": "https://media.api-sports.io/football/teams/40.png",  "attack": 1.35, "defense": 0.78},
        {"id": 42,  "name": "Arsenal",            "logo": "https://media.api-sports.io/football/teams/42.png",  "attack": 1.28, "defense": 0.80},
        {"id": 492, "name": "Napoli",             "logo": "https://media.api-sports.io/football/teams/492.png", "attack": 1.28, "defense": 0.78},
    ],
}

# Kick-off times (UTC) spread across the day
KICKOFF_SLOTS = ["12:30", "14:00", "14:00", "16:30", "17:00", "19:00", "19:45", "20:00"]


def _mock_fixtures(on_date: date) -> list[dict]:
    """Generate deterministic fake fixtures for `on_date`."""
    rng = random.Random(on_date.isoformat())
    fixtures = []
    fixture_id = int(on_date.strftime("%Y%m%d")) * 100

    # Pick 2-4 leagues and generate 2-3 matches per league
    league_ids = rng.sample(list(TEAMS_BY_LEAGUE.keys()), k=min(4, len(TEAMS_BY_LEAGUE)))
    slot_idx = 0
    for lid in league_ids:
        league = next(l for l in LEAGUES if l["id"] == lid)
        teams = TEAMS_BY_LEAGUE[lid]
        pairs = list(range(len(teams)))
        rng.shuffle(pairs)
        n_matches = rng.randint(2, min(3, len(teams) // 2))
        for m in range(n_matches):
            if slot_idx >= len(KICKOFF_SLOTS):
                break
            home = teams[pairs[m * 2 % len(teams)]]
            away = teams[pairs[(m * 2 + 1) % len(teams)]]
            if home["id"] == away["id"]:
                continue
            ko_time = KICKOFF_SLOTS[slot_idx % len(KICKOFF_SLOTS)]
            ko_dt = datetime.strptime(f"{on_date.isoformat()} {ko_time}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            fixtures.append({
                "fixture_id": fixture_id + m + lid,
                "league_id": league["id"],
                "league_name": league["name"],
                "league_logo": league["logo"],
                "league_country": league["country"],
                "home_team": home["name"],
                "home_logo": home["logo"],
                "away_team": away["name"],
                "away_logo": away["logo"],
                "kickoff": ko_dt.isoformat(),
                "status": "NS",
                "home_score": None,
                "away_score": None,
                "_home_attack": home["attack"],
                "_home_defense": home["defense"],
                "_away_attack": away["attack"],
                "_away_defense": away["defense"],
            })
            slot_idx += 1
    return fixtures


def _strength_from_id(team_id: int | None, seed: str) -> tuple[float, float]:
    """
    Derive a deterministic pseudo attack/defense strength for a team we have
    no real stats for (used when fixtures come from the live API, which
    doesn't include form/standings in the /fixtures response).
    Keeps predictions varied instead of collapsing to a flat 50/50 for every
    unknown team, while staying honest that this is an estimate, not a fact.
    """
    rng = random.Random(f"{seed}:{team_id}")
    attack = round(rng.uniform(0.85, 1.35), 3)
    defense = round(rng.uniform(0.75, 1.15), 3)
    return attack, defense


def _parse_api_fixtures(raw: dict) -> list[dict]:
    """Convert api-sports.io response to our standard format."""
    results = []
    for item in raw.get("response", []):
        f = item.get("fixture", {})
        league = item.get("league", {})
        teams = item.get("teams", {})
        goals = item.get("goals", {})
        home_t = teams.get("home", {})
        away_t = teams.get("away", {})

        home_attack, home_defense = _strength_from_id(home_t.get("id"), "home")
        away_attack, away_defense = _strength_from_id(away_t.get("id"), "away")

        results.append({
            "fixture_id": f.get("id"),
            "league_id": league.get("id"),
            "league_name": league.get("name", ""),
            "league_logo": league.get("logo", ""),
            "league_country": league.get("country", ""),
            "home_team": home_t.get("name", ""),
            "home_logo": home_t.get("logo", ""),
            "away_team": away_t.get("name", ""),
            "away_logo": away_t.get("logo", ""),
            "kickoff": f.get("date", ""),
            "status": f.get("status", {}).get("short", "NS"),
            "home_score": goals.get("home"),
            "away_score": goals.get("away"),
            "_home_attack": home_attack, "_home_defense": home_defense,
            "_away_attack": away_attack, "_away_defense": away_defense,
        })
    return results


def get_today_fixtures() -> list[dict]:
    """Return today's fixtures, enriched with predictions."""
    today = date.today()

    if FOOTBALL_API_KEY:
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(
                    f"{FOOTBALL_API_BASE}/fixtures",
                    headers={"x-apisports-key": FOOTBALL_API_KEY},
                    params={"date": today.isoformat()},
                )
                resp.raise_for_status()
                fixtures = _parse_api_fixtures(resp.json())
        except Exception:
            fixtures = _mock_fixtures(today)
    else:
        fixtures = _mock_fixtures(today)

    # Attach predictions
    enriched = []
    for fx in fixtures:
        pred = predict_from_strengths(
            home_attack=fx.pop("_home_attack", 1.0),
            home_defense=fx.pop("_home_defense", 1.0),
            away_attack=fx.pop("_away_attack", 1.0),
            away_defense=fx.pop("_away_defense", 1.0),
        )
        enriched.append({**fx, "prediction": pred})

    return enriched


def get_leagues() -> list[dict]:
    return LEAGUES
