# models/parking_history.py
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class ParkingHistory(Base, TimestampMixin):
    __tablename__ = "parking_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Parking details
    zone_code = Column(String, nullable=False)
    zone_description = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Session details
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # Calculated field

    # Payment details
    amount_paid = Column(Float, default=0.0)
    payment_method = Column(String, nullable=True)  # "cash", "card", "mobile"
    payment_id = Column(String, nullable=True)  # Reference to payment record

    # Status
    status = Column(String, default="active")  # "active", "completed", "cancelled"

    # Additional info
    notes = Column(Text, nullable=True)  # User notes about the parking session

    # Relationships
    user = relationship("User", back_populates="parking_history")
    payment = relationship("Payment", back_populates="parking_session", uselist=False)