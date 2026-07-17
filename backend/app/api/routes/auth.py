import secrets
from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.api import deps
from app.models.user import User, UserRole
from app.schemas.user import Token, UserCreate, UserResponse, ForgotPassword, ResetPassword, ChangePassword

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserResponse)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user (Student only from UI).
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.STUDENT  # Force student
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    data: ForgotPassword,
) -> Any:
    """
    Generate password reset token.
    """
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Prevent timing attacks by always returning 200
        return {"msg": "If your email is in our database, you will receive a reset link."}
    
    token = secrets.token_urlsafe(32)
    user.reset_password_token = token
    user.reset_password_expire = datetime.utcnow() + timedelta(hours=1)
    
    db.commit()
    
    # Simulate sending email
    print(f"\n==== EMAIL SIMULATION ====")
    print(f"To: {user.email}")
    print(f"Reset Link: http://localhost:8000/reset-password.html?token={token}")
    print(f"==========================\n")
    
    return {"msg": "If your email is in our database, you will receive a reset link."}

@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    data: ResetPassword,
) -> Any:
    """
    Reset password using token.
    """
    user = db.query(User).filter(User.reset_password_token == data.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    if user.reset_password_expire < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token has expired")
        
    user.hashed_password = security.get_password_hash(data.new_password)
    user.reset_password_token = None
    user.reset_password_expire = None
    db.commit()
    return {"msg": "Password updated successfully"}

@router.post("/change-password")
def change_password(
    *,
    db: Session = Depends(deps.get_db),
    data: ChangePassword,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Change password for authenticated user.
    """
    if not security.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    current_user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    return {"msg": "Password updated successfully"}

@router.get("/me", response_model=UserResponse)
def read_users_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
