from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SyllabusBase(BaseModel):
    title: str
    branch: str
    semester: str

class SyllabusUpdate(BaseModel):
    title: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[str] = None

class SyllabusResponse(SyllabusBase):
    id: int
    file_path: str
    upload_date: datetime
    uploader_id: int
    
    class Config:
        from_attributes = True
