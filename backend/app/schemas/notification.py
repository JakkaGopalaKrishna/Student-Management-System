from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.notification import PriorityEnum

class NotificationBase(BaseModel):
    title: str
    message: str
    priority: PriorityEnum = PriorityEnum.low

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    priority: Optional[PriorityEnum] = None

class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime
    is_read: Optional[bool] = None # For student views

    class Config:
        from_attributes = True
