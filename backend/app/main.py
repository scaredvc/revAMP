import json
from typing import Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.shared import limiter

from app.services.search_zones import search_zones
from app.services.get_description import get_description
from app.services.filter_by_zone import filter_by_zone
from app.routers.health import router as health_router
from app.routers.zones import router as zones_router


app = FastAPI(title="revAMP API", version="1.0.0")

# CORS – keep permissive for now to match previous Flask CORS behavior
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# SlowAPI limiter middleware
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

app.include_router(health_router)
app.include_router(zones_router)
