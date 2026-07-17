from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date
from enum import Enum

class AttendanceStatusEnum(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"

class AttendanceBase(BaseModel):
    student_id: int
    date: date
    subject: str
    status: AttendanceStatusEnum
    remarks: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatusEnum] = None
    remarks: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    
    class Config:
        from_attributes = True

# For Bulk Actions (taking attendance for an entire class)
class BulkAttendanceCreate(BaseModel):
    date: date
    subject: str
    records: List[dict] # Expected format: [{"student_id": 1, "status": "Present", "remarks": ""}]

class SubjectStats(BaseModel):
    subject: str
    total_classes: int
    present: int
    absent: int
    late: int
    percentage: float

class MonthlyStats(BaseModel):
    month: str # e.g., "2023-10"
    total_classes: int
    present: int
    absent: int
    late: int
    percentage: float

class StudentAttendanceStats(BaseModel):
    overall_percentage: float
    total_classes: int
    total_present: int
    total_absent: int
    total_late: int
    subject_stats: List[SubjectStats]
    monthly_stats: List[MonthlyStats]
