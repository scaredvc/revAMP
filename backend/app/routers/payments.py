# routers/payments.py
import stripe
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.payment import Payment
from app.models.parking_history import ParkingHistory
from app.schemas.payments import (
    PaymentCreate, PaymentResponse, PaymentIntentResponse,
    ParkingRate, PaymentStats
)
from app.core.shared import limiter

router = APIRouter()

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
@limiter.limit("10/minute")
async def create_payment_intent(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe payment intent for parking payment"""
    try:
        # Calculate amount in cents
        amount_cents = int(payment_data.amount * 100)

        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=payment_data.currency,
            metadata={
                "user_id": current_user.id,
                "zone_code": payment_data.zone_code,
                "duration_minutes": payment_data.duration_minutes
            }
        )

        # Store payment record
        payment = Payment(
            user_id=current_user.id,
            amount=payment_data.amount,
            currency=payment_data.currency,
            payment_method="stripe",
            stripe_payment_intent_id=intent.id,
            status="pending",
            description=f"Parking payment for zone {payment_data.zone_code}"
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            payment_id=payment.id
        )

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            await handle_payment_success(payment_intent, db)
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            await handle_payment_failure(payment_intent, db)

        return {"status": "success"}

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

async def handle_payment_success(payment_intent, db: Session):
    """Handle successful payment"""
    payment = db.query(Payment).filter(
        Payment.stripe_payment_intent_id == payment_intent.id
    ).first()

    if payment:
        payment.status = "completed"
        payment.stripe_charge_id = payment_intent.charges.data[0].id

        # Link to parking session if provided
        if payment.parking_history_id:
            parking_session = db.query(ParkingHistory).get(payment.parking_history_id)
            if parking_session:
                parking_session.amount_paid = payment.amount
                parking_session.payment_method = "card"
                parking_session.payment_id = payment.id

        db.commit()

async def handle_payment_failure(payment_intent, db: Session):
    """Handle failed payment"""
    payment = db.query(Payment).filter(
        Payment.stripe_payment_intent_id == payment_intent.id
    ).first()

    if payment:
        payment.status = "failed"
        db.commit()

@router.get("/rates", response_model=List[ParkingRate])
@limiter.limit("60/minute")
async def get_parking_rates():
    """Get current parking rates"""
    # This would typically come from a database or configuration
    rates = [
        ParkingRate(
            zone_type="standard",
            hourly_rate=2.50,
            daily_max=15.00,
            description="Standard parking zones"
        ),
        ParkingRate(
            zone_type="premium",
            hourly_rate=3.50,
            daily_max=20.00,
            description="Premium parking zones (closer to campus)"
        ),
        ParkingRate(
            zone_type="metered",
            hourly_rate=1.50,
            daily_max=12.00,
            description="Metered parking"
        )
    ]
    return rates

@router.get("/history", response_model=List[PaymentResponse])
@limiter.limit("60/minute")
async def get_payment_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's payment history"""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return payments

@router.get("/stats", response_model=PaymentStats)
@limiter.limit("30/minute")
async def get_payment_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get payment statistics for the user"""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id,
        Payment.status == "completed"
    ).all()

    total_paid = sum(payment.amount for payment in payments)
    total_transactions = len(payments)

    # Monthly spending (last 12 months)
    from datetime import datetime, timedelta
    from collections import defaultdict

    monthly_spending = defaultdict(float)
    for payment in payments:
        month_key = payment.created_at.strftime("%Y-%m")
        monthly_spending[month_key] += payment.amount

    monthly_data = [
        {"month": month, "amount": amount}
        for month, amount in sorted(monthly_spending.items(), reverse=True)[:12]
    ]

    return PaymentStats(
        total_paid=total_paid,
        total_transactions=total_transactions,
        monthly_spending=monthly_data
    )