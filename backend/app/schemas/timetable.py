from pydantic import BaseModel
from typing import Optional
from datetime import time, date
from app.models.timetable import EntryTypeEnum

class TimetableEntryBase(BaseModel):
    branch: str
    semester: str
    entry_type: EntryTypeEnum
    subject: str
    room: str
    start_time: time
    end_time: time
    day_of_week: Optional[str] = None
    exam_date: Optional[date] = None

class TimetableEntryCreate(TimetableEntryBase):
    pass

class TimetableEntryUpdate(BaseModel):
    branch: Optional[str] = None
    semester: Optional[str] = None
    entry_type: Optional[EntryTypeEnum] = None
    subject: Optional[str] = None
    room: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    day_of_week: Optional[str] = None
    exam_date: Optional[date] = None

class TimetableEntryResponse(TimetableEntryBase):
    id: int
    
    class Config:
        from_attributes = True
