# core/auth.py
from datetime import datetime, timedelta
from typing import Optional
from types import SimpleNamespace
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from .config import settings
from ..models.user import User
from .database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def authenticate_user(email: str, password: str, db: Session):
    """Authenticate user with email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not user.verify_password(password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(tz=None) + expires_delta
    else:
        expire = datetime.now(tz=None) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key_validated, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key_validated, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

def get_current_user(token_data: dict = Depends(verify_token), db: Session = Depends(get_db)):
    if token_data.get("guest") is True:
        now = datetime.utcnow()
        return SimpleNamespace(
            id=0,
            email="guest@revamp.local",
            username="guest",
            full_name="Guest",
            is_active=True,
            is_superuser=False,
            created_at=now,
            updated_at=now,
            preferred_zones=[],
            notification_enabled=False,
            max_parking_duration=0,
            is_guest=True,
        )

    email = token_data.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if getattr(current_user, "is_guest", False):
        raise HTTPException(status_code=403, detail="Guest access is not allowed for this endpoint")
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
