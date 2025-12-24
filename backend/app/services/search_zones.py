import cloudscraper
from fastapi import HTTPException
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
        logger.info(f"Cache hit for bounds: {cache_key}")
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
        
        # Add headers to make request look more browser-like
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json,text/plain,*/*",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        response = scraper.post(
            BASE_URL, 
            data=payload,  # IMPORTANT: data= for form posts, not json=
            headers=headers,
            timeout=settings.EXTERNAL_API_TIMEOUT
        )
        
        logger.info(f"Response status: {response.status_code}")
        content_type = (response.headers.get("content-type") or "").lower()
        logger.info(f"Response content-type: {content_type}")
        
        # Check for HTTP errors - DO NOT cache these
        if response.status_code != 200:
            error_preview = (response.text or "")[:200]
            logger.error(f"External API returned status {response.status_code}: {error_preview}")
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "Upstream blocked or failed",
                    "upstream_status": response.status_code,
                    "content_type": content_type,
                    "preview": error_preview,
                },
            )
        
        result = response.text
        
        if not result:
            logger.error("Empty response from external API")
            raise HTTPException(
                status_code=502,
                detail={"error": "Empty response from external API"}
            )
        
        # Only parse/cache JSON responses - DO NOT cache HTML/errors
        if "application/json" not in content_type:
            error_preview = result[:200]
            logger.error(f"External API returned non-JSON (content-type: {content_type}): {error_preview}")
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "Upstream returned non-JSON",
                    "content_type": content_type,
                    "preview": error_preview,
                },
            )
        
        # Validate it's actually JSON before caching
        try:
            import json
            json.loads(result)  # Test if it's valid JSON
        except json.JSONDecodeError:
            logger.error(f"Response claims to be JSON but isn't valid: {result[:200]}")
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "Invalid JSON response from upstream",
                    "preview": result[:200],
                },
            )
        
        # Only cache successful, valid JSON responses
        cache.set(cache_key, result, ttl_seconds=settings.CACHE_TTL_SECONDS)
        logger.info("Successfully cached valid JSON response")

        return result

    except HTTPException:
        # Re-raise HTTPExceptions (these are already properly formatted)
        raise
    except Exception as e:
        logger.error(f"Error calling external API: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Failed to fetch from external API",
                "message": str(e)
            }
        )

