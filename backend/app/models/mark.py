from sqlalchemy import Column, Integer, String, ForeignKey, Float, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ExamType(str, enum.Enum):
    INTERNAL = "Internal"
    EXTERNAL = "External"

class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    subject = Column(String(100), nullable=False, index=True)
    semester = Column(String(20), nullable=False, index=True)
    exam_type = Column(Enum(ExamType), nullable=False)
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="marks")
