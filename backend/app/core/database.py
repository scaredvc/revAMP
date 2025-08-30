import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

# Handle Render's postgres:// vs postgresql:// URL format
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
if DATABASE_URL:
    # Production database
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,   # Recycle connections after 1 hour
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