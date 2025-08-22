# schemas/parking_history.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ParkingHistoryBase(BaseModel):
    zone_code: str
    zone_description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None

class ParkingHistoryCreate(ParkingHistoryBase):
    pass

class ParkingHistoryUpdate(BaseModel):
    end_time: Optional[datetime] = None
    amount_paid: Optional[float] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class ParkingHistoryResponse(ParkingHistoryBase):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    amount_paid: float = 0.0
    payment_method: Optional[str] = None
    payment_id: Optional[str] = None
    status: str = "active"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ParkingHistoryStats(BaseModel):
    total_sessions: int
    total_duration: int  # in minutes
    avg_duration: int   # in minutes
    favorite_zone: Optional[str] = None
    total_paid: float