from sqlalchemy import Column, Integer, String, Date
from app.core.database import Base

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    date = Column(Date, nullable=False, unique=True, index=True)
    description = Column(String(500), nullable=True)
