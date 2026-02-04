import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import settings to ensure .env is loaded
from app.core.config import settings

# Get database URL from settings (which loads from .env)
DATABASE_URL = settings.DATABASE_URL

# Handle Render's postgres:// vs postgresql:// URL format
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
if DATABASE_URL:
    # Production database (Render Postgres)
    # Render Postgres requires explicit SSL parameters
    connect_args = {}
    if "render.com" in DATABASE_URL:
        # Ensure sslmode is in URL if not already present
        if "sslmode" not in DATABASE_URL:
            separator = "&" if "?" in DATABASE_URL else "?"
            DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"
        # Also pass as connect_args for psycopg2
        connect_args = {
            "sslmode": "require",
            "connect_timeout": 10,
        }
    
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300,    # Recycle connections after 5 minutes (prevents stale connections)
        pool_size=5,         # Maintain 5 connections in the pool
        max_overflow=10,     # Allow up to 10 overflow connections
        connect_args=connect_args,
    )
else:
    # Fallback to SQLite for local development
    SQLITE_DATABASE_URL = "sqlite:///./parking_zones.db"
    engine = create_engine(
        SQLITE_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()