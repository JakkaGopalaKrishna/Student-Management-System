from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Union
from app.api.deps import get_db, get_current_user
from app.models.user import Admin, Teacher, Student
from app.models.note import Note
from app.models.paper import Paper
from app.models.holiday import Holiday
from app.models.notification import Notification
from app.models.fee import Fee
from app.models.attendance import Attendance, AttendanceStatus

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: Union[Admin, Teacher, Student] = Depends(get_current_user)):
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # 1. Total Students
    total_students = db.query(Student).count()
    
    # 2. Total Branches (Count distinct branches among students)
    total_branches = db.query(func.count(func.distinct(Student.department_branch))).scalar() or 0
    
    # 3. Total Subjects (For now, just a placeholder or distinct subjects from Syllabus/Notes)
    # We will use distinct subjects from Notes as a proxy since we didn't explicitly check Syllabus
    total_subjects = db.query(func.count(func.distinct(Note.subject))).scalar() or 0
    
    # 4. Total Notes
    total_notes = db.query(Note).count()
    
    # 5. Total Papers
    total_papers = db.query(Paper).count()
    
    # 6. Notifications
    total_notifications = db.query(Notification).count()
    
    # 7. Holidays
    total_holidays = db.query(Holiday).count()
    
    # 8. Fee Summary
    # Total collected = sum of paid_amount in all Fee records
    total_collected = db.query(func.sum(Fee.paid_amount)).scalar() or 0.0
    # Total pending = sum of (total_amount - paid_amount)
    total_amount_sum = db.query(func.sum(Fee.total_amount)).scalar() or 0.0
    total_pending = max(0, total_amount_sum - total_collected)
    
    # 9. Attendance Summary
    total_attendance_records = db.query(Attendance).count()
    present_attendance_records = db.query(Attendance).filter(Attendance.status == AttendanceStatus.PRESENT).count()
    overall_attendance = 0
    if total_attendance_records > 0:
        overall_attendance = int((present_attendance_records / total_attendance_records) * 100)
    
    return {
        "total_students": total_students,
        "total_branches": total_branches,
        "total_subjects": total_subjects,
        "total_notes": total_notes,
        "total_papers": total_papers,
        "notifications": total_notifications,
        "holidays": total_holidays,
        "fee_collected": total_collected,
        "fee_pending": total_pending,
        "overall_attendance_percent": overall_attendance
    }
