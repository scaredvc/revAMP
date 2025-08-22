# schemas/payments.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class PaymentCreate(BaseModel):
    amount: float
    currency: str = "USD"
    zone_code: str
    duration_minutes: int
    description: Optional[str] = None

class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_id: int

class PaymentResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    currency: str
    payment_method: str
    status: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ParkingRate(BaseModel):
    zone_type: str
    hourly_rate: float
    daily_max: float
    description: str

class PaymentStats(BaseModel):
    total_paid: float
    total_transactions: int
    monthly_spending: List[Dict[str, Any]]