from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Syllabus(Base):
    __tablename__ = "syllabus"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    branch = Column(String(100), nullable=False, index=True)
    semester = Column(String(50), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    uploader_id = Column(Integer, ForeignKey("admins.id"), nullable=False)

    uploader = relationship("Admin")
