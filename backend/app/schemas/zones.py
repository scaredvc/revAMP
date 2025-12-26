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

class HealthResponse(BaseModel):
    status: Literal["ok"]


class StaleMetadata(BaseModel):
    stale: bool = False
    stale_reason: Optional[str] = None
    bounds_key: Optional[str] = None
    fetched_at: Optional[str] = None
    upstream_status: Optional[int] = None


class Bounds(BaseModel):
    left_long: float
    right_long: float
    top_lat: float
    bottom_lat: float


class ParkingSpotInfo(BaseModel):
    code: Optional[str] = None
    ext_description: Optional[str] = None
    positions: List[Position] = []
    additional_info: Optional[str] = None  # HTML string content from external API


class ParkingDataResponse(StaleMetadata):
    parkingSpots: Dict[str, ParkingSpotInfo]


class ZoneCoordinatesResponse(StaleMetadata):
    coordinates: List[List[float]]  # List of [lat, lng] pairs


class ZonesListResponse(StaleMetadata):
    zones: List[str]


class RawZonesResponse(StaleMetadata):
    zones: List[Zone]


class BoundsInfoResponse(BaseModel):
    main_campus: Dict[str, Any]
    city_wide: Dict[str, Any]


class ErrorResponse(BaseModel):
    error: str
    message: str


class SearchEvent(BaseModel):
    zone_code: str
    zone_name: str
    timestamp: str
    client_ip: Optional[str] = None
    user_agent: Optional[str] = None


class AnalyticsResponse(BaseModel):
    total_searches: int
    unique_zones_searched: int
    popular_zones: Dict[str, int]  # zone_code -> search_count
    recent_searches: List[SearchEvent]
    search_trends: Dict[str, int]  # hourly search distribution
    peak_hours: List[str]  # most active hours


class ZoneAnalytics(BaseModel):
    zone_code: str
    zone_name: str
    search_count: int
    directions_requested: int
    last_accessed: Optional[str] = None
    coordinates: Optional[List[float]] = None


class UserSession(BaseModel):
    session_id: str
    searches: List[SearchEvent]
    total_searches: int
    first_visit: str
    last_visit: str


# External API Response Validation Models
class ExternalZonePosition(BaseModel):
    lat: float
    lng: float


class ExternalZone(BaseModel):
    code: Optional[str] = None
    description: str
    ext_description: Optional[str] = None
    positions: List[ExternalZonePosition]
    additional_info: Optional[str] = None  # This is actually HTML string content


class ExternalAPIResponse(BaseModel):
    zones: List[ExternalZone]

