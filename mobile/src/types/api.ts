export type Match = {
  id: number;
  league_id: number;
  home_team_id: number;
  away_team_id: number;
  home_team_name?: string | null;
  away_team_name?: string | null;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
  league_name?: string | null;
  league_logo?: string | null;
  kickoff_time: string;
  status: string;
  home_score?: number | null;
  away_score?: number | null;
  elapsed?: number | null;
};

export type PredictionCard = {
  match: Match;
  winner_label: string;
  winner_confidence: number;
  winner_probabilities: Record<string, number>;
  over_under: { over: number; under: number };
  btts: { yes: number; no: number };
  correct_score: { score: string; probability: number };
  home_xg?: number | null;
  away_xg?: number | null;
};

export type MatchPrediction = {
  match_id: number;
  home_xg: number;
  away_xg: number;
  winner: { label: string; probabilities: Record<string, number>; confidence: number };
  over_under_2_5: { over: number; under: number };
  btts: { yes: number; no: number };
  correct_score: { score: string; probability: number };
};

export function winnerText(label: string): string {
  switch (label) {
    case "home_win":
      return "Home Win";
    case "away_win":
      return "Away Win";
    case "draw":
      return "Draw";
    default:
      return label;
  }
}

export function teamName(match: Match, side: "home" | "away"): string {
  if (side === "home") return match.home_team_name ?? `Team ${match.home_team_id}`;
  return match.away_team_name ?? `Team ${match.away_team_id}`;
}

export function kickoffTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
