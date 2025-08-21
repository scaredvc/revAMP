from typing import Dict, Any
import time
from functools import lru_cache

from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings


# Global rate limiter instance used across routers
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DAY, settings.RATE_LIMIT_HOUR])


# Simple in-memory cache with TTL
class SimpleCache:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Any:
        if key in self._cache:
            item = self._cache[key]
            if time.time() < item['expires']:
                return item['value']
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        self._cache[key] = {
            'value': value,
            'expires': time.time() + ttl_seconds
        }

    def clear(self):
        self._cache.clear()


# Global cache instance
cache = SimpleCache()


# Import bounds from configuration
DEFAULT_BOUNDS = settings.DEFAULT_BOUNDS
CITY_BOUNDS = settings.CITY_BOUNDS

def get_bounds_info():
    """Get bounds information for testing and debugging"""
    return {
        "main_campus": {
            "bounds": DEFAULT_BOUNDS,
            "description": "Main UC Davis campus area",
            "center": {
                "lat": (DEFAULT_BOUNDS["top_lat"] + DEFAULT_BOUNDS["bottom_lat"]) / 2,
                "lng": (DEFAULT_BOUNDS["left_long"] + DEFAULT_BOUNDS["right_long"]) / 2
            }
        },
        "city_wide": {
            "bounds": CITY_BOUNDS,
            "description": "Entire Davis city area for filtering",
            "center": {
                "lat": (CITY_BOUNDS["top_lat"] + CITY_BOUNDS["bottom_lat"]) / 2,
                "lng": (CITY_BOUNDS["left_long"] + CITY_BOUNDS["right_long"]) / 2
            }
        }
    }

