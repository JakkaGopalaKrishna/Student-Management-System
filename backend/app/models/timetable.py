from sqlalchemy import Column, Integer, String, Time, Date, Enum
import enum
from app.core.database import Base

class EntryTypeEnum(str, enum.Enum):
    class_ = "class"
    exam = "exam"

class TimetableEntry(Base):
    __tablename__ = "timetable"

    id = Column(Integer, primary_key=True, index=True)
    branch = Column(String(100), nullable=False, index=True)
    semester = Column(String(50), nullable=False, index=True)
    entry_type = Column(Enum(EntryTypeEnum), nullable=False)
    
    subject = Column(String(200), nullable=False)
    room = Column(String(100), nullable=False)
    
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # For weekly classes
    day_of_week = Column(String(20), nullable=True) # Monday, Tuesday, etc.
    
    # For exams
    exam_date = Column(Date, nullable=True)
