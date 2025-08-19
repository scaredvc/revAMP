from fastapi import APIRouter
from app.schemas.zones import HeathResponse

router = APIRouter()

@router.get("/health", response_model=HeathResponse)
def health():
    return {"status": "ok"}

