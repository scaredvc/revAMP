import cloudscraper
from app.core.shared import cache
from app.core.config import settings
from app.core.logging import logger

BASE_URL = settings.EXTERNAL_API_URL


def search_zones(left_long: float, right_long: float, top_lat: float, bottom_lat: float) -> str:
    """Search for parking zones within given bounds"""
    # Create cache key from bounds
    cache_key = f"zones_{left_long}_{right_long}_{top_lat}_{bottom_lat}"

    # Check cache first
    cached_result = cache.get(cache_key)
    if cached_result:
        return cached_result

    try:
        # Make API call if not cached
        logger.info(f"Making request to external API: {BASE_URL}")
        scraper = cloudscraper.create_scraper()
        payload = {
            "cmd": "get_zones_in_frame",
            "left_long": str(left_long),
            "right_long": str(right_long),
            "top_lat": str(top_lat),
            "bottom_lat": str(bottom_lat),
        }
        logger.info(f"Request payload: {payload}")
        
        response = scraper.post(BASE_URL, data=payload, timeout=settings.EXTERNAL_API_TIMEOUT)
        logger.info(f"Response status: {response.status_code}")
        result = response.text
        logger.info(f"Response text length: {len(result) if result else 0}")

        if not result:
            logger.error("Empty response from external API")
            raise ValueError("Empty response from external API")

        # Cache the result using configured TTL
        cache.set(cache_key, result, ttl_seconds=settings.CACHE_TTL_SECONDS)
        logger.info("Successfully cached the result")

        return result

    except Exception as e:
        logger.error(f"Error calling external API: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise

