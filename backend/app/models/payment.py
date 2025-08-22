# models/payment.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parking_history_id = Column(Integer, ForeignKey("parking_history.id"), nullable=True)

    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    payment_method = Column(String, nullable=False)  # "stripe", "paypal", "cash"

    # External payment processor details
    stripe_payment_intent_id = Column(String, nullable=True)
    stripe_charge_id = Column(String, nullable=True)
    paypal_transaction_id = Column(String, nullable=True)

    # Status
    status = Column(String, default="pending")  # "pending", "completed", "failed", "refunded"

    # Additional info
    description = Column(Text, nullable=True)
    metadata = Column(Text, nullable=True)  # JSON string for additional data

    # Relationships
    user = relationship("User", back_populates="payments")
    parking_session = relationship("ParkingHistory", back_populates="payment")

    @property
    def payment_metadata(self):
        """Get payment metadata as dict"""
        import json
        try:
            return json.loads(self.metadata or "{}")
        except:
            return {}

    @payment_metadata.setter
    def payment_metadata(self, value):
        """Set payment metadata as JSON string"""
        import json
        self.metadata = json.dumps(value)