from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from datetime import date
from app.api import deps
from app.models.user import User, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.attendance import (
    AttendanceCreate, AttendanceUpdate, AttendanceResponse, 
    BulkAttendanceCreate, StudentAttendanceStats, SubjectStats, MonthlyStats
)
from app.schemas.student import StudentResponse
import collections

router = APIRouter()

@router.get("/", response_model=List[AttendanceResponse])
def get_attendance(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    student_id: Optional[int] = None,
    subject: Optional[str] = None,
    target_date: Optional[date] = None,
) -> Any:
    """
    Retrieve attendance records. Admin can view all. Students can only view their own.
    """
    query = db.query(Attendance)
    
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Attendance.student_id == current_user.id)
    else:
        if student_id:
            query = query.filter(Attendance.student_id == student_id)

    if subject:
        query = query.filter(Attendance.subject == subject)
    if target_date:
        query = query.filter(Attendance.date == target_date)

    return query.order_by(Attendance.date.desc()).all()

@router.post("/bulk", response_model=List[AttendanceResponse])
def create_bulk_attendance(
    *,
    db: Session = Depends(deps.get_db),
    attendance_in: BulkAttendanceCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create multiple attendance records at once (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    created_records = []
    
    # Check if records already exist for this date and subject
    existing = db.query(Attendance).filter(
        Attendance.date == attendance_in.date,
        Attendance.subject == attendance_in.subject
    ).all()
    
    existing_map = {e.student_id: e for e in existing}

    for record_data in attendance_in.records:
        student_id = record_data.get("student_id")
        status = record_data.get("status")
        remarks = record_data.get("remarks")

        if student_id in existing_map:
            # Update existing
            existing_map[student_id].status = status
            existing_map[student_id].remarks = remarks
            created_records.append(existing_map[student_id])
        else:
            # Create new
            db_record = Attendance(
                student_id=student_id,
                date=attendance_in.date,
                subject=attendance_in.subject,
                status=status,
                remarks=remarks
            )
            db.add(db_record)
            created_records.append(db_record)

    db.commit()
    for record in created_records:
        db.refresh(record)

    return created_records

@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    *,
    attendance_id: int,
    db: Session = Depends(deps.get_db),
    attendance_in: AttendanceUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update an attendance record (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if attendance_in.status:
        record.status = attendance_in.status
    if attendance_in.remarks is not None:
        record.remarks = attendance_in.remarks

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{attendance_id}")
def delete_attendance(
    *,
    attendance_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete an attendance record (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(record)
    db.commit()
    return {"msg": "Record deleted successfully"}

@router.get("/me/stats", response_model=StudentAttendanceStats)
def get_attendance_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get detailed attendance statistics for the logged-in student.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view their own stats")

    records = db.query(Attendance).filter(Attendance.student_id == current_user.id).all()
    
    total_classes = len(records)
    if total_classes == 0:
        return StudentAttendanceStats(
            overall_percentage=0.0,
            total_classes=0,
            total_present=0,
            total_absent=0,
            total_late=0,
            subject_stats=[],
            monthly_stats=[]
        )

    total_present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    total_absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    total_late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    
    # Calculate percentage (treating Late as Present for now, or you can assign it partial value. Let's treat Late as present for the % calculation, or separate.)
    # Standard: Present = 1, Late = 1 (or 0.5), Absent = 0. Let's say Late = Present for percentage.
    overall_percentage = round(((total_present + total_late) / total_classes) * 100, 2)

    # Subject Stats
    subject_map = collections.defaultdict(lambda: {"total": 0, "present": 0, "absent": 0, "late": 0})
    for r in records:
        subject_map[r.subject]["total"] += 1
        if r.status == AttendanceStatus.PRESENT:
            subject_map[r.subject]["present"] += 1
        elif r.status == AttendanceStatus.ABSENT:
            subject_map[r.subject]["absent"] += 1
        elif r.status == AttendanceStatus.LATE:
            subject_map[r.subject]["late"] += 1

    subject_stats = []
    for subj, stats in subject_map.items():
        perc = round(((stats["present"] + stats["late"]) / stats["total"]) * 100, 2)
        subject_stats.append(SubjectStats(
            subject=subj,
            total_classes=stats["total"],
            present=stats["present"],
            absent=stats["absent"],
            late=stats["late"],
            percentage=perc
        ))

    # Monthly Stats
    monthly_map = collections.defaultdict(lambda: {"total": 0, "present": 0, "absent": 0, "late": 0})
    for r in records:
        month_key = r.date.strftime("%Y-%m")
        monthly_map[month_key]["total"] += 1
        if r.status == AttendanceStatus.PRESENT:
            monthly_map[month_key]["present"] += 1
        elif r.status == AttendanceStatus.ABSENT:
            monthly_map[month_key]["absent"] += 1
        elif r.status == AttendanceStatus.LATE:
            monthly_map[month_key]["late"] += 1

    monthly_stats = []
    # Sort months chronologically
    for month in sorted(monthly_map.keys()):
        stats = monthly_map[month]
        perc = round(((stats["present"] + stats["late"]) / stats["total"]) * 100, 2)
        monthly_stats.append(MonthlyStats(
            month=month,
            total_classes=stats["total"],
            present=stats["present"],
            absent=stats["absent"],
            late=stats["late"],
            percentage=perc
        ))

    return StudentAttendanceStats(
        overall_percentage=overall_percentage,
        total_classes=total_classes,
        total_present=total_present,
        total_absent=total_absent,
        total_late=total_late,
        subject_stats=subject_stats,
        monthly_stats=monthly_stats
    )
