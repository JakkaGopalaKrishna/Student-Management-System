from typing import Generator, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import Admin, Teacher, Student
from app.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Union[Admin, Teacher, Student]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception
    
    user = None
    if token_data.role == "admin":
        user = db.query(Admin).filter(Admin.email == token_data.email).first()
    elif token_data.role == "teacher":
        user = db.query(Teacher).filter(Teacher.email == token_data.email).first()
    elif token_data.role == "student":
        user = db.query(Student).filter(Student.email == token_data.email).first()

    if user is None:
        raise credentials_exception
        
    # Dynamically attach role attribute so endpoints can check `current_user.role`
    user.role = token_data.role
    return user

def get_current_active_user(current_user: Union[Admin, Teacher, Student] = Depends(get_current_user)) -> Union[Admin, Teacher, Student]:
    if current_user.status != "active":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
