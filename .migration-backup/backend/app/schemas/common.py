from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class MatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    league_id: int
    home_team_id: int
    away_team_id: int
    home_team_name: str | None = None
    away_team_name: str | None = None
    home_team_logo: str | None = None
    away_team_logo: str | None = None
    league_name: str | None = None
    league_logo: str | None = None
    kickoff_time: datetime
    status: str
    home_score: int | None = None
    away_score: int | None = None
    elapsed: int | None = None


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    match_id: int
    prediction_type: str
    prediction: str
    confidence: float
    probabilities: dict


class MatchPredictionOut(BaseModel):
    match_id: int
    home_xg: float
    away_xg: float
    winner: dict
    over_under_2_5: dict
    btts: dict
    correct_score: dict


class PredictionCardOut(BaseModel):
    """Aggregated prediction for a match, ready for the mobile prediction card."""

    match: MatchOut
    winner_label: str
    winner_confidence: float
    winner_probabilities: dict
    over_under: dict
    btts: dict
    correct_score: dict
    home_xg: float | None = None
    away_xg: float | None = None


class DeviceRegisterRequest(BaseModel):
    token: str
    platform: str
