# models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from passlib.context import CryptContext
from .base import Base, TimestampMixin

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # User preferences
    preferred_zones = Column(Text, nullable=True)  # JSON string of preferred zone codes
    notification_enabled = Column(Boolean, default=True)
    max_parking_duration = Column(Integer, default=480)  # Default 8 hours in minutes

    # Relationships
    parking_history = relationship("ParkingHistory", back_populates="user")
    favorite_zones = relationship("FavoriteZone", back_populates="user")
    payments = relationship("Payment", back_populates="user")

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    @property
    def preferences(self):
        """Get user preferences as dict"""
        import json
        try:
            return json.loads(self.preferred_zones or "[]")
        except:
            return []

    @preferences.setter
    def preferences(self, value):
        """Set user preferences as JSON string"""
        import json
        self.preferred_zones = json.dumps(value)