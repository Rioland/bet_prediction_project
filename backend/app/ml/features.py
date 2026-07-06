"""Shared ML feature definitions (no heavy imports so inference stays light)."""

FEATURE_COLUMNS = [
    "home_form",
    "away_form",
    "h2h_home_wins",
    "h2h_draws",
    "h2h_away_wins",
    "home_goals_scored_avg",
    "away_goals_scored_avg",
    "home_goals_conceded_avg",
    "away_goals_conceded_avg",
    "home_league_position",
    "away_league_position",
    "home_xg",
    "away_xg",
    "home_possession",
    "away_possession",
    "home_shots_on_target",
    "away_shots_on_target",
]
