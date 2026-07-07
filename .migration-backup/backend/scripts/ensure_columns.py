"""Idempotently add columns introduced after the initial deploy.

``Base.metadata.create_all`` creates new tables but never ALTERs existing ones,
so new columns on already-deployed tables must be added explicitly. Safe to run
on every startup; uses ``ADD COLUMN IF NOT EXISTS`` (Postgres) and no-ops on SQLite.
"""

from __future__ import annotations

from sqlalchemy import text

from app.db.session import engine

# (table, column, type) tuples — Postgres syntax.
COLUMNS = [
    ("matches", "external_id", "INTEGER"),
    ("matches", "home_score", "INTEGER"),
    ("matches", "away_score", "INTEGER"),
    ("matches", "elapsed", "INTEGER"),
    ("leagues", "logo_url", "VARCHAR(512)"),
]


def ensure_columns() -> None:
    if engine.dialect.name != "postgresql":
        return  # SQLite test DBs are created fresh via create_all.
    with engine.begin() as conn:
        for table, column, col_type in COLUMNS:
            conn.execute(
                text(f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}')
            )
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_matches_external_id "
                "ON matches (external_id)"
            )
        )


if __name__ == "__main__":
    ensure_columns()
    print("Schema columns ensured")
