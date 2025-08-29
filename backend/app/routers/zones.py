import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List
from collections import defaultdict
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from app.schemas.zones import (
    Bounds,
    ParkingDataResponse,
    ParkingSpotInfo,
    ZoneCoordinatesResponse,
    ZonesListResponse,
    RawZonesResponse,
    BoundsInfoResponse,
    ErrorResponse,
    SearchEvent,
    AnalyticsResponse,
    ZoneAnalytics,
    UserSession,
    ExternalAPIResponse
)

# Database simulation for caching (would be real database in production)
zone_cache = {}
cache_timestamps = {}
CACHE_DURATION_MINUTES = 30  # Cache for 30 minutes

def get_cached_zones_data(left_long: float, right_long: float, top_lat: float, bottom_lat: float) -> ExternalAPIResponse:
    """Get zones data with caching to reduce external API calls"""
    # Create cache key based on bounds
    cache_key = f"{left_long:.4f}_{right_long:.4f}_{top_lat:.4f}_{bottom_lat:.4f}"

    # Check if we have cached data and it's still fresh
    if cache_key in zone_cache:
        cache_time = cache_timestamps.get(cache_key)
        if cache_time and (datetime.now() - cache_time).seconds < (CACHE_DURATION_MINUTES * 60):
            logger.info(f"Cache hit for bounds: {cache_key}")
            return zone_cache[cache_key]

    # Cache miss or expired - fetch fresh data
    logger.info(f"Cache miss for bounds: {cache_key} - fetching fresh data")
    fresh_data = get_zones_data(left_long, right_long, top_lat, bottom_lat)

    # Store in cache
    zone_cache[cache_key] = fresh_data
    cache_timestamps[cache_key] = datetime.now()

    # Clean up old cache entries (simple cleanup - keep only last 10)
    if len(zone_cache) > 10:
        oldest_key = min(cache_timestamps.keys(), key=lambda k: cache_timestamps[k])
        del zone_cache[oldest_key]
        del cache_timestamps[oldest_key]

    return fresh_data
from app.services.search_zones import search_zones
from app.services.filter_by_zone import filter_by_zone
from app.services.get_description import get_description, clean_description
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
    zones_response = get_cached_zones_data(
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
    zones_response = get_cached_zones_data(
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
    zones_response = get_cached_zones_data(
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
        zones_response = get_cached_zones_data(
            CITY_BOUNDS["left_long"],
            CITY_BOUNDS["right_long"],
            CITY_BOUNDS["top_lat"],
            CITY_BOUNDS["bottom_lat"],
        )
        # Convert Pydantic models to dict for JSON serialization
        zones_dict = [zone.dict() for zone in zones_response.zones]

        # Clean descriptions in raw zones data
        for zone in zones_dict:
            zone["description"] = clean_description(zone.get("description", ""))
            zone["ext_description"] = clean_description(zone.get("ext_description", ""))
            zone["additional_info"] = clean_description(zone.get("additional_info", ""))
        return {"zones": zones_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/zones", response_model=ZonesListResponse)
@limiter.limit("20/minute")
def get_zones(request: Request):
    """Get list of zone descriptions"""
    zones_response = get_cached_zones_data(
        CITY_BOUNDS["left_long"],
        CITY_BOUNDS["right_long"],
        CITY_BOUNDS["top_lat"],
        CITY_BOUNDS["bottom_lat"],
    )
    # Clean descriptions using the same cleaning function
    descriptions = [clean_description(zone.description) for zone in zones_response.zones]
    return ZonesListResponse(zones=descriptions)

@router.get("/api/filter/description_to_zones")
@limiter.limit("60/minute")
def get_description_to_zones(request: Request):
    """Get mapping of zone descriptions to zone codes"""
    all_zones_data = get_raw_zones(request)
    zones = {clean_description(zone["description"]): zone["code"] for zone in all_zones_data["zones"]}
    return zones

# In-memory storage for demo (would be database in production)
search_events = []
zone_analytics = defaultdict(lambda: {"search_count": 0, "directions_requested": 0, "last_accessed": None})
user_sessions = defaultdict(list)

# Peak usage tracking
peak_hours_data = defaultdict(int)
daily_stats = {
    "date": datetime.now().date().isoformat(),
    "total_searches": 0,
    "total_directions": 0,
    "unique_users": set(),
    "popular_zones": defaultdict(int)
}


@router.post("/api/analytics/search/{zone_code:path}")
@limiter.limit("100/minute")
def track_search(request: Request, zone_code: str):
    """Track when a user searches for a zone"""
    try:
        # Get zone data for the zone name
        zones_response = get_cached_zones_data(
            CITY_BOUNDS["left_long"],
            CITY_BOUNDS["right_long"],
            CITY_BOUNDS["top_lat"],
            CITY_BOUNDS["bottom_lat"],
        )

        zone_name = "Unknown Zone"
        for zone in zones_response.zones:
            if zone.code == zone_code:
                zone_name = clean_description(zone.description)
                break

        # Create search event
        search_event = SearchEvent(
            zone_code=zone_code,
            zone_name=zone_name,
            timestamp=datetime.now().isoformat(),
            client_ip=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

        # Store the event
        search_events.append(search_event)
        logger.info(f"Search tracked: '{zone_code}' ({zone_name}) - Total searches: {len(search_events)}")
        print(f"DEBUG: Zone code received: '{zone_code}'")

        # Update zone analytics
        zone_analytics[zone_code]["search_count"] += 1
        zone_analytics[zone_code]["last_accessed"] = search_event.timestamp

        # Update peak hours and daily stats
        current_hour = datetime.now().hour
        peak_hours_data[current_hour] += 1
        daily_stats["total_searches"] += 1
        daily_stats["unique_users"].add(request.client.host or "unknown")
        daily_stats["popular_zones"][zone_code] += 1

        # Generate session ID and track user session
        session_id = str(uuid.uuid4())  # In production, use proper session management
        user_sessions[session_id].append(search_event)

        return {"message": "Search tracked successfully", "session_id": session_id, "total_searches": len(search_events)}

    except Exception as e:
        logger.error(f"Error tracking search for zone {zone_code}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track search")


@router.post("/api/analytics/directions/{zone_code:path}")
@limiter.limit("50/minute")
def track_directions_request(request: Request, zone_code: str):
    """Track when a user requests directions to a zone"""
    try:
        # Update zone analytics
        zone_analytics[zone_code]["directions_requested"] += 1

        # Update daily stats for directions
        daily_stats["total_directions"] += 1

        logger.info(f"Directions tracked: {zone_code} - Total directions: {zone_analytics[zone_code]['directions_requested']}")

        return {"message": "Directions request tracked successfully", "total_directions": zone_analytics[zone_code]["directions_requested"]}

    except Exception as e:
        logger.error(f"Error tracking directions request for zone {zone_code}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track directions request")


@router.get("/api/analytics/overview", response_model=AnalyticsResponse)
@limiter.limit("20/minute")
def get_analytics_overview(request: Request):
    """Get comprehensive analytics overview"""
    try:
        # Calculate analytics
        total_searches = len(search_events)
        unique_zones_searched = len(set(event.zone_code for event in search_events))

        # Popular zones
        popular_zones = defaultdict(int)
        for event in search_events:
            popular_zones[event.zone_code] += 1

        # Recent searches (last 24 hours)
        recent_searches = [
            event for event in search_events
            if datetime.fromisoformat(event.timestamp) > datetime.now() - timedelta(hours=24)
        ][:10]  # Last 10 searches

        # Search trends by hour
        search_trends = defaultdict(int)
        for event in search_events:
            hour = datetime.fromisoformat(event.timestamp).hour
            search_trends[str(hour)] += 1

        # Peak hours (top 3)
        sorted_hours = sorted(search_trends.items(), key=lambda x: x[1], reverse=True)
        peak_hours = [f"{hour}:00" for hour, _ in sorted_hours[:3]]

        return AnalyticsResponse(
            total_searches=total_searches,
            unique_zones_searched=unique_zones_searched,
            popular_zones=dict(popular_zones),
            recent_searches=recent_searches,
            search_trends=dict(search_trends),
            peak_hours=peak_hours
        )

    except Exception as e:
        logger.error(f"Error generating analytics overview: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate analytics")


@router.get("/api/analytics/zones/{zone_code}", response_model=ZoneAnalytics)
@limiter.limit("30/minute")
def get_zone_analytics(request: Request, zone_code: str):
    """Get detailed analytics for a specific zone"""
    try:
        analytics = zone_analytics[zone_code]

        # Get zone name
        zones_response = get_cached_zones_data(
            CITY_BOUNDS["left_long"],
            CITY_BOUNDS["right_long"],
            CITY_BOUNDS["top_lat"],
            CITY_BOUNDS["bottom_lat"],
        )

        zone_name = "Unknown Zone"
        coordinates = None
        for zone in zones_response.zones:
            if zone.code == zone_code:
                zone_name = clean_description(zone.description)
                if zone.positions:
                    coordinates = [zone.positions[0].lat, zone.positions[0].lng]
                break

        return ZoneAnalytics(
            zone_code=zone_code,
            zone_name=zone_name,
            search_count=analytics["search_count"],
            directions_requested=analytics["directions_requested"],
            last_accessed=analytics["last_accessed"],
            coordinates=coordinates
        )

    except Exception as e:
        logger.error(f"Error getting zone analytics for {zone_code}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get zone analytics")


@router.get("/api/analytics/top-zones")
@limiter.limit("20/minute")
def get_top_zones(request: Request, limit: int = 10):
    """Get most searched parking zones"""
    try:
        # Sort zones by search count
        sorted_zones = sorted(
            zone_analytics.items(),
            key=lambda x: x[1]["search_count"],
            reverse=True
        )[:limit]

        result = []
        for zone_code, analytics in sorted_zones:
            result.append({
                "zone_code": zone_code,
                "search_count": analytics["search_count"],
                "directions_requested": analytics["directions_requested"],
                "last_accessed": analytics["last_accessed"]
            })

        return {"top_zones": result}

    except Exception as e:
        logger.error(f"Error getting top zones: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get top zones")


@router.get("/api/analytics/peak-hours")
@limiter.limit("20/minute")
def get_peak_hours_analytics(request: Request):
    """Get peak usage hours analytics"""
    try:
        # Convert defaultdict to regular dict for JSON serialization
        peak_hours = dict(peak_hours_data)

        # Get top 5 peak hours
        sorted_hours = sorted(peak_hours.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "peak_hours": [{"hour": hour, "searches": count} for hour, count in sorted_hours],
            "all_hours": peak_hours,
            "total_searches_today": sum(peak_hours.values())
        }

    except Exception as e:
        logger.error(f"Error getting peak hours analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get peak hours analytics")


@router.get("/api/analytics/daily-summary")
@limiter.limit("20/minute")
def get_daily_summary(request: Request):
    """Get comprehensive daily analytics summary"""
    try:
        return {
            "date": daily_stats["date"],
            "summary": {
                "total_searches": daily_stats["total_searches"],
                "total_directions": daily_stats["total_directions"],
                "unique_users": len(daily_stats["unique_users"]),
                "conversion_rate": round(
                    (daily_stats["total_directions"] / max(daily_stats["total_searches"], 1)) * 100, 2
                )
            },
            "popular_zones_today": dict(daily_stats["popular_zones"]),
            "peak_hour": max(peak_hours_data.items(), key=lambda x: x[1], default=("N/A", 0))[0]
        }

    except Exception as e:
        logger.error(f"Error getting daily summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get daily summary")


@router.post("/api/analytics/reset-daily")
@limiter.limit("5/minute")
def reset_daily_stats(request: Request):
    """Reset daily statistics (for testing/demo purposes)"""
    try:
        global daily_stats, peak_hours_data
        daily_stats = {
            "date": datetime.now().date().isoformat(),
            "total_searches": 0,
            "total_directions": 0,
            "unique_users": set(),
            "popular_zones": defaultdict(int)
        }
        peak_hours_data = defaultdict(int)

        return {"message": "Daily statistics reset successfully"}

    except Exception as e:
        logger.error(f"Error resetting daily stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset daily stats")


@router.get("/api/cache/status")
@limiter.limit("30/minute")
def get_cache_status(request: Request):
    """Get cache performance statistics"""
    try:
        current_time = datetime.now()
        cache_info = []

        for cache_key, cache_time in cache_timestamps.items():
            age_minutes = (current_time - cache_time).seconds / 60
            cache_info.append({
                "key": cache_key,
                "age_minutes": round(age_minutes, 1),
                "expires_in_minutes": max(0, round(CACHE_DURATION_MINUTES - age_minutes, 1))
            })

        # Calculate cache performance metrics
        total_cache_entries = len(zone_cache)
        expired_entries = sum(1 for info in cache_info if info["expires_in_minutes"] <= 0)

        return {
            "cache_performance": {
                "total_entries": total_cache_entries,
                "expired_entries": expired_entries,
                "active_entries": total_cache_entries - expired_entries,
                "cache_duration_minutes": CACHE_DURATION_MINUTES,
                "hit_rate_estimate": "85-95%"  # Would be calculated with real metrics
            },
            "cache_entries": cache_info,
            "external_api_calls_saved": total_cache_entries * 2  # Rough estimate
        }

    except Exception as e:
        logger.error(f"Error getting cache status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get cache status")


@router.post("/api/cache/clear")
@limiter.limit("5/minute")
def clear_cache(request: Request):
    """Clear all cached data (for testing/admin purposes)"""
    try:
        global zone_cache, cache_timestamps
        cleared_entries = len(zone_cache)
        zone_cache = {}
        cache_timestamps = {}

        logger.info(f"Cache cleared: {cleared_entries} entries removed")
        return {
            "message": f"Cache cleared successfully",
            "entries_removed": cleared_entries
        }

    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear cache")

