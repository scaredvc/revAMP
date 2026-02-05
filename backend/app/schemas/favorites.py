# schemas/favorites.py
import re
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime

ZONE_CODE_PATTERN = re.compile(r"^[A-Za-z0-9\s\-\.\,\(\)\/]{1,120}$")

class FavoriteZoneBase(BaseModel):
    zone_code: str
    zone_description: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("zone_code")
    @classmethod
    def validate_zone_code(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("zone_code must not be empty")
        if not ZONE_CODE_PATTERN.match(v):
            raise ValueError("zone_code contains invalid characters")
        return v

class FavoriteZoneCreate(FavoriteZoneBase):
    pass

class ReorderItem(BaseModel):
    id: int
    display_order: int

class FavoriteReorderRequest(BaseModel):
    order: List[ReorderItem]

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