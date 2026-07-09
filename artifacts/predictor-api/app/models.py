from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

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
