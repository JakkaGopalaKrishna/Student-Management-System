from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaperBase(BaseModel):
    title: str
    branch: str
    semester: str
    subject: str
    year: int

class PaperUpdate(BaseModel):
    title: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[str] = None
    subject: Optional[str] = None
    year: Optional[int] = None

class PaperResponse(PaperBase):
    id: int
    file_path: str
    upload_date: datetime
    uploader_id: int
    
    class Config:
        from_attributes = True
