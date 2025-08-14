# schemas/zones.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal

class Position(BaseModel):
    lat: float
    lng: float

class Zone(BaseModel):
    code: Optional[str] = None
    description: str
    ext_description: Optional[str] = None
    positions: List[Position]
    additional_info: Optional[Dict[str, Any]] = None

class HeathResponse(BaseModel):
    status: Literal["ok"]


class Bounds(BaseModel):
    left_long: float
    right_long: float
    top_lat: float
    bottom_lat: float

