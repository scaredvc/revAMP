# routers/parking_history.py
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.models.parking_history import ParkingHistory
from app.schemas.parking_history import (
    ParkingHistoryCreate, ParkingHistoryUpdate,
    ParkingHistoryResponse, ParkingHistoryStats
)
from app.core.shared import safe_rate_limit

router = APIRouter()

@router.post("/start", response_model=ParkingHistoryResponse)
@safe_rate_limit("30/minute")
async def start_parking_session(
    request: Request,
    session_data: ParkingHistoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a new parking session"""
    parking_session = ParkingHistory(
        user_id=current_user.id,
        zone_code=session_data.zone_code,
        zone_description=session_data.zone_description,
        latitude=session_data.latitude,
        longitude=session_data.longitude,
        start_time=datetime.utcnow(),
        status="active",
        notes=session_data.notes
    )

    db.add(parking_session)
    db.commit()
    db.refresh(parking_session)
    return parking_session

@router.put("/end/{session_id}", response_model=ParkingHistoryResponse)
@safe_rate_limit("30/minute")
async def end_parking_session(
    request: Request,
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """End a parking session"""
    session = db.query(ParkingHistory).filter(
        ParkingHistory.id == session_id,
        ParkingHistory.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Parking session not found")

    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    session.end_time = datetime.utcnow()
    session.duration_minutes = int((session.end_time - session.start_time).total_seconds() / 60)
    session.status = "completed"

    db.commit()
    db.refresh(session)
    return session

@router.get("/", response_model=List[ParkingHistoryResponse])
@safe_rate_limit("60/minute")
async def get_parking_history(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's parking history"""
    query = db.query(ParkingHistory).filter(ParkingHistory.user_id == current_user.id)

    if status_filter:
        query = query.filter(ParkingHistory.status == status_filter)

    sessions = query.order_by(ParkingHistory.start_time.desc()).offset(skip).limit(limit).all()
    return sessions

@router.get("/active", response_model=List[ParkingHistoryResponse])
@safe_rate_limit("60/minute")
async def get_active_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's active parking sessions"""
    sessions = db.query(ParkingHistory).filter(
        ParkingHistory.user_id == current_user.id,
        ParkingHistory.status == "active"
    ).all()
    return sessions

@router.get("/stats", response_model=ParkingHistoryStats)
@safe_rate_limit("30/minute")
async def get_parking_stats(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get parking statistics for the user"""
    sessions = db.query(ParkingHistory).filter(
        ParkingHistory.user_id == current_user.id,
        ParkingHistory.status == "completed"
    ).all()

    if not sessions:
        return ParkingHistoryStats(
            total_sessions=0,
            total_duration=0,
            avg_duration=0,
            favorite_zone=None,
            total_paid=0.0
        )

    total_sessions = len(sessions)
    total_duration = sum(session.duration_minutes or 0 for session in sessions)
    avg_duration = total_duration // total_sessions if total_sessions > 0 else 0
    total_paid = sum(session.amount_paid or 0 for session in sessions)

    # Find favorite zone
    zone_counts = {}
    for session in sessions:
        zone_counts[session.zone_code] = zone_counts.get(session.zone_code, 0) + 1
    favorite_zone = max(zone_counts.items(), key=lambda x: x[1])[0] if zone_counts else None

    return ParkingHistoryStats(
        total_sessions=total_sessions,
        total_duration=total_duration,
        avg_duration=avg_duration,
        favorite_zone=favorite_zone,
        total_paid=total_paid
    )

@router.delete("/{session_id}")
@safe_rate_limit("10/minute")
async def delete_parking_session(
    request: Request,
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a parking session (only for inactive sessions)"""
    session = db.query(ParkingHistory).filter(
        ParkingHistory.id == session_id,
        ParkingHistory.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Parking session not found")

    if session.status == "active":
        raise HTTPException(status_code=400, detail="Cannot delete active session")

    db.delete(session)
    db.commit()
    return {"message": "Parking session deleted successfully"}
