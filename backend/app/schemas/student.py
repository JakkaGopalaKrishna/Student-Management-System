from pydantic import BaseModel, EmailStr
from typing import Optional

# Base schema for Student Profile
class StudentProfileBase(BaseModel):
    roll_number: str
    branch: str
    semester: str
    phone: Optional[str] = None
    address: Optional[str] = None
    parent_details: Optional[str] = None
    profile_photo: Optional[str] = None

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileUpdate(BaseModel):
    branch: Optional[str] = None
    semester: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    parent_details: Optional[str] = None
    profile_photo: Optional[str] = None

class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Combined Student Creation (User + Profile)
class StudentCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    roll_number: str
    branch: str
    semester: str
    phone: Optional[str] = None
    address: Optional[str] = None
    parent_details: Optional[str] = None

# Combined Student Response (User + Profile)
class StudentResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    student_profile: Optional[StudentProfileResponse] = None

    class Config:
        from_attributes = True
