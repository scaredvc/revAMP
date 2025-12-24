import cloudscraper
import time
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

    # Make API call if not cached
    logger.info(f"Making request to external API: {BASE_URL}")
    scraper = cloudscraper.create_scraper(
        browser={"browser": "chrome", "platform": "windows", "mobile": False}
    )
    payload = {
        "cmd": "get_zones_in_frame",
        "left_long": str(left_long),
        "right_long": str(right_long),
        "top_lat": str(top_lat),
        "bottom_lat": str(bottom_lat),
    }

    headers = {
        "User-Agent": "revamp/1.0 (+contact@example.com)",
        "Accept": "application/json,text/plain,*/*",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    last_error_detail = None

    for attempt in range(3):
        try:
            response = scraper.post(
                BASE_URL,
                data=payload,  # IMPORTANT: data= for form posts, not json=
                headers=headers,
                timeout=settings.EXTERNAL_API_TIMEOUT,
            )

            logger.info(f"Response status: {response.status_code}")
            content_type = (response.headers.get("content-type") or "").lower()
            logger.info(f"Response content-type: {content_type}")

            # Check for HTTP errors - DO NOT cache these
            if response.status_code != 200:
                error_preview = (response.text or "")[:200]
                last_error_detail = {
                    "error": "Upstream blocked or failed",
                    "upstream_status": response.status_code,
                    "content_type": content_type,
                    "preview": error_preview,
                }
                logger.warning(f"External API status {response.status_code}: {error_preview}")
                raise HTTPException(status_code=502, detail=last_error_detail)

            result = response.text

            if not result:
                last_error_detail = {"error": "Empty response from external API"}
                raise HTTPException(status_code=502, detail=last_error_detail)

            # Only parse/cache JSON responses - DO NOT cache HTML/errors
            if "application/json" not in content_type:
                error_preview = result[:200]
                last_error_detail = {
                    "error": "Upstream returned non-JSON",
                    "content_type": content_type,
                    "preview": error_preview,
                }
                raise HTTPException(status_code=502, detail=last_error_detail)

            # Validate it's actually JSON before caching
            try:
                import json
                json.loads(result)  # Test if it's valid JSON
            except json.JSONDecodeError:
                last_error_detail = {
                    "error": "Invalid JSON response from upstream",
                    "preview": result[:200],
                }
                raise HTTPException(status_code=502, detail=last_error_detail)

            # Only cache successful, valid JSON responses
            cache.set(cache_key, result, ttl_seconds=settings.CACHE_TTL_SECONDS)
            logger.info("Successfully cached valid JSON response")
            return result

        except HTTPException as http_err:
            last_error_detail = http_err.detail
            backoff = 0.5 * (2 ** attempt)
            logger.warning(f"External API attempt {attempt+1} failed; retrying in {backoff}s")
            time.sleep(backoff)
        except Exception as e:
            last_error_detail = {"error": "Failed to fetch from external API", "message": str(e)}
            backoff = 0.5 * (2 ** attempt)
            logger.warning(f"External API attempt {attempt+1} crashed: {e}; retrying in {backoff}s")
            time.sleep(backoff)

    # All attempts failed
    logger.error(f"Error calling external API after retries: {last_error_detail}")
    raise HTTPException(status_code=502, detail=last_error_detail or {"error": "External API failed"})

