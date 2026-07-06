from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from app.api.deps import DbSession, get_current_user
from app.models.entities import Subscription, SubscriptionType, User

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


class VerifyRequest(BaseModel):
    provider_ref: str
    provider: str = "manual"


def _activate_premium(db: DbSession, user: User, provider: str, reference: str) -> None:
    sub = Subscription(
        user_id=user.id,
        provider=provider,
        provider_reference=reference,
        status="active",
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    db.add(sub)
    user.subscription_type = SubscriptionType.PREMIUM
    db.commit()


@router.post("/checkout")
def create_checkout(
    db: DbSession, current_user: Annotated[User, Depends(get_current_user)]
) -> dict:
    """Create a Stripe Checkout session for the premium plan."""
    from app.services.payments import PaymentNotConfigured, create_checkout_session

    try:
        return create_checkout_session(current_user.id, current_user.email)
    except PaymentNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/verify")
def verify_subscription(
    payload: VerifyRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Manual/fallback verification (e.g. Paystack/Flutterwave callback confirmation)."""
    _activate_premium(db, current_user, payload.provider, payload.provider_ref)
    return {"status": "verified", "subscription": "premium"}


@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    db: DbSession,
    stripe_signature: Annotated[str | None, Header(alias="Stripe-Signature")] = None,
) -> dict:
    """Stripe webhook: activates premium on successful checkout."""
    from app.services.payments import PaymentNotConfigured, verify_webhook

    body = await request.body()
    try:
        event = verify_webhook(body, stripe_signature or "")
    except PaymentNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - invalid signature/payload
        raise HTTPException(status_code=400, detail="Invalid webhook") from exc

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        if user_id:
            user = db.get(User, int(user_id))
            if user:
                _activate_premium(db, user, "stripe", session.get("id", ""))

    return {"status": "ok"}
