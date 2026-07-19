from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import Teacher
from app.schemas.user import TeacherCreate, TeacherResponse, TeacherUpdate
from app.core import security

router = APIRouter()

@router.get("/", response_model=List[TeacherResponse])
def get_teachers(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    search: Optional[str] = None,
    department: Optional[str] = None,
) -> Any:
    """
    Retrieve teachers (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = db.query(Teacher)

    if search:
        query = query.filter(Teacher.name.ilike(f"%{search}%") | Teacher.email.ilike(f"%{search}%"))
    if department:
        query = query.filter(Teacher.department_branch == department)

    return query.all()

@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific teacher by ID.
    """
    if current_user.role != "admin" and current_user.id != teacher_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

import secrets

@router.post("/", response_model=TeacherResponse)
def create_teacher(
    *,
    db: Session = Depends(deps.get_db),
    teacher_in: TeacherCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new teacher (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    teacher = db.query(Teacher).filter(Teacher.email == teacher_in.email).first()
    if teacher:
        raise HTTPException(status_code=400, detail="Teacher with this email already exists.")

    new_teacher = Teacher(
        name=teacher_in.name,
        email=teacher_in.email,
        hashed_password=security.get_password_hash(teacher_in.password),
        phone=teacher_in.phone,
        department_branch=teacher_in.department_branch,
        employee_id=teacher_in.employee_id,
        gender=teacher_in.gender,
        designation=teacher_in.designation,
        qualification=teacher_in.qualification,
        experience=teacher_in.experience,
        address=teacher_in.address,
        status="active"
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    # removed temp password injection
    return new_teacher

@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(
    *,
    teacher_id: int,
    db: Session = Depends(deps.get_db),
    teacher_in: TeacherUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a teacher (Admin only, or self for basic details).
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if current_user.role != "admin" and current_user.id != teacher_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = teacher_in.model_dump(exclude_unset=True)
    
    # Restrict what a teacher can update about themselves
    if current_user.role == "teacher":
        allowed_fields = {"phone", "address"}
        update_data = {k: v for k, v in update_data.items() if k in allowed_fields}

    if "password" in update_data:
        update_data["hashed_password"] = security.get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(teacher, field, value)
        
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher

@router.delete("/{teacher_id}")
def delete_teacher(
    *,
    teacher_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a teacher (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    db.delete(teacher)
    db.commit()
    return {"msg": "Teacher deleted successfully"}
