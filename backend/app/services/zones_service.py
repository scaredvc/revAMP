from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.schemas.zones import ExternalAPIResponse
from app.services.search_zones import (
    ZoneFetchResult,
    UpstreamBlocked,
    UpstreamFailed,
    search_zones,
)
from app.services.zone_snapshots import get_snapshot, make_bounds_key, upsert_snapshot


@dataclass
class ZoneDataResult:
    data: ExternalAPIResponse
    stale: bool = False
    stale_reason: Optional[str] = None
    bounds_key: Optional[str] = None
    fetched_at: Optional[str] = None
    upstream_status: Optional[int] = None


def _parse_external_response(payload: dict, bounds_key: str) -> ExternalAPIResponse:
    try:
        return ExternalAPIResponse(**payload)
    except Exception as validation_error:
        logger.error(
            "External API response validation failed for %s: %s", bounds_key, validation_error
        )
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Invalid API Response Structure",
                "message": str(validation_error),
            },
        )


def fetch_zones_with_snapshot(
    left_long: float,
    right_long: float,
    top_lat: float,
    bottom_lat: float,
    db: Session,
) -> ZoneDataResult:
    bounds_key = make_bounds_key(left_long, right_long, top_lat, bottom_lat, precision=5)

    try:
        fetch_result: ZoneFetchResult = search_zones(
            left_long, right_long, top_lat, bottom_lat
        )
        response_model = _parse_external_response(fetch_result.data, bounds_key)

        try:
            upsert_snapshot(
                db,
                bounds_key=bounds_key,
                data=fetch_result.data,
                fetched_at=fetch_result.fetched_at,
            )
        except Exception as exc:
            logger.warning("Failed to upsert zone snapshot for %s: %s", bounds_key, exc)

        return ZoneDataResult(
            data=response_model,
            stale=False,
            bounds_key=bounds_key,
            fetched_at=fetch_result.fetched_at.isoformat(),
        )

    except UpstreamBlocked as exc:
        cached = get_snapshot(db, bounds_key)
        if cached:
            cached_data, cached_fetched_at = cached
            response_model = _parse_external_response(cached_data, bounds_key)

            logger.warning(
                "Serving stale snapshot for %s due to upstream block (status=%s)",
                bounds_key,
                exc.status,
            )
            return ZoneDataResult(
                data=response_model,
                stale=True,
                stale_reason="upstream_blocked",
                bounds_key=bounds_key,
                fetched_at=cached_fetched_at,
                upstream_status=exc.status,
            )

        raise HTTPException(
            status_code=503,
            detail={
                "error": "upstream_blocked_and_no_cache",
                "upstream_status": exc.status,
                "content_type": exc.content_type,
                "preview": exc.preview,
            },
        )

    except Exception as exc:
        cached = get_snapshot(db, bounds_key)
        if cached:
            cached_data, cached_fetched_at = cached
            response_model = _parse_external_response(cached_data, bounds_key)

            logger.warning(
                "Serving stale snapshot for %s due to upstream error: %s",
                bounds_key,
                exc,
            )
            return ZoneDataResult(
                data=response_model,
                stale=True,
                stale_reason="upstream_error",
                bounds_key=bounds_key,
                fetched_at=cached_fetched_at,
                upstream_status=getattr(exc, "status", None),
            )

        raise HTTPException(
            status_code=503,
            detail={"error": "upstream_failed", "reason": str(exc)},
        )
