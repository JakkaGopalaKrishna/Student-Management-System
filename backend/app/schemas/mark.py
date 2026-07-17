from pydantic import BaseModel
from typing import Optional, List, Dict
from enum import Enum

class ExamTypeEnum(str, Enum):
    INTERNAL = "Internal"
    EXTERNAL = "External"

class MarkBase(BaseModel):
    student_id: int
    subject: str
    semester: str
    exam_type: ExamTypeEnum
    marks_obtained: float
    max_marks: float
    remarks: Optional[str] = None

class MarkCreate(MarkBase):
    pass

class MarkUpdate(BaseModel):
    marks_obtained: Optional[float] = None
    max_marks: Optional[float] = None
    remarks: Optional[str] = None

class MarkResponse(MarkBase):
    id: int
    
    class Config:
        from_attributes = True

# Analytics for students
class SemesterResult(BaseModel):
    semester: str
    total_obtained: float
    total_max: float
    percentage: float
    sgpa: float

class StudentMarksStats(BaseModel):
    overall_percentage: float
    internal_marks: List[MarkResponse]
    external_marks: List[MarkResponse]
    semester_results: List[SemesterResult]
