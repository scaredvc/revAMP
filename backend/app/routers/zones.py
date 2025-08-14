import json
from fastapi import APIRouter, Request
from backend.app.schemas.zones import Bounds
from backend.app.services.search_zones import search_zones
from backend.app.services.filter_by_zone import filter_by_zone
from backend.app.services.get_description import get_description
from backend.app.core.shared import limiter, DEFAULT_BOUNDS

router = APIRouter()

@router.get("/api/data")
@limiter.limit("30/minute")
def get_data_default(request: Request):
    zones_text = search_zones(
        DEFAULT_BOUNDS["left_long"],
        DEFAULT_BOUNDS["right_long"],
        DEFAULT_BOUNDS["top_lat"],
        DEFAULT_BOUNDS["bottom_lat"],
    )
    zones_json = json.loads(zones_text)
    locations = zones_json["zones"]
    parking_spots = {}
    get_description(parking_spots, locations)
    return {"parkingSpots": parking_spots}


@router.post("/api/data")
@limiter.limit("30/minute")
def get_data(request: Request, bounds: Bounds):
    zones_text = search_zones(
        bounds.left_long,
        bounds.right_long,
        bounds.top_lat,
        bounds.bottom_lat,
    )
    zones_json = json.loads(zones_text)
    locations = zones_json["zones"]
    parking_spots = {}
    get_description(parking_spots, locations)
    return {"parkingSpots": parking_spots}


@router.get("/api/zones/{zone_code}")
@limiter.limit("60/minute")
def get_zone_coords(request: Request, zone_code: str):
    zones_text = search_zones(
        DEFAULT_BOUNDS["left_long"],
        DEFAULT_BOUNDS["right_long"],
        DEFAULT_BOUNDS["top_lat"],
        DEFAULT_BOUNDS["bottom_lat"],
    )
    zones_json = json.loads(zones_text)
    locations = zones_json["zones"]
    coords = filter_by_zone(locations, zone_code)
    return {"coordinates": coords}

@router.get("/api/raw-zones")
@limiter.limit("20/minute")
def get_raw_zones(request: Request):
    zones_text = search_zones(
        DEFAULT_BOUNDS["left_long"],
        DEFAULT_BOUNDS["right_long"],
        DEFAULT_BOUNDS["top_lat"],
        DEFAULT_BOUNDS["bottom_lat"],
    )
    zones_json = json.loads(zones_text)
    return zones_json