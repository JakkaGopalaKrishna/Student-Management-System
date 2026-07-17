import os
import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.schemas.student import StudentCreate, StudentResponse, StudentProfileUpdate
from app.core import security

router = APIRouter()

UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[StudentResponse])
def get_students(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    search: Optional[str] = None,
    branch: Optional[str] = None,
    semester: Optional[str] = None,
) -> Any:
    """
    Retrieve students with optional filtering.
    """
    query = db.query(User).filter(User.role == UserRole.STUDENT)

    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    
    if branch or semester:
        query = query.join(StudentProfile)
        if branch:
            query = query.filter(StudentProfile.branch == branch)
        if semester:
            query = query.filter(StudentProfile.semester == semester)

    return query.all()

@router.get("/{user_id}", response_model=StudentResponse)
def get_student(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific student by user ID.
    """
    student = db.query(User).filter(User.id == user_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("/", response_model=StudentResponse)
def create_student(
    *,
    db: Session = Depends(deps.get_db),
    student_in: StudentCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new student (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    user = db.query(User).filter(User.email == student_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
        
    profile_check = db.query(StudentProfile).filter(StudentProfile.roll_number == student_in.roll_number).first()
    if profile_check:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists.")

    # Create User
    user = User(
        email=student_in.email,
        hashed_password=security.get_password_hash(student_in.password),
        full_name=student_in.full_name,
        role=UserRole.STUDENT
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create Student Profile
    profile = StudentProfile(
        user_id=user.id,
        roll_number=student_in.roll_number,
        branch=student_in.branch,
        semester=student_in.semester,
        phone=student_in.phone,
        address=student_in.address,
        parent_details=student_in.parent_details
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    return user

@router.put("/{user_id}", response_model=StudentResponse)
def update_student(
    *,
    user_id: int,
    db: Session = Depends(deps.get_db),
    student_in: StudentProfileUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a student (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    user = db.query(User).filter(User.id == user_id, User.role == UserRole.STUDENT).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = user.student_profile
    if profile:
        update_data = student_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        db.add(profile)
        db.commit()
        db.refresh(user)
        
    return user

@router.delete("/{user_id}")
def delete_student(
    *,
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a student (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    user = db.query(User).filter(User.id == user_id, User.role == UserRole.STUDENT).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(user)
    db.commit()
    return {"msg": "Student deleted successfully"}

@router.post("/{user_id}/photo")
async def upload_photo(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a profile photo.
    """
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    user = db.query(User).filter(User.id == user_id, User.role == UserRole.STUDENT).first()
    if not user or not user.student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Save file
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # Update DB
    user.student_profile.profile_photo = f"/uploads/profiles/{filename}"
    db.commit()

    return {"profile_photo": user.student_profile.profile_photo}
