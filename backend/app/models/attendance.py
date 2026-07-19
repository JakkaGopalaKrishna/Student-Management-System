from sqlalchemy import Column, Integer, String, ForeignKey, Date, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    subject = Column(String(100), nullable=False, index=True)
    status = Column(Enum(AttendanceStatus), nullable=False)
    remarks = Column(Text, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="attendance_records")
