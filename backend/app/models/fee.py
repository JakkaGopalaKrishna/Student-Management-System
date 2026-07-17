from sqlalchemy import Column, Integer, String, ForeignKey, Float, Enum, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
from datetime import date

class FeeStatus(str, enum.Enum):
    PENDING = "Pending"
    PARTIAL = "Partial"
    PAID = "Paid"

class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    due_date = Column(Date, nullable=False)
    status = Column(Enum(FeeStatus), default=FeeStatus.PENDING, nullable=False)

    # Relationships
    student = relationship("User", back_populates="fees")
    payments = relationship("FeePayment", back_populates="fee", cascade="all, delete-orphan")

class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, index=True)
    fee_id = Column(Integer, ForeignKey("fees.id"), nullable=False, index=True)
    amount_paid = Column(Float, nullable=False)
    payment_date = Column(Date, default=date.today, nullable=False)
    payment_method = Column(String(50), nullable=False)
    reference_number = Column(String(100), nullable=True)

    # Relationships
    fee = relationship("Fee", back_populates="payments")
