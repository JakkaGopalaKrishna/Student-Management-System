from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.timetable import TimetableEntry, EntryTypeEnum
from app.schemas.timetable import TimetableEntryCreate, TimetableEntryUpdate, TimetableEntryResponse

router = APIRouter()

@router.get("/", response_model=List[TimetableEntryResponse])
def get_timetable(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    branch: Optional[str] = None,
    semester: Optional[str] = None,
    entry_type: Optional[EntryTypeEnum] = None
) -> Any:
    """
    Retrieve timetable entries, filtered by branch, semester, and type.
    """
    query = db.query(TimetableEntry)
    
    if branch:
        query = query.filter(TimetableEntry.branch == branch)
    if semester:
        query = query.filter(TimetableEntry.semester == semester)
    if entry_type:
        query = query.filter(TimetableEntry.entry_type == entry_type)
        
    # Sort by start time for consistent display
    entries = query.order_by(TimetableEntry.start_time).all()
    return entries

@router.post("/", response_model=TimetableEntryResponse)
def create_timetable_entry(
    *,
    db: Session = Depends(deps.get_db),
    entry_in: TimetableEntryCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new timetable entry (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if entry_in.entry_type == EntryTypeEnum.class_ and not entry_in.day_of_week:
        raise HTTPException(status_code=400, detail="Classes must have a day_of_week")
    if entry_in.entry_type == EntryTypeEnum.exam and not entry_in.exam_date:
        raise HTTPException(status_code=400, detail="Exams must have an exam_date")

    db_entry = TimetableEntry(
        branch=entry_in.branch,
        semester=entry_in.semester,
        entry_type=entry_in.entry_type,
        subject=entry_in.subject,
        room=entry_in.room,
        start_time=entry_in.start_time,
        end_time=entry_in.end_time,
        day_of_week=entry_in.day_of_week,
        exam_date=entry_in.exam_date
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.put("/{entry_id}", response_model=TimetableEntryResponse)
def update_timetable_entry(
    *,
    entry_id: int,
    db: Session = Depends(deps.get_db),
    entry_in: TimetableEntryUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update timetable entry (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Entry not found")

    if entry_in.branch is not None: record.branch = entry_in.branch
    if entry_in.semester is not None: record.semester = entry_in.semester
    if entry_in.entry_type is not None: record.entry_type = entry_in.entry_type
    if entry_in.subject is not None: record.subject = entry_in.subject
    if entry_in.room is not None: record.room = entry_in.room
    if entry_in.start_time is not None: record.start_time = entry_in.start_time
    if entry_in.end_time is not None: record.end_time = entry_in.end_time
    if entry_in.day_of_week is not None: record.day_of_week = entry_in.day_of_week
    if entry_in.exam_date is not None: record.exam_date = entry_in.exam_date

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{entry_id}")
def delete_timetable_entry(
    *,
    entry_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a timetable entry (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(record)
    db.commit()
    return {"msg": "Entry deleted successfully"}
