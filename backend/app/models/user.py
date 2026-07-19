from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    department_branch = Column(String(100), nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    reset_password_token = Column(String(255), nullable=True, index=True)
    reset_password_expire = Column(DateTime, nullable=True)


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    department_branch = Column(String(100), nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=True)
    gender = Column(String(20), nullable=True)
    designation = Column(String(100), nullable=True)
    qualification = Column(String(200), nullable=True)
    experience = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    profile_photo = Column(String(255), nullable=True)
    reset_password_token = Column(String(255), nullable=True, index=True)
    reset_password_expire = Column(DateTime, nullable=True)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    department_branch = Column(String(100), nullable=True) # E.g. Computer Science
    status = Column(String(20), default="active")
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    reset_password_token = Column(String(255), nullable=True, index=True)
    reset_password_expire = Column(DateTime, nullable=True)
    
    # Extra fields for student details
    roll_number = Column(String(50), unique=True, index=True, nullable=True)
    gender = Column(String(20), nullable=True)
    dob = Column(String(20), nullable=True) # YYYY-MM-DD
    semester = Column(String(20), nullable=True)
    section = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    parent_name = Column(String(100), nullable=True)
    parent_phone = Column(String(20), nullable=True)
    profile_photo = Column(String(255), nullable=True)

    # Relationships
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    fees = relationship("Fee", back_populates="student", cascade="all, delete-orphan")
