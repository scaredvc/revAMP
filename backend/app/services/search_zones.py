import random
import time
from concurrent.futures import Future
from dataclasses import dataclass
from datetime import datetime
from threading import Lock
from typing import Any, Dict, Optional

import requests

from app.core.config import settings
from app.core.logging import logger
from app.core.shared import cache
from app.services.zone_snapshots import make_bounds_key
from app.services.upstream_proxy import (
    ProxyCircuitOpen,
    ProxyConfigurationError,
    call_upstream,
    record_proxy_failure,
    record_proxy_success,
)

# Things we should NOT retry (hard block / auth / forbidden)
NON_RETRY_STATUSES = {401, 403}

# Things we MAY retry (transient)
RETRY_STATUSES = {408, 429, 500, 502, 503, 504}


class UpstreamBlocked(Exception):
    def __init__(self, status: int, content_type: str, preview: str):
        super().__init__("Upstream blocked")
        self.status = status
        self.content_type = content_type
        self.preview = preview


class UpstreamFailed(Exception):
    def __init__(self, status: Optional[int], reason: str):
        super().__init__("Upstream failed")
        self.status = status
        self.reason = reason


@dataclass
class ZoneFetchResult:
    data: Dict[str, Any]
    fetched_at: datetime
    from_cache: bool = False


_singleflight_lock = Lock()
_inflight_requests: Dict[str, Future] = {}


def _preview_text(resp: requests.Response, limit: int = 300) -> str:
    try:
        text = resp.text
    except Exception:
        return "<no text>"
    text = text.replace("\r", "")
    return text[:limit]


def _is_json_response(resp: requests.Response) -> bool:
    content_type = (resp.headers.get("content-type") or "").lower()
    return "application/json" in content_type or "text/json" in content_type


def _backoff_seconds(attempt: int) -> float:
    # exponential backoff with jitter: 0.5, 1.0, 2.0, 4.0 ...
    base = 0.5 * (2 ** (attempt - 1))
    jitter = random.uniform(0, 0.15 * base)
    return base + jitter


def fetch_zones_from_upstream(payload: Dict[str, Any], max_attempts: int = 3) -> Dict[str, Any]:
    last_err: Optional[Exception] = None
    cmd = payload.get("cmd")
    params = {key: value for key, value in payload.items() if key != "cmd"}

    for attempt in range(1, max_attempts + 1):
        try:
            response = call_upstream(
                cmd=cmd or "",
                params=params,
                timeout=settings.EXTERNAL_API_TIMEOUT,
            )

            status = response.status_code
            content_type = response.headers.get("content-type", "")

            if status in NON_RETRY_STATUSES:
                record_proxy_failure(f"non-retry-status-{status}")
                raise UpstreamBlocked(status=status, content_type=content_type, preview=_preview_text(response))

            if not _is_json_response(response):
                record_proxy_failure("non-json-response")
                raise UpstreamBlocked(status=status, content_type=content_type, preview=_preview_text(response))

            if status in RETRY_STATUSES:
                record_proxy_failure(f"retryable-status-{status}")
                last_err = UpstreamFailed(status=status, reason=f"retryable status {status}")
            else:
                response.raise_for_status()
                try:
                    record_proxy_success()
                    return response.json()
                except ValueError:
                    record_proxy_failure("json-parse-failed")
                    raise UpstreamBlocked(status=status, content_type=content_type, preview=_preview_text(response))

        except ProxyCircuitOpen as e:
            last_err = UpstreamFailed(status=None, reason=str(e))
            break

        except ProxyConfigurationError as e:
            logger.error("Proxy configuration error: %s", e)
            raise

        except UpstreamBlocked as e:
            record_proxy_failure("upstream-blocked")
            logger.warning(
                "Upstream blocked (status=%s, content_type=%s): %s",
                e.status,
                e.content_type,
                e.preview[:120],
            )
            raise

        except (requests.Timeout, requests.ConnectionError) as e:
            record_proxy_failure("timeout-or-connection")
            last_err = e

        except requests.HTTPError as e:
            status_code = e.response.status_code if e.response else None
            record_proxy_failure(f"http-error-{status_code}")
            last_err = UpstreamFailed(status=status_code, reason=str(e))

        except Exception as e:
            last_err = UpstreamFailed(status=getattr(e, "status", None), reason=str(e))

        if attempt < max_attempts:
            backoff = _backoff_seconds(attempt)
            logger.warning("Upstream proxy attempt %s failed; retrying in %.2fs", attempt, backoff)
            time.sleep(backoff)
        else:
            logger.error("Upstream proxy attempt %s failed; no more retries", attempt)

    if isinstance(last_err, Exception):
        raise last_err
    raise UpstreamFailed(status=None, reason="unknown failure")


def search_zones(left_long: float, right_long: float, top_lat: float, bottom_lat: float) -> ZoneFetchResult:
    """Fetch parking zones within given bounds with lightweight caching"""
    cache_key = f"zones_{make_bounds_key(left_long, right_long, top_lat, bottom_lat, precision=5)}"

    cached_result: Optional[ZoneFetchResult] = cache.get(cache_key)
    if cached_result:
        logger.info(f"Cache hit for bounds: {cache_key}")
        return ZoneFetchResult(
            data=cached_result.data,
            fetched_at=cached_result.fetched_at,
            from_cache=True,
        )

    payload = {
        "cmd": "get_zones_in_frame",
        "left_long": str(left_long),
        "right_long": str(right_long),
        "top_lat": str(top_lat),
        "bottom_lat": str(bottom_lat),
    }

    join_future: Optional[Future] = None
    future: Optional[Future] = None
    with _singleflight_lock:
        in_flight = _inflight_requests.get(cache_key)
        if in_flight:
            join_future = in_flight
        else:
            future = Future()
            _inflight_requests[cache_key] = future

    if join_future:
        logger.info("Singleflight join for bounds: %s", cache_key)
        return join_future.result()

    assert future is not None

    try:
        logger.info("Requesting zones via upstream proxy (cmd=%s)", payload["cmd"])
        data = fetch_zones_from_upstream(payload)
        result = ZoneFetchResult(data=data, fetched_at=datetime.utcnow(), from_cache=False)

        cache.set(cache_key, result, ttl_seconds=settings.CACHE_TTL_SECONDS)
        logger.info("Cached upstream response for %s", cache_key)

        future.set_result(result)
        return result
    except Exception as exc:
        future.set_exception(exc)
        raise
    finally:
        with _singleflight_lock:
            _inflight_requests.pop(cache_key, None)

