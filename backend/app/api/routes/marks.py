from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.api import deps

from app.models.mark import Mark, ExamType
from app.schemas.mark import (
    MarkCreate, MarkUpdate, MarkResponse, 
    StudentMarksStats, SemesterResult
)
import collections

router = APIRouter()

@router.get("/", response_model=List[MarkResponse])
def get_marks(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    student_id: Optional[int] = None,
    subject: Optional[str] = None,
    semester: Optional[str] = None,
    exam_type: Optional[str] = None,
) -> Any:
    """
    Retrieve marks records. Admin can view all. Students can only view their own.
    """
    query = db.query(Mark)
    
    if current_user.role == "student":
        query = query.filter(Mark.student_id == current_user.id)
    else:
        if student_id:
            query = query.filter(Mark.student_id == student_id)

    if subject:
        query = query.filter(Mark.subject.ilike(f"%{subject}%"))
    if semester:
        query = query.filter(Mark.semester == semester)
    if exam_type:
        query = query.filter(Mark.exam_type == exam_type)

    return query.order_by(Mark.semester, Mark.subject).all()

@router.post("/", response_model=MarkResponse)
def create_mark(
    *,
    db: Session = Depends(deps.get_db),
    mark_in: MarkCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new mark record (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check for existing record
    existing = db.query(Mark).filter(
        Mark.student_id == mark_in.student_id,
        Mark.subject == mark_in.subject,
        Mark.semester == mark_in.semester,
        Mark.exam_type == mark_in.exam_type
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="A mark record for this student, subject, semester, and exam type already exists.")

    db_mark = Mark(
        student_id=mark_in.student_id,
        subject=mark_in.subject,
        semester=mark_in.semester,
        exam_type=mark_in.exam_type,
        marks_obtained=mark_in.marks_obtained,
        max_marks=mark_in.max_marks,
        remarks=mark_in.remarks
    )
    db.add(db_mark)
    db.commit()
    db.refresh(db_mark)
    return db_mark

@router.put("/{mark_id}", response_model=MarkResponse)
def update_mark(
    *,
    mark_id: int,
    db: Session = Depends(deps.get_db),
    mark_in: MarkUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a mark record (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Mark).filter(Mark.id == mark_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if mark_in.marks_obtained is not None:
        record.marks_obtained = mark_in.marks_obtained
    if mark_in.max_marks is not None:
        record.max_marks = mark_in.max_marks
    if mark_in.remarks is not None:
        record.remarks = mark_in.remarks

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{mark_id}")
def delete_mark(
    *,
    mark_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a mark record (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Mark).filter(Mark.id == mark_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(record)
    db.commit()
    return {"msg": "Record deleted successfully"}

@router.get("/me/stats", response_model=StudentMarksStats)
def get_marks_stats(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get detailed marks statistics for the logged-in student.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view their own stats")

    records = db.query(Mark).filter(Mark.student_id == current_user.id).all()
    
    internal_marks = [r for r in records if r.exam_type == ExamType.INTERNAL]
    external_marks = [r for r in records if r.exam_type == ExamType.EXTERNAL]
    
    total_obtained = sum(r.marks_obtained for r in records)
    total_max = sum(r.max_marks for r in records)
    
    overall_percentage = 0.0
    if total_max > 0:
        overall_percentage = round((total_obtained / total_max) * 100, 2)
        
    # Semester Grouping
    sem_map = collections.defaultdict(lambda: {"obtained": 0.0, "max": 0.0})
    for r in records:
        sem_map[r.semester]["obtained"] += r.marks_obtained
        sem_map[r.semester]["max"] += r.max_marks
        
    semester_results = []
    for sem, data in sem_map.items():
        if data["max"] > 0:
            perc = round((data["obtained"] / data["max"]) * 100, 2)
            # Simple SGPA approximation: Percentage / 10
            sgpa = round(perc / 10, 2)
            semester_results.append(SemesterResult(
                semester=sem,
                total_obtained=data["obtained"],
                total_max=data["max"],
                percentage=perc,
                sgpa=sgpa
            ))
            
    # Sort semesters alphabetically for now (1st, 2nd, etc.)
    semester_results.sort(key=lambda x: x.semester)

    return StudentMarksStats(
        overall_percentage=overall_percentage,
        internal_marks=internal_marks,
        external_marks=external_marks,
        semester_results=semester_results
    )
