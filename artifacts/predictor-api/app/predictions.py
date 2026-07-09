"""
Poisson-distribution match prediction engine.

Given expected goals (xG) for each team, compute:
- P(home_win), P(draw), P(away_win)
- P(BTTS)
- P(over 2.5 goals)
- Most likely correct score
"""

import math
from typing import Dict, Any


MAX_GOALS = 8  # consider 0..7 goals per team


def _poisson(lam: float, k: int) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return (lam ** k) * math.exp(-lam) / math.factorial(k)


def _score_matrix(lam_h: float, lam_a: float) -> list[list[float]]:
    """Return MAX_GOALS × MAX_GOALS matrix of P(home=i, away=j)."""
    return [
        [_poisson(lam_h, i) * _poisson(lam_a, j) for j in range(MAX_GOALS)]
        for i in range(MAX_GOALS)
    ]


def predict(lam_home: float, lam_away: float) -> Dict[str, Any]:
    """Core prediction from two Poisson rates."""
    m = _score_matrix(lam_home, lam_away)

    home_win = sum(m[i][j] for i in range(MAX_GOALS) for j in range(i))
    draw     = sum(m[i][i] for i in range(MAX_GOALS))
    away_win = sum(m[i][j] for j in range(MAX_GOALS) for i in range(j))

    total = home_win + draw + away_win
    if total > 0:
        home_win /= total; draw /= total; away_win /= total

    btts = (1 - _poisson(lam_home, 0)) * (1 - _poisson(lam_away, 0))
    over25 = 1 - sum(m[i][j] for i in range(MAX_GOALS) for j in range(MAX_GOALS) if i + j <= 2)

    # Most likely score
    best_prob, best_h, best_a = 0.0, 1, 1
    for i in range(MAX_GOALS):
        for j in range(MAX_GOALS):
            if m[i][j] > best_prob:
                best_prob, best_h, best_a = m[i][j], i, j

    if home_win >= draw and home_win >= away_win:
        winner, confidence = "home", home_win
    elif away_win >= draw and away_win >= home_win:
        winner, confidence = "away", away_win
    else:
        winner, confidence = "draw", draw

    return {
        "home_win_prob": round(home_win, 3),
        "draw_prob": round(draw, 3),
        "away_win_prob": round(away_win, 3),
        "btts_prob": round(btts, 3),
        "over_25_prob": round(over25, 3),
        "predicted_winner": winner,
        "confidence": round(confidence, 3),
        "home_xg": round(lam_home, 2),
        "away_xg": round(lam_away, 2),
        "predicted_score": f"{best_h}-{best_a}",
    }


def predict_from_strengths(
    home_attack: float,
    home_defense: float,
    away_attack: float,
    away_defense: float,
    league_home_avg: float = 1.45,
    league_away_avg: float = 1.10,
) -> Dict[str, Any]:
    """
    Dixon-Coles-style prediction.
    attack/defense are relative multipliers (1.0 = average).
    defense < 1.0 means strong defense (concedes less).
    """
    HOME_ADV = 1.12
    lam_h = league_home_avg * home_attack * away_defense * HOME_ADV
    lam_a = league_away_avg * away_attack * home_defense
    return predict(lam_h, lam_a)
