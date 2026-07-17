from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NoteBase(BaseModel):
    title: str
    branch: str
    semester: str
    subject: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[str] = None
    subject: Optional[str] = None

class NoteResponse(NoteBase):
    id: int
    file_path: str
    upload_date: datetime
    uploader_id: int
    
    class Config:
        from_attributes = True
