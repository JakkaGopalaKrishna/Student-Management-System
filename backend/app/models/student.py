from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    branch = Column(String(100), nullable=False)
    semester = Column(String(20), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    parent_details = Column(Text, nullable=True)
    profile_photo = Column(String(255), nullable=True)

    # Relationships
    user = relationship("User", back_populates="student_profile")
