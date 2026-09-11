from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user")        # user | moderator | admin | super_admin
    status = Column(String(50), default="active")    # active | suspended | banned
    subscription_type = Column(String(50), default="free")  # free | premium
    two_factor_enabled = Column(Boolean, default=False)
    avatar = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)


# ── Fixture history ───────────────────────────────────────────────────────────
# Predictions from the live ESPN/football-data feed need no persistence, but a
# model that learns from results does: these tables are what the training
# pipeline reads.


# Every competition and match belongs to exactly one sport. Defaulting to
# football keeps rows written before this column existed valid.
DEFAULT_SPORT = "football"


class League(Base):
    __tablename__ = "leagues"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String(120), nullable=False)
    country = Column(String(120), nullable=True)
    sport = Column(String(20), index=True, nullable=False, default=DEFAULT_SPORT,
                   server_default=DEFAULT_SPORT)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String(120), index=True, nullable=False)
    logo_url = Column(String(512), nullable=True)


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, unique=True, index=True, nullable=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), index=True, nullable=False)
    home_team_id = Column(Integer, ForeignKey("teams.id"), index=True, nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), index=True, nullable=False)
    kickoff_time = Column(DateTime, index=True, nullable=False)
    status = Column(String(50), index=True, nullable=False)
    season = Column(Integer, index=True, nullable=True)
    sport = Column(String(20), index=True, nullable=False, default=DEFAULT_SPORT,
                   server_default=DEFAULT_SPORT)

    # Final result; NULL until played. These are the training labels. For
    # basketball these hold points rather than goals - the column names are kept
    # so the shared loaders and the existing rows do not need rewriting.
    home_goals = Column(Integer, nullable=True)
    away_goals = Column(Integer, nullable=True)

    # Post-match team stats. Used only to build rolling averages for *later*
    # fixtures - never as features for the match they belong to.
    home_shots_on_target = Column(Integer, nullable=True)
    away_shots_on_target = Column(Integer, nullable=True)
    home_possession = Column(Float, nullable=True)
    away_possession = Column(Float, nullable=True)
    home_corners = Column(Integer, nullable=True)
    away_corners = Column(Integer, nullable=True)

    # Closing 1X2 odds, for value detection and as the benchmark to beat.
    odds_home = Column(Float, nullable=True)
    odds_draw = Column(Float, nullable=True)
    odds_away = Column(Float, nullable=True)

    league = relationship("League")
    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])


class PublishedTip(Base):
    """A tip as published, recorded before kickoff.

    The results page is only worth anything if picks cannot be chosen or edited
    once the result is known, so nothing here is rewritten after settlement
    except the outcome fields.
    """

    __tablename__ = "published_tips"
    __table_args__ = (UniqueConstraint("match_id", "market", "selection", name="uq_tip_selection"),)

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), index=True, nullable=False)
    sport = Column(String(20), index=True, nullable=False, default=DEFAULT_SPORT,
                   server_default=DEFAULT_SPORT)
    market = Column(String(40), index=True, nullable=False)
    selection = Column(String(40), nullable=False)
    probability = Column(Float, nullable=False)
    odds = Column(Float, nullable=False)
    is_vip = Column(Boolean, default=False, index=True)
    rationale = Column(String(400), nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow, index=True)
    kickoff_time = Column(DateTime, index=True, nullable=False)
    result = Column(String(20), default="pending", index=True)  # pending|won|lost|void
    settled_at = Column(DateTime, nullable=True)

    match = relationship("Match")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    title = Column(String(250), nullable=False)
    excerpt = Column(String(500), nullable=True)
    body = Column(Text, nullable=False)
    cover_image = Column(String(512), nullable=True)
    author = Column(String(120), nullable=True)
    published = Column(Boolean, default=False, index=True)
    published_at = Column(DateTime, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
