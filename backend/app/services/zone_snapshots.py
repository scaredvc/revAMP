from datetime import datetime
from typing import Any, Dict, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.zone_snapshot import ZoneSnapshot


def make_bounds_key(left: float, right: float, top: float, bottom: float, precision: int = 5) -> str:
    """Normalize bounds into a stable cache key"""
    return "_".join(
        [
            f"{round(left, precision):.{precision}f}",
            f"{round(right, precision):.{precision}f}",
            f"{round(top, precision):.{precision}f}",
            f"{round(bottom, precision):.{precision}f}",
        ]
    )


def upsert_snapshot(
    db: Session,
    bounds_key: str,
    data: Dict[str, Any],
    fetched_at: Optional[datetime] = None,
) -> None:
    """Store or update the latest snapshot for a bounds key"""
    timestamp = fetched_at or datetime.utcnow()
    try:
        snapshot = (
            db.query(ZoneSnapshot)
            .filter(ZoneSnapshot.bounds_key == bounds_key)
            .one_or_none()
        )

        if snapshot:
            snapshot.data = data
            snapshot.fetched_at = timestamp
        else:
            db.add(ZoneSnapshot(bounds_key=bounds_key, data=data, fetched_at=timestamp))

        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to upsert zone snapshot for %s: %s", bounds_key, exc)
        raise


def get_snapshot(db: Session, bounds_key: str) -> Optional[Tuple[Dict[str, Any], str]]:
    """Return stored snapshot data and timestamp (ISO) if present"""
    snapshot = (
        db.query(ZoneSnapshot)
        .filter(ZoneSnapshot.bounds_key == bounds_key)
        .one_or_none()
    )
    if not snapshot:
        return None

    return snapshot.data, snapshot.fetched_at.isoformat()
