import json
import threading
import time
from collections import deque
from typing import Any, Dict, Optional

import requests

from app.core.config import settings
from app.core.logging import logger

MICRO_CACHE_TTL_SECONDS = 2
_micro_cache: Dict[str, Dict[str, Any]] = {}

CB_WINDOW_SECONDS = settings.PROXY_CIRCUIT_WINDOW_SECONDS
CB_THRESHOLD = settings.PROXY_CIRCUIT_THRESHOLD
CB_COOLDOWN_SECONDS = settings.PROXY_CIRCUIT_COOLDOWN_SECONDS
_cb_failures: deque = deque()
_cb_open_until: float = 0.0
_cb_lock = threading.Lock()


class ProxyConfigurationError(Exception):
    """Raised when the proxy configuration is missing or invalid."""


class ProxyCircuitOpen(Exception):
    """Raised when the proxy circuit breaker is open."""


class ProxyResponse:
    def __init__(self, status_code: int, headers: Dict[str, Any], text: str):
        self.status_code = status_code
        self.headers = headers
        self._text = text

    @property
    def text(self) -> str:
        return self._text

    @property
    def content(self) -> bytes:
        return self._text.encode("utf-8", errors="replace")

    def json(self) -> Any:
        return json.loads(self._text)


def _build_query(cmd: str, params: Dict[str, Any]) -> Dict[str, str]:
    query = {"cmd": cmd}
    for key, value in params.items():
        if value is None:
            continue
        query[key] = str(value)
    return query


def _cache_key(cmd: str, params: Dict[str, Any]) -> str:
    parts = [cmd] + [f"{k}={params[k]}" for k in sorted(params)]
    return "|".join(parts)


def _microcache_get(cmd: str, params: Dict[str, Any]) -> Optional[ProxyResponse]:
    key = _cache_key(cmd, params)
    entry = _micro_cache.get(key)
    if not entry:
        return None
    if time.time() > entry["expires"]:
        _micro_cache.pop(key, None)
        return None
    logger.info("Upstream proxy microcache hit: cmd=%s", cmd)
    return entry["response"]


def _microcache_set(cmd: str, params: Dict[str, Any], response: ProxyResponse) -> None:
    key = _cache_key(cmd, params)
    _micro_cache[key] = {
        "response": response,
        "expires": time.time() + MICRO_CACHE_TTL_SECONDS,
    }


def _prune_failures(now: float) -> None:
    while _cb_failures and now - _cb_failures[0] > CB_WINDOW_SECONDS:
        _cb_failures.popleft()


def ensure_circuit_allows() -> None:
    """Raise if the circuit is open (too many recent failures)."""
    now = time.time()
    with _cb_lock:
        if now < _cb_open_until:
            raise ProxyCircuitOpen("proxy circuit open")
        _prune_failures(now)


def record_proxy_failure(reason: str = "") -> None:
    """Record a proxy failure and open the circuit if threshold exceeded."""
    global _cb_open_until
    now = time.time()
    with _cb_lock:
        _prune_failures(now)
        _cb_failures.append(now)
        if len(_cb_failures) >= CB_THRESHOLD:
            _cb_open_until = now + CB_COOLDOWN_SECONDS
            logger.warning(
                "Proxy circuit opened after %s failures (reason: %s); cooling down for %ss",
                len(_cb_failures),
                reason,
                CB_COOLDOWN_SECONDS,
            )


def record_proxy_success() -> None:
    """Reset the circuit on success."""
    global _cb_open_until
    with _cb_lock:
        _cb_failures.clear()
        _cb_open_until = 0.0


def call_upstream(cmd: str, params: Dict[str, Any], timeout: Optional[int] = None) -> ProxyResponse:
    """
    Call the AWS Lambda proxy instead of the upstream API directly.

    Args:
        cmd: The upstream command to execute.
        params: Parameters expected by the upstream for this command.
        timeout: Optional timeout override for the request.
    """
    if not cmd:
        raise ProxyConfigurationError("cmd is required for upstream calls")

    proxy_url = settings.UPSTREAM_PROXY_URL
    if not proxy_url:
        raise ProxyConfigurationError("UPSTREAM_PROXY_URL is not configured")

    token = settings.UPSTREAM_PROXY_TOKEN
    if not token:
        raise ProxyConfigurationError("UPSTREAM_PROXY_TOKEN is not configured")

    headers = {
        "Accept": "application/json",
        "x-proxy-token": token,
    }

    query = _build_query(cmd, params)

    cached = _microcache_get(cmd, query)
    if cached:
        return cached

    ensure_circuit_allows()

    logger.info("Routing upstream call through proxy: cmd=%s", cmd)
    resp = requests.get(
        proxy_url,
        params=query,
        headers=headers,
        timeout=timeout or settings.EXTERNAL_API_TIMEOUT,
    )

    normalized_headers = {k.lower(): v for k, v in resp.headers.items()}
    proxy_resp = ProxyResponse(
        status_code=resp.status_code,
        headers=normalized_headers,
        text=resp.text,
    )
    _microcache_set(cmd, query, proxy_resp)
    return proxy_resp
