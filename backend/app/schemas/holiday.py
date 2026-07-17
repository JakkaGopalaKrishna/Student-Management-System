from pydantic import BaseModel
from typing import Optional
from datetime import date

class HolidayBase(BaseModel):
    title: str
    date: date
    description: Optional[str] = None

class HolidayCreate(HolidayBase):
    pass

class HolidayUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None

class HolidayResponse(HolidayBase):
    id: int
    
    class Config:
        from_attributes = True
