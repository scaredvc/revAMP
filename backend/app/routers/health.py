from fastapi import APIRouter
from app.schemas.zones import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok"}

