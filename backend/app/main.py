import json
from typing import Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from backend.app.services.search_zones import search_zones
from backend.app.services.get_description import get_description
from backend.app.services.filter_by_zone import filter_by_zone


app = FastAPI(title="revAMP API", version="1.0.0")

# CORS – keep permissive for now to match previous Flask CORS behavior
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# SlowAPI limiter setup (mirrors previous Flask-Limiter defaults)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/day", "50/hour"])
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded. Please try again later.",
            "message": "Too many requests. Please wait before making more requests.",
        },
    )


DEFAULT_BOUNDS: Dict[str, float] = {
    "left_long": -121.75565688680798,
    "right_long": -121.73782556127698,
    "top_lat": 38.53997670732033,
    "bottom_lat": 38.52654855404775,
}


class Bounds(BaseModel):
    left_long: float
    right_long: float
    top_lat: float
    bottom_lat: float


def update_parking_spots(bounds: Dict[str, float]):
    zones_text = search_zones(
        bounds["left_long"],
        bounds["right_long"],
        bounds["top_lat"],
        bounds["bottom_lat"],
    )
    zones_json = json.loads(zones_text)
    locations = zones_json["zones"]

    parking_spots: Dict[str, dict] = {}
    get_description(parking_spots, locations)
    return parking_spots


@app.get("/api/data")
@limiter.limit("30/minute")
def get_data_default(request: Request):
    parking_spots = update_parking_spots(DEFAULT_BOUNDS)
    return {"parkingSpots": parking_spots}


@app.post("/api/data")
@limiter.limit("30/minute")
def get_data(request: Request, bounds: Bounds):
    parking_spots = update_parking_spots(bounds.dict())
    return {"parkingSpots": parking_spots}


@app.get("/api/zones/{zone_code}")
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


@app.get("/health")
def health():
    return {"status": "ok"}

