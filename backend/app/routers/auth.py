# routers/auth.py
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.auth import (
    authenticate_user, create_access_token,
    get_current_active_user, get_current_user
)
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, Token, User as UserSchema, UserUpdate
from app.schemas.zones import ErrorResponse

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register(user_data: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Register a new user"""
    try:
        # Check if user already exists
        db_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Email or username already registered"
            )

        # Create new user
        hashed_password = User().hash_password(user_data.password)
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email or username already registered"
        )

@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """Login user and return access token"""
    user = db.query(User).filter(
        (User.email == form_data.username) | (User.username == form_data.username)
    ).first()

    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    update_data = user_update.dict(exclude_unset=True)

    # Hash password if it's being updated
    if "password" in update_data:
        update_data["hashed_password"] = User().hash_password(update_data.pop("password"))

    # Update user fields
    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)

    try:
        db.commit()
        db.refresh(current_user)
        return current_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email or username already taken"
        )