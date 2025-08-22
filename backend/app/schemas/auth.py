# schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str  # Can be email or username
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    preferred_zones: Optional[list] = None
    notification_enabled: Optional[bool] = None
    max_parking_duration: Optional[int] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    preferred_zones: Optional[list] = None
    notification_enabled: bool = True
    max_parking_duration: int = 480

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None