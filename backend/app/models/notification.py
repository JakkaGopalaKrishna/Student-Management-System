from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.low, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class NotificationRead(Base):
    __tablename__ = "notification_reads"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False, index=True)
    read_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")
    notification = relationship("Notification")
