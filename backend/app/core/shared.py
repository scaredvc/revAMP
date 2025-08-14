from typing import Dict

from slowapi import Limiter
from slowapi.util import get_remote_address


# Global rate limiter instance used across routers
limiter = Limiter(key_func=get_remote_address, default_limits=["200/day", "50/hour"])


# Default UC Davis bounds
DEFAULT_BOUNDS: Dict[str, float] = {
    "left_long": -121.75565688680798,
    "right_long": -121.73782556127698,
    "top_lat": 38.53997670732033,
    "bottom_lat": 38.52654855404775,
}

