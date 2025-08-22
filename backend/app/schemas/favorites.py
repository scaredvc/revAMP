# schemas/favorites.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FavoriteZoneBase(BaseModel):
    zone_code: str
    zone_description: Optional[str] = None
    notes: Optional[str] = None

class FavoriteZoneCreate(FavoriteZoneBase):
    pass

class FavoriteZoneUpdate(BaseModel):
    zone_description: Optional[str] = None
    notes: Optional[str] = None
    display_order: Optional[int] = None

class FavoriteZoneResponse(FavoriteZoneBase):
    id: int
    user_id: int
    display_order: int
    times_used: int
    last_used: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True