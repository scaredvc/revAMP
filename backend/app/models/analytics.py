from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean
from datetime import datetime
from .base import Base, TimestampMixin

class SearchEvent(Base, TimestampMixin):
    """Track every search/click on a parking zone"""
    __tablename__ = "search_events"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Zone information
    zone_code = Column(String, nullable=False, index=True)
    zone_name = Column(String, nullable=True)
    
    # User tracking (anonymous)
    client_ip = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    session_id = Column(String, nullable=True, index=True)
    
    # Event details
    event_type = Column(String, nullable=False)  # "search" or "directions"
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Additional metadata
    referrer = Column(String, nullable=True)
    device_type = Column(String, nullable=True)  # mobile, desktop, tablet

class ZonePopularity(Base, TimestampMixin):
    """Aggregated zone popularity data for faster queries"""
    __tablename__ = "zone_popularity"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_code = Column(String, nullable=False, unique=True, index=True)
    zone_name = Column(String, nullable=True)
    
    # Counters
    total_searches = Column(Integer, default=0)
    total_directions = Column(Integer, default=0)
    
    # Metrics
    conversion_rate = Column(Float, default=0.0)  # directions/searches
    last_accessed = Column(DateTime, nullable=True)
    
    # Trending data
    searches_today = Column(Integer, default=0)
    searches_this_week = Column(Integer, default=0)
    searches_this_month = Column(Integer, default=0)

class DailyStats(Base):
    """Daily aggregated statistics"""
    __tablename__ = "daily_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False, unique=True, index=True)  # YYYY-MM-DD format
    
    # Daily totals
    total_searches = Column(Integer, default=0)
    total_directions = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    
    # Peak hours data
    peak_hour = Column(Integer, nullable=True)  # 0-23
    peak_hours_data = Column(Text, nullable=True)  # JSON string
    
    # Top zones data
    top_zones_data = Column(Text, nullable=True)  # JSON string
    
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSession(Base, TimestampMixin):
    """Track user sessions for analytics"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False, unique=True, index=True)
    
    # User identification
    client_ip = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Session data
    start_time = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Session metrics
    total_searches = Column(Integer, default=0)
    total_directions = Column(Integer, default=0)
    zones_visited = Column(Text, nullable=True)