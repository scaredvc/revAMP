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
from app.routers.auth import router as auth_router
# from app.routers.parking_history import router as parking_history_router  # Commented out - needs database
# from app.routers.favorites import router as favorites_router  # Commented out - needs database
# from app.routers.payments import router as payments_router  # Commented out - no payments yet


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
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

@app.get("/test-db")
async def test_database(db: Session = Depends(get_db)):
    try:
        # Try a simple query to test database connection
        from app.models.user import User
        user_count = db.query(User).count()
        return {"status": "success", "message": f"Database connected! Users: {user_count}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

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
# app.include_router(parking_history_router, prefix="/parking", tags=["Parking History"])  # Commented out - needs database
# app.include_router(favorites_router, prefix="/favorites", tags=["Favorites"])  # Commented out - needs database
# app.include_router(payments_router, prefix="/payments", tags=["Payments"])  # Commented out - no payments yet
