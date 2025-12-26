from datetime import datetime

from sqlalchemy import Column, DateTime, String, JSON
from sqlalchemy.dialects.postgresql import JSONB

from .base import Base


class ZoneSnapshot(Base):
    __tablename__ = "zone_snapshots"

    bounds_key = Column(String, primary_key=True, index=True)
    data = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
