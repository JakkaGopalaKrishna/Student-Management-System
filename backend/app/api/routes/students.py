import os
import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import Student
from app.schemas.user import StudentCreate, StudentResponse, StudentUpdate
from app.core import security

router = APIRouter()

UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[StudentResponse])
def get_students(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    search: Optional[str] = None,
    branch: Optional[str] = None,
    semester: Optional[str] = None,
) -> Any:
    """
    Retrieve students (Admin and Teacher only).
    """
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = db.query(Student)

    if search:
        query = query.filter(Student.name.ilike(f"%{search}%") | Student.email.ilike(f"%{search}%") | Student.roll_number.ilike(f"%{search}%"))
    
    if branch:
        query = query.filter(Student.department_branch == branch)
    if semester:
        query = query.filter(Student.semester == semester)

    return query.all()

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific student by ID.
    """
    if current_user.role not in ["admin", "teacher"] and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

import secrets

@router.post("/", response_model=StudentResponse)
def create_student(
    *,
    db: Session = Depends(deps.get_db),
    student_in: StudentCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new student (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    student = db.query(Student).filter((Student.email == student_in.email) | (Student.roll_number == student_in.roll_number)).first()
    if student:
        raise HTTPException(status_code=400, detail="Student with this email or roll number already exists.")

    new_student = Student(
        name=student_in.name,
        email=student_in.email,
        hashed_password=security.get_password_hash(student_in.password),
        phone=student_in.phone,
        department_branch=student_in.department_branch,
        roll_number=student_in.roll_number,
        gender=student_in.gender,
        dob=student_in.dob,
        semester=student_in.semester,
        section=student_in.section,
        address=student_in.address,
        parent_name=student_in.parent_name,
        parent_phone=student_in.parent_phone,
        status="active"
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    # removed temp password injection
    return new_student

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    *,
    student_id: int,
    db: Session = Depends(deps.get_db),
    student_in: StudentUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a student (Admin only, or self for basic details).
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role != "admin" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = student_in.model_dump(exclude_unset=True)
    
    # Restrict what a student can update about themselves
    if current_user.role == "student":
        allowed_fields = {"phone", "address", "parent_name", "parent_phone"}
        update_data = {k: v for k, v in update_data.items() if k in allowed_fields}

    if "password" in update_data:
        update_data["hashed_password"] = security.get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(student, field, value)
        
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.delete("/{student_id}")
def delete_student(
    *,
    student_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a student (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"msg": "Student deleted successfully"}

@router.post("/{student_id}/photo")
async def upload_photo(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a profile photo.
    """
    if current_user.role != "admin" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    student.profile_photo = f"/uploads/profiles/{filename}"
    db.commit()

    return {"profile_photo": student.profile_photo}
