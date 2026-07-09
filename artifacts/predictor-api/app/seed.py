"""Seed the database with a default admin user and demo regular users."""

import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_PASSWORD
from app.models import User


def seed_admin(db: Session) -> None:
    """Create the default super_admin if it doesn't exist."""
    existing = db.query(User).filter(User.email == DEFAULT_ADMIN_EMAIL).first()
    if existing:
        return

    admin = User(
        name=DEFAULT_ADMIN_NAME,
        email=DEFAULT_ADMIN_EMAIL,
        password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
        role="super_admin",
        status="active",
        subscription_type="premium",
        created_at=datetime.utcnow(),
    )
    db.add(admin)

    # Demo users for the admin dashboard
    demo_users = [
        ("Alice Johnson", "alice@example.com", "user", "free"),
        ("Bob Smith", "bob@example.com", "user", "premium"),
        ("Charlie Brown", "charlie@example.com", "moderator", "premium"),
        ("Diana Prince", "diana@example.com", "user", "free"),
        ("Eve Williams", "eve@example.com", "user", "premium"),
        ("Frank Castle", "frank@example.com", "user", "free"),
        ("Grace Hopper", "grace@example.com", "admin", "premium"),
        ("Henry Ford", "henry@example.com", "user", "free"),
        ("Isabel Diaz", "isabel@example.com", "user", "premium"),
        ("James Bond", "james@example.com", "user", "free"),
    ]
    rng = random.Random(42)
    for i, (name, email, role, sub) in enumerate(demo_users):
        u = User(
            name=name,
            email=email,
            password_hash=hash_password("Demo1234!"),
            role=role,
            status="active",
            subscription_type=sub,
            created_at=datetime.utcnow() - timedelta(days=rng.randint(1, 180)),
        )
        db.add(u)

    db.commit()
