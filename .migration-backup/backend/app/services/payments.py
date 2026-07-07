"""Stripe payment integration.

Lazily imports the ``stripe`` SDK and is a no-op when keys are not configured,
so the app runs fine in environments without payments set up.
"""

from __future__ import annotations

from app.core.config import settings


class PaymentNotConfigured(RuntimeError):
    pass


def _client():
    if not settings.stripe_secret_key:
        raise PaymentNotConfigured("STRIPE_SECRET_KEY is not configured")
    import stripe

    stripe.api_key = settings.stripe_secret_key
    return stripe


def create_checkout_session(user_id: int, customer_email: str) -> dict:
    """Create a Stripe Checkout session for the premium subscription."""
    stripe = _client()
    if not settings.stripe_price_id:
        raise PaymentNotConfigured("STRIPE_PRICE_ID is not configured")
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        customer_email=customer_email,
        client_reference_id=str(user_id),
        success_url=settings.subscription_success_url,
        cancel_url=settings.subscription_cancel_url,
    )
    return {"id": session.id, "url": session.url}


def verify_webhook(payload: bytes, signature: str) -> dict:
    """Verify a Stripe webhook signature and return the parsed event."""
    stripe = _client()
    if not settings.stripe_webhook_secret:
        raise PaymentNotConfigured("STRIPE_WEBHOOK_SECRET is not configured")
    event = stripe.Webhook.construct_event(
        payload=payload,
        sig_header=signature,
        secret=settings.stripe_webhook_secret,
    )
    return event
