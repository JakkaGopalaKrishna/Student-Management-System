from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum

class FeeStatusEnum(str, Enum):
    PENDING = "Pending"
    PARTIAL = "Partial"
    PAID = "Paid"

class FeePaymentBase(BaseModel):
    amount_paid: float
    payment_method: str
    reference_number: Optional[str] = None
    payment_date: Optional[date] = None

class FeePaymentCreate(FeePaymentBase):
    pass

class FeePaymentResponse(FeePaymentBase):
    id: int
    fee_id: int
    payment_date: date
    
    class Config:
        from_attributes = True

class FeeBase(BaseModel):
    student_id: int
    title: str
    total_amount: float
    due_date: date

class FeeCreate(FeeBase):
    pass

class FeeUpdate(BaseModel):
    title: Optional[str] = None
    total_amount: Optional[float] = None
    due_date: Optional[date] = None

class FeeResponse(FeeBase):
    id: int
    paid_amount: float
    status: FeeStatusEnum
    payments: List[FeePaymentResponse] = []
    
    class Config:
        from_attributes = True

class StudentFeeStats(BaseModel):
    total_fees_demanded: float
    total_paid: float
    total_pending: float
    fees: List[FeeResponse]
    recent_payments: List[FeePaymentResponse]
