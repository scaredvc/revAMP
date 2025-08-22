# models/favorite_zone.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class FavoriteZone(Base, TimestampMixin):
    __tablename__ = "favorite_zones"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    zone_code = Column(String, nullable=False)
    zone_description = Column(String, nullable=True)

    # User notes about this favorite zone
    notes = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)  # For ordering favorites

    # Usage statistics
    times_used = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="favorite_zones")

    __table_args__ = (
        {'sqlite_autoincrement': True},
    )