# routers/favorites.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.models.favorite_zone import FavoriteZone
from app.schemas.favorites import FavoriteZoneCreate, FavoriteZoneUpdate, FavoriteZoneResponse, FavoriteReorderRequest
from app.core.shared import safe_rate_limit

router = APIRouter()

@router.post("/", response_model=FavoriteZoneResponse)
@safe_rate_limit("30/minute")
async def add_favorite_zone(
    request: Request,
    favorite_data: FavoriteZoneCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a zone to user's favorites"""
    # Check if already favorited
    existing = db.query(FavoriteZone).filter(
        FavoriteZone.user_id == current_user.id,
        FavoriteZone.zone_code == favorite_data.zone_code
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Zone already in favorites")

    # Get max display order
    max_order = db.query(FavoriteZone).filter(
        FavoriteZone.user_id == current_user.id
    ).count()

    favorite = FavoriteZone(
        user_id=current_user.id,
        zone_code=favorite_data.zone_code,
        zone_description=favorite_data.zone_description,
        notes=favorite_data.notes,
        display_order=max_order
    )

    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite

@router.get("/", response_model=List[FavoriteZoneResponse])
@safe_rate_limit("60/minute")
async def get_favorite_zones(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's favorite zones"""
    favorites = db.query(FavoriteZone).filter(
        FavoriteZone.user_id == current_user.id
    ).order_by(FavoriteZone.display_order).all()
    return favorites

@router.patch("/reorder")
@safe_rate_limit("30/minute")
async def reorder_favorites(
    request: Request,
    reorder_data: FavoriteReorderRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Bulk-update display_order for the user's favorites"""
    favorite_ids = [item.id for item in reorder_data.order]
    favorites = db.query(FavoriteZone).filter(
        FavoriteZone.id.in_(favorite_ids),
        FavoriteZone.user_id == current_user.id
    ).all()

    fav_map = {f.id: f for f in favorites}
    for item in reorder_data.order:
        if item.id not in fav_map:
            raise HTTPException(status_code=404, detail=f"Favorite {item.id} not found")
        fav_map[item.id].display_order = item.display_order

    db.commit()
    return {"message": "Favorites reordered successfully"}

@router.put("/{favorite_id}", response_model=FavoriteZoneResponse)
@safe_rate_limit("30/minute")
async def update_favorite_zone(
    request: Request,
    favorite_id: int,
    favorite_data: FavoriteZoneUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a favorite zone"""
    favorite = db.query(FavoriteZone).filter(
        FavoriteZone.id == favorite_id,
        FavoriteZone.user_id == current_user.id
    ).first()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite zone not found")

    update_data = favorite_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(favorite, field):
            setattr(favorite, field, value)

    db.commit()
    db.refresh(favorite)
    return favorite

@router.delete("/{favorite_id}")
@safe_rate_limit("30/minute")
async def remove_favorite_zone(
    request: Request,
    favorite_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a zone from user's favorites"""
    favorite = db.query(FavoriteZone).filter(
        FavoriteZone.id == favorite_id,
        FavoriteZone.user_id == current_user.id
    ).first()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite zone not found")

    db.delete(favorite)
    db.commit()
    return {"message": "Favorite zone removed successfully"}

@router.post("/{favorite_id}/use")
@safe_rate_limit("60/minute")
async def record_zone_usage(
    request: Request,
    favorite_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Record that a favorite zone was used"""
    from datetime import datetime

    favorite = db.query(FavoriteZone).filter(
        FavoriteZone.id == favorite_id,
        FavoriteZone.user_id == current_user.id
    ).first()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite zone not found")

    favorite.times_used += 1
    favorite.last_used = datetime.utcnow()

    db.commit()
    db.refresh(favorite)
    return {"message": "Zone usage recorded", "times_used": favorite.times_used}
