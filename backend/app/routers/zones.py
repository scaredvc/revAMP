import json
from typing import Dict
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from app.schemas.zones import (
    Bounds,
    ParkingDataResponse,
    ParkingSpotInfo,
    ZoneCoordinatesResponse,
    ZonesListResponse,
    RawZonesResponse,
    BoundsInfoResponse,
    ErrorResponse,
    ExternalAPIResponse
)
from app.services.search_zones import search_zones
from app.services.filter_by_zone import filter_by_zone
from app.services.get_description import get_description
from app.core.shared import limiter, DEFAULT_BOUNDS, CITY_BOUNDS, get_bounds_info
from app.core.logging import logger

router = APIRouter()


def get_zones_data(left_long: float, right_long: float, top_lat: float, bottom_lat: float) -> ExternalAPIResponse:
    """Helper function to safely fetch and validate zones data with error handling"""
    try:
        zones_text = search_zones(left_long, right_long, top_lat, bottom_lat)
        if not zones_text:
            raise HTTPException(
                status_code=503,
                detail=ErrorResponse(
                    error="External API Error",
                    message="No response from external parking API"
                ).dict()
            )

        zones_json = json.loads(zones_text)

        # Validate the response structure using Pydantic model
        try:
            return ExternalAPIResponse(**zones_json)
        except Exception as validation_error:
            logger.error(f"External API response validation failed: {str(validation_error)}")
            raise HTTPException(
                status_code=503,
                detail=ErrorResponse(
                    error="Invalid API Response Structure",
                    message=f"External API response doesn't match expected format: {str(validation_error)}"
                ).dict()
            )

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=ErrorResponse(
                error="JSON Parse Error",
                message=f"Failed to parse external API response: {str(e)}"
            ).dict()
        )
    except Exception as e:
        logger.error(f"Error fetching parking data: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=ErrorResponse(
                error="External API Error",
                message=f"Failed to fetch parking data: {str(e)}"
            ).dict()
        )


@router.get("/api/test/bounds", response_model=BoundsInfoResponse)
@limiter.limit("60/minute")
def test_bounds(request: Request):
    """Test endpoint to see the bounds and their coverage"""
    return get_bounds_info()

@router.get("/api/data", response_model=ParkingDataResponse)
@limiter.limit("120/minute")
def get_data_default(request: Request):
    """Get parking data for default bounds (UC Davis main campus)"""
    zones_response = get_zones_data(
        DEFAULT_BOUNDS["left_long"],
        DEFAULT_BOUNDS["right_long"],
        DEFAULT_BOUNDS["top_lat"],
        DEFAULT_BOUNDS["bottom_lat"],
    )
    # Convert Pydantic model to dict for compatibility with existing service functions
    locations = [zone.dict() for zone in zones_response.zones]
    parking_spots: Dict[str, ParkingSpotInfo] = {}
    get_description(parking_spots, locations)
    return ParkingDataResponse(parkingSpots=parking_spots)


@router.post("/api/data", response_model=ParkingDataResponse)
@limiter.limit("120/minute")
def get_data(request: Request, bounds: Bounds):
    """Get parking data for custom bounds"""
    zones_response = get_zones_data(
        bounds.left_long,
        bounds.right_long,
        bounds.top_lat,
        bounds.bottom_lat,
    )
    # Convert Pydantic model to dict for compatibility with existing service functions
    locations = [zone.dict() for zone in zones_response.zones]
    parking_spots: Dict[str, ParkingSpotInfo] = {}
    get_description(parking_spots, locations)
    return ParkingDataResponse(parkingSpots=parking_spots)


@router.get("/api/zones/{zone_code}", response_model=ZoneCoordinatesResponse)
@limiter.limit("60/minute")
def get_zone_coords(request: Request, zone_code: str):
    """Get coordinates for a specific zone code"""
    zones_response = get_zones_data(
        CITY_BOUNDS["left_long"],
        CITY_BOUNDS["right_long"],
        CITY_BOUNDS["top_lat"],
        CITY_BOUNDS["bottom_lat"],
    )
    # Convert Pydantic model to dict for compatibility with existing service functions
    locations = [zone.dict() for zone in zones_response.zones]
    coords = filter_by_zone(locations, zone_code)
    # Convert tuples to lists for JSON serialization
    coords_list = [[lat, lng] for lat, lng in coords]
    return ZoneCoordinatesResponse(coordinates=coords_list)

@router.get("/api/raw-zones")
@limiter.limit("20/minute")
def get_raw_zones(request: Request):
    """Get raw zones data from external API"""
    try:
        zones_response = get_zones_data(
            CITY_BOUNDS["left_long"],
            CITY_BOUNDS["right_long"],
            CITY_BOUNDS["top_lat"],
            CITY_BOUNDS["bottom_lat"],
        )
        # Convert Pydantic models to dict for JSON serialization
        zones_dict = [zone.dict() for zone in zones_response.zones]
        return {"zones": zones_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/zones", response_model=ZonesListResponse)
@limiter.limit("20/minute")
def get_zones(request: Request):
    """Get list of zone descriptions"""
    zones_response = get_zones_data(
        CITY_BOUNDS["left_long"],
        CITY_BOUNDS["right_long"],
        CITY_BOUNDS["top_lat"],
        CITY_BOUNDS["bottom_lat"],
    )
    descriptions = [zone.description for zone in zones_response.zones]
    return ZonesListResponse(zones=descriptions)

@router.get("/api/filter/description_to_zones")
@limiter.limit("60/minute")
def get_description_to_zones(request: Request):
    """Get mapping of zone descriptions to zone codes"""
    all_zones_data = get_raw_zones(request)
    zones = {zone["description"]: zone["code"] for zone in all_zones_data["zones"]}
    return zones
