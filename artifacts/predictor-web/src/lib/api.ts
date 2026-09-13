/**
 * Client for the prediction API.
 *
 * The generated @workspace/api-client-react covers the original openapi.yaml
 * surface; these are the endpoints added since (tips, verified results, news),
 * typed by hand so the app does not depend on a regeneration step.
 */

const BASE = import.meta.env.VITE_API_BASE ?? "";
const TOKEN_KEY = "session_access_token";

/**
 * The customer's access token.
 *
 * Kept in localStorage so a session survives a reload. That makes it readable
 * by any script on the page, so the site must not load untrusted third-party
 * scripts; the token is also short-lived and never grants admin access.
 */
export const session = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private browsing: the session lasts until the tab closes */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = session.get();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
  });

  if (response.status === 401 && token) {
    // An expired or revoked session: drop it rather than retrying forever.
    session.clear();
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const message = Array.isArray(detail?.detail)
      ? detail.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join("; ")
      : detail?.detail;
    throw new ApiError(response.status, message ?? response.statusText);
  }
  return response.json() as Promise<T>;
}

const get = <T,>(path: string) => request<T>(path);
const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

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
  | "double_chance" | "either_half" | "first_half" | "first_half_goals"
  | "handicap" | "btts" | "over_1_5" | "over_2_5" | "under_3_5" | "acca";

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
  either_half: "Either half",
  first_half: "1st half",
  first_half_goals: "1st half goals",
  handicap: "Handicap",
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

export interface RankedPick extends Tip {
  band: "strong" | "solid" | "slight" | "weak";
  note: string;
  why: string;
  basis?: "value" | "probability";
  loses_more_often_than_not?: boolean;
}

export interface HeadToHead {
  played: number;
  home_wins: number;
  draws: number;
  away_wins: number;
  avg_goals: number | null;
  btts_rate: number | null;
  fixtures: {
    kickoff: string;
    score: string;
    at_home: boolean;
    result_for_home_side: "home" | "draw" | "away";
  }[];
}

export interface FormSummary {
  points_per_game: number;
  goals_scored_avg: number;
  goals_conceded_avg: number;
  matches_played: number;
  rest_days: number;
}

export interface FixtureAnalysis {
  fixture_id: number;
  home_team: string;
  away_team: string;
  league_name: string | null;
  kickoff: string;
  /** Best pick among selections the model favours. */
  recommendation: RankedPick | null;
  /** Largest edge on the card, which may sit below the confidence floor. */
  value_pick: RankedPick | null;
  /** Markets a real bookmaker price existed for; edge is unmeasurable elsewhere. */
  priced_markets: string[];
  markets: Tip[];
  expected_goals: { home: number; away: number; total: number };
  goal_lines: { over_1_5: number; over_2_5: number; over_3_5: number };
  form: { home: FormSummary; away: FormSummary };
  head_to_head: HeadToHead;
}

/** Every fixture on a date, whether or not the model can speak to it. */
export interface FixtureListing {
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
  home_score: number | null;
  away_score: number | null;
  odds_home?: number | null;
  odds_draw?: number | null;
  odds_away?: number | null;
  tip: Tip | null;
  analysis_available: boolean;
  /** Why there is no tip: too little history, or nothing cleared the floor. */
  unavailable_reason: string | null;
}

export interface FixturesResponse {
  date: string;
  total: number;
  analysable: number;
  fixtures: FixtureListing[];
}

export interface DailySelectionResponse {
  date: string;
  /** How many days the selection had to span to fill the card. */
  days_covered: number;
  considered: number;
  analysed: number;
  selected: number;
  matches: FixtureAnalysis[];
}

export interface SlipLeg {
  fixture_id: number;
  home_team: string;
  away_team: string;
  league_name: string | null;
  kickoff: string;
  market: string;
  selection: string;
  label: string;
  odds: number;
  probability: number;
  /** False when no bookmaker priced this leg, so its odds are a fair estimate. */
  market_priced: boolean;
}

export interface BettingSlipData {
  id: number;
  tier: string;
  label: string;
  sport: string;
  date: string;
  legs: SlipLeg[];
  leg_count: number;
  total_odds: number;
  /** True when some leg had no market price, so the total is an estimate. */
  odds_are_estimates: boolean;
  combined_probability: number;
  /** Only ever a real code recorded by an admin; never generated. */
  booking_code: string | null;
  has_code: boolean;
  /** A code exists but this viewer needs an active subscription to see it. */
  code_locked: boolean;
  result: "pending" | "won" | "lost" | "void";
}

export interface SlipsResponse {
  date: string;
  sport: string;
  count: number;
  with_codes: number;
  codes_unlocked: boolean;
  slips: BettingSlipData[];
}

export interface AccountUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface SessionResponse {
  access_token: string;
  refresh_token: string;
  user: AccountUser;
}

export interface SubscriptionState {
  active: boolean;
  expires_at: string | null;
  days_left: number | null;
  price_naira: number;
  period_days: number;
  staff: boolean;
}

export interface Me extends AccountUser {
  subscription: SubscriptionState;
}

export interface Plan {
  price_naira: number;
  currency: string;
  period_days: number;
  payments_enabled: boolean;
}

export interface PaymentRecord {
  reference: string;
  amount_naira: number;
  status: string;
  created_at: string;
  paid_at: string | null;
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
  register: (body: { name: string; email: string; password: string }) =>
    post<SessionResponse>("/api/auth/register", body),
  login: (body: { email: string; password: string }) =>
    post<SessionResponse>("/api/auth/login", body),
  me: () => get<Me>("/api/auth/me"),
  plan: () => get<Plan>("/api/subscription/plan"),
  checkout: () =>
    post<{ reference: string; checkout_url: string; amount_naira: number }>(
      "/api/subscription/checkout",
    ),
  verifyPayment: (reference: string) =>
    post<{ status: string; subscription: SubscriptionState }>(
      `/api/subscription/verify/${encodeURIComponent(reference)}`,
    ),
  payments: () => get<PaymentRecord[]>("/api/subscription/payments"),
  slips: (params: { date?: string; sport?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set("date", params.date);
    if (params.sport) query.set("sport", params.sport);
    return get<SlipsResponse>(`/api/slips?${query}`);
  },
  fixtures: (params: { date?: string; leagueId?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set("date", params.date);
    if (params.leagueId) query.set("league_id", String(params.leagueId));
    return get<FixturesResponse>(`/api/football/fixtures?${query}`);
  },
  dailySelection: (params: { date?: string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set("date", params.date);
    if (params.limit) query.set("limit", String(params.limit));
    return get<DailySelectionResponse>(`/api/football/daily-selection?${query}`);
  },
  analysis: (fixtureId: number | string) =>
    get<FixtureAnalysis>(`/api/football/analysis/${fixtureId}`),
  news: (limit = 10) => get<Article[]>(`/api/news?limit=${limit}`),
  article: (slug: string) => get<Article>(`/api/news/${slug}`),
};

/**
 * Probabilities are 0-1 everywhere in this API.
 *
 * Rounding is capped at 99%: the backend floors every class away from zero so
 * nothing is ever certain, and rounding 0.995 up to "100%" would undo that at
 * the last step. A displayed 100% reads as a guarantee, which no prediction is.
 */
export const pct = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(value * 100);
  return `${value < 1 ? Math.min(rounded, 99) : rounded}%`;
};

export const signed = (value: number | null | undefined, suffix = "") =>
  value === null || value === undefined
    ? "—"
    : `${value > 0 ? "+" : ""}${value.toFixed(2)}${suffix}`;
