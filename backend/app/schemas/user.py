from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Common Base
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    department_branch: Optional[str] = None
    status: Optional[str] = "active"

# Admin Schemas
class AdminBase(UserBase):
    pass

class AdminCreate(AdminBase):
    password: str

class AdminResponse(AdminBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# Teacher Schemas
class TeacherBase(UserBase):
    employee_id: Optional[str] = None
    gender: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    address: Optional[str] = None
    profile_photo: Optional[str] = None

class TeacherCreate(TeacherBase):
    password: str

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department_branch: Optional[str] = None
    gender: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None

class TeacherResponse(TeacherBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# Student Schemas
class StudentBase(UserBase):
    roll_number: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    semester: Optional[str] = None
    section: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    profile_photo: Optional[str] = None

class StudentCreate(StudentBase):
    roll_number: str
    password: str

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department_branch: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    semester: Optional[str] = None
    section: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    status: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    
class ForgotPassword(BaseModel):
    email: EmailStr
    role: str

class ResetPassword(BaseModel):
    token: str
    new_password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
