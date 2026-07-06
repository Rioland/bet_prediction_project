"""Expo push notification delivery.

Sends notifications to registered device tokens via the Expo Push API.
Docs: https://docs.expo.dev/push-notifications/sending-notifications/
"""

from __future__ import annotations

import logging

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import DeviceToken, Notification

logger = logging.getLogger("football_ai.push")
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _chunk(items: list, size: int = 100):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def send_push_to_users(
    db: Session,
    title: str,
    body: str,
    user_ids: list[int] | None = None,
) -> int:
    """Persist Notification rows and push to all matching device tokens."""
    token_query = select(DeviceToken)
    if user_ids:
        token_query = token_query.where(DeviceToken.user_id.in_(user_ids))
    device_tokens = list(db.scalars(token_query))

    # Record notifications per user.
    target_user_ids = user_ids or list({dt.user_id for dt in device_tokens})
    for uid in target_user_ids:
        db.add(Notification(user_id=uid, title=title, body=body, sent=True))
    db.commit()

    expo_tokens = [dt.token for dt in device_tokens if dt.token.startswith("ExponentPushToken")]
    if not expo_tokens:
        return 0

    sent = 0
    with httpx.Client(timeout=20) as client:
        for batch in _chunk(expo_tokens):
            messages = [{"to": t, "title": title, "body": body, "sound": "default"} for t in batch]
            try:
                resp = client.post(EXPO_PUSH_URL, json=messages)
                resp.raise_for_status()
                sent += len(batch)
            except Exception:  # noqa: BLE001
                logger.exception("expo push batch failed")
    return sent
