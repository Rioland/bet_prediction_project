"""
Football data layer — football-data.org v4 API.

Falls back to realistic generated fixtures when the API key is absent
or the API returns no matches (e.g. off-season / summer break).
"""

import random
import time
from datetime import date, datetime, timezone
from typing import Any

import httpx

from app.config import FOOTBALL_API_KEY, FOOTBALL_API_BASE
from app.predictions import predict_from_strengths

# ── League / competition metadata ────────────────────────────────────────────

LEAGUES = [
    {"id": 2021, "name": "Premier League",       "country": "England", "logo": "https://crests.football-data.org/PL.png",  "season": 2024},
    {"id": 2014, "name": "La Liga",              "country": "Spain",   "logo": "https://crests.football-data.org/PD.png",  "season": 2024},
    {"id": 2002, "name": "Bundesliga",           "country": "Germany", "logo": "https://crests.football-data.org/BL1.png", "season": 2024},
    {"id": 2019, "name": "Serie A",              "country": "Italy",   "logo": "https://crests.football-data.org/SA.png",  "season": 2024},
    {"id": 2015, "name": "Ligue 1",              "country": "France",  "logo": "https://crests.football-data.org/FL1.png", "season": 2024},
    {"id": 2001, "name": "UEFA Champions League","country": "Europe",  "logo": "https://crests.football-data.org/CL.png",  "season": 2024},
]

# Map competition ID → league entry for quick lookup
_LEAGUE_MAP = {l["id"]: l for l in LEAGUES}

# ── Mock team data (fallback) ────────────────────────────────────────────────

TEAMS_BY_LEAGUE: dict[int, list[dict]] = {
    2021: [  # Premier League
        {"id": 57,  "name": "Arsenal",          "logo": "https://crests.football-data.org/57.png",  "attack": 1.28, "defense": 0.80},
        {"id": 64,  "name": "Liverpool",        "logo": "https://crests.football-data.org/64.png",  "attack": 1.35, "defense": 0.78},
        {"id": 65,  "name": "Manchester City",  "logo": "https://crests.football-data.org/65.png",  "attack": 1.42, "defense": 0.72},
        {"id": 66,  "name": "Manchester Utd",  "logo": "https://crests.football-data.org/66.png",  "attack": 1.12, "defense": 0.95},
        {"id": 73,  "name": "Tottenham",        "logo": "https://crests.football-data.org/73.png",  "attack": 1.15, "defense": 0.98},
        {"id": 397, "name": "Aston Villa",      "logo": "https://crests.football-data.org/397.png", "attack": 1.10, "defense": 0.90},
        {"id": 67,  "name": "Newcastle Utd",   "logo": "https://crests.football-data.org/67.png",  "attack": 1.05, "defense": 0.88},
        {"id": 61,  "name": "Chelsea",          "logo": "https://crests.football-data.org/61.png",  "attack": 1.08, "defense": 0.92},
    ],
    2014: [  # La Liga
        {"id": 86,  "name": "Real Madrid",     "logo": "https://crests.football-data.org/86.png",  "attack": 1.48, "defense": 0.70},
        {"id": 81,  "name": "Barcelona",       "logo": "https://crests.football-data.org/81.png",  "attack": 1.38, "defense": 0.78},
        {"id": 78,  "name": "Atlético Madrid", "logo": "https://crests.football-data.org/78.png",  "attack": 1.12, "defense": 0.72},
        {"id": 94,  "name": "Valencia",        "logo": "https://crests.football-data.org/94.png",  "attack": 0.95, "defense": 1.02},
        {"id": 90,  "name": "Real Betis",      "logo": "https://crests.football-data.org/90.png",  "attack": 1.05, "defense": 0.95},
        {"id": 92,  "name": "Real Sociedad",   "logo": "https://crests.football-data.org/92.png",  "attack": 1.08, "defense": 0.90},
    ],
    2002: [  # Bundesliga
        {"id": 5,   "name": "Bayern München",   "logo": "https://crests.football-data.org/5.png",   "attack": 1.50, "defense": 0.68},
        {"id": 4,   "name": "Borussia Dortmund","logo": "https://crests.football-data.org/4.png",   "attack": 1.25, "defense": 0.85},
        {"id": 3,   "name": "Bayer Leverkusen", "logo": "https://crests.football-data.org/3.png",   "attack": 1.30, "defense": 0.75},
        {"id": 721, "name": "RB Leipzig",       "logo": "https://crests.football-data.org/721.png", "attack": 1.18, "defense": 0.82},
        {"id": 19,  "name": "Eintracht Frankfurt","logo":"https://crests.football-data.org/19.png", "attack": 1.05, "defense": 0.92},
        {"id": 11,  "name": "Wolfsburg",        "logo": "https://crests.football-data.org/11.png",  "attack": 0.95, "defense": 0.98},
    ],
    2019: [  # Serie A
        {"id": 109, "name": "Juventus", "logo": "https://crests.football-data.org/109.png", "attack": 1.15, "defense": 0.80},
        {"id": 98,  "name": "AC Milan", "logo": "https://crests.football-data.org/98.png",  "attack": 1.20, "defense": 0.82},
        {"id": 108, "name": "Inter",    "logo": "https://crests.football-data.org/108.png", "attack": 1.32, "defense": 0.75},
        {"id": 100, "name": "AS Roma",  "logo": "https://crests.football-data.org/100.png", "attack": 1.10, "defense": 0.90},
        {"id": 113, "name": "Napoli",   "logo": "https://crests.football-data.org/113.png", "attack": 1.28, "defense": 0.78},
        {"id": 110, "name": "Lazio",    "logo": "https://crests.football-data.org/110.png", "attack": 1.08, "defense": 0.88},
    ],
    2015: [  # Ligue 1
        {"id": 524, "name": "Paris Saint-Germain","logo": "https://crests.football-data.org/524.png", "attack": 1.55, "defense": 0.65},
        {"id": 516, "name": "Marseille",          "logo": "https://crests.football-data.org/516.png", "attack": 1.10, "defense": 0.90},
        {"id": 523, "name": "Lyon",               "logo": "https://crests.football-data.org/523.png", "attack": 1.08, "defense": 0.92},
        {"id": 548, "name": "Monaco",             "logo": "https://crests.football-data.org/548.png", "attack": 1.15, "defense": 0.85},
        {"id": 511, "name": "Rennes",             "logo": "https://crests.football-data.org/511.png", "attack": 0.98, "defense": 0.95},
        {"id": 512, "name": "Nantes",             "logo": "https://crests.football-data.org/512.png", "attack": 0.90, "defense": 1.02},
    ],
    2001: [  # Champions League
        {"id": 65,  "name": "Manchester City",  "logo": "https://crests.football-data.org/65.png",  "attack": 1.42, "defense": 0.72},
        {"id": 86,  "name": "Real Madrid",      "logo": "https://crests.football-data.org/86.png",  "attack": 1.48, "defense": 0.70},
        {"id": 5,   "name": "Bayern München",   "logo": "https://crests.football-data.org/5.png",   "attack": 1.50, "defense": 0.68},
        {"id": 81,  "name": "Barcelona",        "logo": "https://crests.football-data.org/81.png",  "attack": 1.38, "defense": 0.78},
        {"id": 108, "name": "Inter",            "logo": "https://crests.football-data.org/108.png", "attack": 1.32, "defense": 0.75},
        {"id": 64,  "name": "Liverpool",        "logo": "https://crests.football-data.org/64.png",  "attack": 1.35, "defense": 0.78},
    ],
}

KICKOFF_SLOTS = ["12:30", "14:00", "14:00", "16:30", "17:00", "19:00", "19:45", "20:00"]

# ── Status mapping ────────────────────────────────────────────────────────────

# football-data.org status → our internal short code
_STATUS_MAP = {
    "SCHEDULED":  "NS",
    "TIMED":      "NS",
    "IN_PLAY":    "1H",
    "PAUSED":     "HT",
    "EXTRA_TIME": "ET",
    "PENALTY_SHOOTOUT": "P",
    "FINISHED":   "FT",
    "SUSPENDED":  "SUSP",
    "POSTPONED":  "PST",
    "CANCELLED":  "CANC",
    "AWARDED":    "FT",
}

LIVE_STATUSES = {"1H", "HT", "ET", "P", "LIVE", "2H", "BT"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _strength_from_id(team_id: int | None, seed: str) -> tuple[float, float]:
    rng = random.Random(f"{seed}:{team_id}")
    return round(rng.uniform(0.85, 1.35), 3), round(rng.uniform(0.75, 1.15), 3)


def _mock_fixtures(on_date: date) -> list[dict]:
    """Deterministic fake fixtures for `on_date`."""
    rng = random.Random(on_date.isoformat())
    fixtures = []
    fixture_id = int(on_date.strftime("%Y%m%d")) * 100

    league_ids = rng.sample(list(TEAMS_BY_LEAGUE.keys()), k=min(4, len(TEAMS_BY_LEAGUE)))
    slot_idx = 0
    for lid in league_ids:
        league = _LEAGUE_MAP[lid]
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
            ko_dt = datetime.strptime(
                f"{on_date.isoformat()} {ko_time}", "%Y-%m-%d %H:%M"
            ).replace(tzinfo=timezone.utc)
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


def _parse_fd_matches(raw: dict) -> list[dict]:
    """Convert a football-data.org /matches response to our internal format."""
    results = []
    for item in raw.get("matches", []):
        comp   = item.get("competition", {})
        home_t = item.get("homeTeam", {})
        away_t = item.get("awayTeam", {})
        score  = item.get("score", {})
        ft     = score.get("fullTime", {})

        raw_status = item.get("status", "SCHEDULED")
        status = _STATUS_MAP.get(raw_status, "NS")

        comp_id = comp.get("id", 0)
        league = _LEAGUE_MAP.get(comp_id, {})

        home_attack, home_defense = _strength_from_id(home_t.get("id"), "home")
        away_attack, away_defense = _strength_from_id(away_t.get("id"), "away")

        results.append({
            "fixture_id":     item.get("id"),
            "league_id":      comp_id,
            "league_name":    comp.get("name", league.get("name", "")),
            "league_logo":    comp.get("emblem") or league.get("logo", ""),
            "league_country": comp.get("area", {}).get("name", league.get("country", "")),
            "home_team":      home_t.get("name", home_t.get("shortName", "")),
            "home_logo":      home_t.get("crest", ""),
            "away_team":      away_t.get("name", away_t.get("shortName", "")),
            "away_logo":      away_t.get("crest", ""),
            "kickoff":        item.get("utcDate", ""),
            "status":         status,
            "home_score":     ft.get("home"),
            "away_score":     ft.get("away"),
            "_home_attack":   home_attack,
            "_home_defense":  home_defense,
            "_away_attack":   away_attack,
            "_away_defense":  away_defense,
        })
    return results


def _enrich_with_predictions(fixtures: list[dict]) -> list[dict]:
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


def _api_headers() -> dict:
    return {"X-Auth-Token": FOOTBALL_API_KEY}


# ── Public API ────────────────────────────────────────────────────────────────

def get_leagues() -> list[dict]:
    return LEAGUES


def get_today_fixtures() -> list[dict]:
    """Return today's fixtures enriched with Poisson predictions."""
    today = date.today()

    fixtures: list[dict] = []
    if FOOTBALL_API_KEY:
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(
                    f"{FOOTBALL_API_BASE}/matches",
                    headers=_api_headers(),
                    params={"dateFrom": today.isoformat(), "dateTo": today.isoformat()},
                )
                resp.raise_for_status()
                fixtures = _parse_fd_matches(resp.json())
        except Exception:
            fixtures = []

    # Fall back to mock data when API is absent or returns nothing (off-season)
    if not fixtures:
        fixtures = _mock_fixtures(today)

    return _enrich_with_predictions(fixtures)


# ── Live matches (short-lived cache) ─────────────────────────────────────────

_live_cache: list[dict] = []
_live_cache_ts: float = 0.0
_LIVE_TTL = 60  # seconds


def get_live_fixtures() -> list[dict]:
    """
    Return currently live matches, refreshed at most every 60 seconds.
    Uses the football-data.org /matches?status=LIVE endpoint when a key
    is available; otherwise filters today's cached fixtures by status.
    """
    global _live_cache, _live_cache_ts

    now = time.monotonic()
    if now - _live_cache_ts < _LIVE_TTL:
        return _live_cache

    live: list[dict] = []
    if FOOTBALL_API_KEY:
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{FOOTBALL_API_BASE}/matches",
                    headers=_api_headers(),
                    params={"status": "LIVE"},
                )
                resp.raise_for_status()
                raw_fixtures = _parse_fd_matches(resp.json())
                live = _enrich_with_predictions(raw_fixtures)
        except Exception:
            live = []

    _live_cache = live
    _live_cache_ts = now
    return live
