/**
 * Client for the prediction API.
 *
 * The generated @workspace/api-client-react covers the original openapi.yaml
 * surface; these are the endpoints added since (tips, verified results, news),
 * typed by hand so the app does not depend on a regeneration step.
 */

const BASE = import.meta.env.VITE_API_BASE ?? "";

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    ...init,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new ApiError(response.status, detail?.detail ?? response.statusText);
  }
  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Market =
  | "popular" | "banker" | "2_odds" | "home_win" | "away_win" | "draws"
  | "double_chance" | "btts" | "over_1_5" | "over_2_5" | "under_3_5" | "acca";

export const MARKET_LABELS: Record<Market, string> = {
  popular: "Popular",
  banker: "Banker",
  "2_odds": "2 Odds",
  home_win: "Home Win",
  away_win: "Away Win",
  draws: "Draws",
  double_chance: "Double Chance",
  btts: "BTTS",
  over_1_5: "Over 1.5",
  over_2_5: "Over 2.5",
  under_3_5: "Under 3.5",
  acca: "ACCA",
};

export interface Tip {
  market: string;
  selection: string;
  label: string;
  /** Calibrated model probability, 0-1. */
  probability: number;
  odds: number;
  fair_odds: number;
  /** probability minus the odds-implied probability; >0 means value. */
  value: number;
  rationale: string;
  /** "model" for a trained target, "derived" for a Poisson inference. */
  source: "model" | "derived";
}

export interface TipCard {
  fixture_id: number;
  league_id: number;
  league_name: string;
  league_country?: string | null;
  home_team: string;
  home_logo?: string | null;
  away_team: string;
  away_logo?: string | null;
  kickoff: string;
  status: string;
  odds_home?: number | null;
  odds_draw?: number | null;
  odds_away?: number | null;
  tip: Tip | null;
  all_tips: Tip[];
}

export interface AccumulatorLeg {
  fixture_id: number;
  home_team: string;
  away_team: string;
  kickoff: string;
  selection: string;
  label: string;
  odds: number;
  probability: number;
}

export interface Accumulator {
  legs: AccumulatorLeg[];
  total_odds: number;
  /** Product of the legs - falls away fast as legs are added. */
  combined_probability: number;
  target_odds: number;
}

export interface TipsResponse {
  date: string;
  market: Market;
  matches: TipCard[];
  vip_locked: boolean;
  vip_count: number;
  vip_matches?: TipCard[];
  banker?: TipCard | null;
  accumulator?: Accumulator;
}

/** A prediction card as served by the daily-pick endpoints. */
export interface DailyPick {
  fixture_id: number;
  league_id: number;
  league_name: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  prediction: {
    predicted_winner: "home" | "draw" | "away";
    /** 0-1, like every other probability in this API. */
    confidence: number;
    home_win_prob: number;
    draw_prob: number;
    away_win_prob: number;
  };
}

export interface DailyPickResponse {
  pick_date: string;
  is_today: boolean;
  pick_count: number;
  picks: DailyPick[];
  reason?: string;
}

export interface Performance {
  settled: number;
  won: number;
  lost: number;
  strike_rate: number | null;
  roi_percent: number | null;
  profit_units: number;
  average_odds?: number;
  days: number;
  note?: string;
}

export interface SettledTip {
  match_id: number;
  home_team: string | null;
  away_team: string | null;
  kickoff: string;
  market: string;
  selection: string;
  odds: number;
  probability: number;
  result: "won" | "lost" | "void" | "pending";
  score: string | null;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_image?: string | null;
  author?: string | null;
  published_at?: string | null;
  body?: string;
}

export const api = {
  tips: (params: { date?: string; market?: Market; leagueId?: number }) => {
    const query = new URLSearchParams();
    if (params.date) query.set("date", params.date);
    if (params.market) query.set("market", params.market);
    if (params.leagueId) query.set("league_id", String(params.leagueId));
    return get<TipsResponse>(`/api/football/tips?${query}`);
  },
  vipTips: (params: { date?: string; market?: Market }) => {
    const query = new URLSearchParams();
    if (params.date) query.set("date", params.date);
    if (params.market) query.set("market", params.market);
    return get<{ date: string; matches: TipCard[] }>(`/api/football/vip/tips?${query}`);
  },
  performance: (days = 30) =>
    get<{ overall: Performance; by_market: (Performance & { market: string })[] }>(
      `/api/football/results/performance?days=${days}`,
    ),
  recentResults: (limit = 20) =>
    get<SettledTip[]>(`/api/football/results/recent?limit=${limit}`),
  dailyPick: () => get<DailyPickResponse>("/api/football/pick/today"),
  news: (limit = 10) => get<Article[]>(`/api/news?limit=${limit}`),
  article: (slug: string) => get<Article>(`/api/news/${slug}`),
};

/** Probabilities are 0-1 everywhere in this API. */
export const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`;

export const signed = (value: number | null | undefined, suffix = "") =>
  value === null || value === undefined
    ? "—"
    : `${value > 0 ? "+" : ""}${value.toFixed(2)}${suffix}`;
