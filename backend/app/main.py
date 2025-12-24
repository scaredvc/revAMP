from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.shared import limiter
from app.core.config import settings
from app.core.logging import logger
from app.core.database import engine
from app.models.base import Base
from app.routers.health import router as health_router
from app.routers.zones import router as zones_router
from app.core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from app.routers.auth import router as auth_router
from app.routers.parking_history import router as parking_history_router
from app.routers.favorites import router as favorites_router
from app.routers.payments import router as payments_router


# Initialize logging
logger.info("Starting revAMP API server")

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# SlowAPI limiter middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.on_event("startup")
async def startup_event():
    # Create all database tables
    # Use try/except so app can start even if DB is temporarily unavailable (e.g., sleeping Postgres)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ensured.")
    except OperationalError as e:
        logger.warning("DB not reachable on startup: %s", e)
        logger.warning("Continuing without creating tables on startup.")

@app.get("/health/db")
def health_db():
    """Health check endpoint for database connectivity"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"db": "ok"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"db": "error", "message": str(e)}, 503

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded. Please try again later.",
            "message": "Too many requests. Please wait before making more requests.",
        },
    )



app.include_router(health_router)
app.include_router(zones_router)
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(parking_history_router, prefix="/parking", tags=["Parking History"])
app.include_router(favorites_router, prefix="/favorites", tags=["Favorites"])
app.include_router(payments_router, prefix="/payments", tags=["Payments"])
