import secrets
from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.api import deps
from app.models.user import Admin, Teacher, Student
from app.schemas.user import Token, ForgotPassword, ResetPassword, ChangePassword

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), 
    form_data: OAuth2PasswordRequestForm = Depends(),
    role: str = Form(...)  # Expected: 'admin', 'teacher', or 'student'
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    role = role.lower()
    if role not in ["admin", "teacher", "student"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    user = None
    if role == "admin":
        user = db.query(Admin).filter(Admin.email == form_data.username).first()
    elif role == "teacher":
        user = db.query(Teacher).filter(Teacher.email == form_data.username).first()
    elif role == "student":
        user = db.query(Student).filter(Student.email == form_data.username).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif user.status != "active":
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            data={"sub": user.email, "role": role}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "role": role
    }

@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    data: ForgotPassword,
) -> Any:
    """
    Generate password reset token.
    """
    role = data.role.lower()
    user = None
    if role == "admin":
        user = db.query(Admin).filter(Admin.email == data.email).first()
    elif role == "teacher":
        user = db.query(Teacher).filter(Teacher.email == data.email).first()
    elif role == "student":
        user = db.query(Student).filter(Student.email == data.email).first()

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
    Reset password using token. (We have to search across all tables since we don't know the role)
    """
    user = db.query(Student).filter(Student.reset_password_token == data.token).first()
    if not user:
        user = db.query(Teacher).filter(Teacher.reset_password_token == data.token).first()
    if not user:
        user = db.query(Admin).filter(Admin.reset_password_token == data.token).first()

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
    current_user: Any = Depends(deps.get_current_active_user)
) -> Any:
    """
    Change password for authenticated user.
    """
    if not security.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    current_user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    return {"msg": "Password updated successfully"}

@router.get("/me")
def read_users_me(
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user. Return as dict to avoid rigid Pydantic Response limitations since they have different fields.
    """
    user_dict = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "department_branch": current_user.department_branch,
        "role": current_user.role,
        "status": current_user.status
    }
    if current_user.role == "student":
        user_dict.update({
            "roll_number": current_user.roll_number,
            "semester": current_user.semester,
            "address": current_user.address,
            "parent_name": current_user.parent_name,
            "parent_phone": current_user.parent_phone,
            "profile_photo": current_user.profile_photo
        })
    return user_dict
