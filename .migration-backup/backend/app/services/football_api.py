"""API-Football (api-sports.io) HTTP client.

Synchronous client so it can be used directly inside Celery tasks.
Docs: https://www.api-football.com/documentation-v3
"""

from datetime import date

import httpx

from app.core.config import settings


class FootballApiClient:
    def __init__(self) -> None:
        self.base_url = settings.football_api_base_url.rstrip("/")
        self.headers = {"x-apisports-key": settings.football_api_key}

    def _get(self, path: str, params: dict | None = None) -> dict:
        url = f"{self.base_url}/{path.lstrip('/')}"
        with httpx.Client(timeout=30) as client:
            response = client.get(url, headers=self.headers, params=params or {})
            response.raise_for_status()
            return response.json()

    def get_fixtures(self, on_date: date) -> dict:
        return self._get("fixtures", {"date": str(on_date)})

    def get_live(self) -> dict:
        return self._get("fixtures", {"live": "all"})

    def get_leagues(self, current: bool = True) -> dict:
        return self._get("leagues", {"current": "true" if current else "false"})

    def get_teams(self, league_id: int, season: int) -> dict:
        return self._get("teams", {"league": league_id, "season": season})

    def get_standings(self, league_id: int, season: int) -> dict:
        return self._get("standings", {"league": league_id, "season": season})

    def get_fixture_statistics(self, fixture_id: int) -> dict:
        return self._get("fixtures/statistics", {"fixture": fixture_id})

    def get_injuries(self, league_id: int, season: int) -> dict:
        return self._get("injuries", {"league": league_id, "season": season})

    def get_odds(self, fixture_id: int) -> dict:
        return self._get("odds", {"fixture": fixture_id})
