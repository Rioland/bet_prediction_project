#!/usr/bin/env python3
"""Add columns that create_all cannot.

SQLAlchemy's create_all builds missing tables but never alters existing ones,
so a deployed database keeps its old shape after a model change. This adds any
missing columns in place, and is safe to run repeatedly.

    python scripts/migrate_schema.py

Only additive changes belong here. Anything that drops or rewrites data should
be written and reviewed deliberately, not applied by a startup helper.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import inspect, text  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.models import DEFAULT_SPORT  # noqa: E402

# table -> column -> DDL fragment
ADDITIONS: dict[str, dict[str, str]] = {
    "leagues": {"sport": f"VARCHAR(20) NOT NULL DEFAULT '{DEFAULT_SPORT}'"},
    "matches": {"sport": f"VARCHAR(20) NOT NULL DEFAULT '{DEFAULT_SPORT}'"},
    "published_tips": {"sport": f"VARCHAR(20) NOT NULL DEFAULT '{DEFAULT_SPORT}'"},
    "betting_slips": {"odds_are_estimates": "BOOLEAN NOT NULL DEFAULT 0"},
}

# betting_slips is created by create_all; no additive columns needed yet.

INDEXES = [
    ("ix_leagues_sport", "leagues", "sport"),
    ("ix_matches_sport", "matches", "sport"),
    ("ix_published_tips_sport", "published_tips", "sport"),
]


def main() -> int:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    applied = 0

    with engine.begin() as connection:
        for table, columns in ADDITIONS.items():
            if table not in inspector.get_table_names():
                print(f"  {table}: not present, skipped")
                continue

            existing = {c["name"] for c in inspector.get_columns(table)}
            for column, ddl in columns.items():
                if column in existing:
                    continue
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
                print(f"  {table}.{column}: added")
                applied += 1

        for name, table, column in INDEXES:
            if table not in inspector.get_table_names():
                continue
            if any(ix["name"] == name for ix in inspector.get_indexes(table)):
                continue
            connection.execute(text(f"CREATE INDEX {name} ON {table} ({column})"))
            print(f"  {name}: created")
            applied += 1

    print(f"\n{applied} change(s) applied." if applied else "\nSchema already current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
