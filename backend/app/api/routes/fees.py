from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.api import deps

from app.models.fee import Fee, FeePayment, FeeStatus
from app.schemas.fee import (
    FeeCreate, FeeUpdate, FeeResponse, 
    FeePaymentCreate, FeePaymentResponse, StudentFeeStats
)

router = APIRouter()

@router.get("/", response_model=List[FeeResponse])
def get_fees(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    student_id: Optional[int] = None,
    status: Optional[str] = None,
) -> Any:
    """
    Retrieve fee demands. Admin can view all. Students can only view their own.
    """
    query = db.query(Fee)
    
    if current_user.role == "student":
        query = query.filter(Fee.student_id == current_user.id)
    else:
        if student_id:
            query = query.filter(Fee.student_id == student_id)

    if status:
        query = query.filter(Fee.status == status)

    return query.order_by(Fee.due_date.asc()).all()

@router.post("/", response_model=FeeResponse)
def create_fee(
    *,
    db: Session = Depends(deps.get_db),
    fee_in: FeeCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new fee demand (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_fee = Fee(
        student_id=fee_in.student_id,
        title=fee_in.title,
        total_amount=fee_in.total_amount,
        due_date=fee_in.due_date,
        paid_amount=0.0,
        status=FeeStatus.PENDING
    )
    db.add(db_fee)
    db.commit()
    db.refresh(db_fee)
    return db_fee

@router.put("/{fee_id}", response_model=FeeResponse)
def update_fee(
    *,
    fee_id: int,
    db: Session = Depends(deps.get_db),
    fee_in: FeeUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a fee demand (Admin only). Cannot update if fully paid.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Fee).filter(Fee.id == fee_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Fee not found")
        
    if record.status == FeeStatus.PAID:
        raise HTTPException(status_code=400, detail="Cannot update a fully paid fee")

    if fee_in.title is not None:
        record.title = fee_in.title
    if fee_in.total_amount is not None:
        if fee_in.total_amount < record.paid_amount:
            raise HTTPException(status_code=400, detail="Total amount cannot be less than already paid amount")
        record.total_amount = fee_in.total_amount
    if fee_in.due_date is not None:
        record.due_date = fee_in.due_date

    # Recalculate status
    if record.paid_amount >= record.total_amount:
        record.status = FeeStatus.PAID
    elif record.paid_amount > 0:
        record.status = FeeStatus.PARTIAL
    else:
        record.status = FeeStatus.PENDING

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{fee_id}")
def delete_fee(
    *,
    fee_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a fee demand (Admin only). Also deletes associated payments (cascade).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Fee).filter(Fee.id == fee_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Fee not found")

    db.delete(record)
    db.commit()
    return {"msg": "Fee deleted successfully"}

@router.post("/{fee_id}/payments", response_model=FeeResponse)
def record_payment(
    *,
    fee_id: int,
    db: Session = Depends(deps.get_db),
    payment_in: FeePaymentCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Record a payment against a fee (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    fee = db.query(Fee).filter(Fee.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")

    if fee.status == FeeStatus.PAID:
        raise HTTPException(status_code=400, detail="Fee is already fully paid")

    if fee.paid_amount + payment_in.amount_paid > fee.total_amount:
        raise HTTPException(status_code=400, detail="Payment amount exceeds pending balance")

    # Create Payment
    payment = FeePayment(
        fee_id=fee.id,
        amount_paid=payment_in.amount_paid,
        payment_method=payment_in.payment_method,
        reference_number=payment_in.reference_number,
        payment_date=payment_in.payment_date or date.today()
    )
    db.add(payment)

    # Update Fee
    fee.paid_amount += payment.amount_paid
    if fee.paid_amount >= fee.total_amount:
        fee.status = FeeStatus.PAID
    else:
        fee.status = FeeStatus.PARTIAL

    db.add(fee)
    db.commit()
    db.refresh(fee)
    return fee

@router.get("/me/stats", response_model=StudentFeeStats)
def get_fee_stats(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get aggregated fee statistics for the logged-in student.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view their own stats")

    fees = db.query(Fee).filter(Fee.student_id == current_user.id).order_by(Fee.due_date.asc()).all()
    
    total_demanded = sum(f.total_amount for f in fees)
    total_paid = sum(f.paid_amount for f in fees)
    total_pending = total_demanded - total_paid

    # Extract all payments across all fees and sort by date descending
    all_payments = []
    for f in fees:
        for p in f.payments:
            # We want to embed the fee title into the response if possible, 
            # but the schema doesn't have it right now. Let's just return the base payments.
            all_payments.append(p)
            
    all_payments.sort(key=lambda x: x.payment_date, reverse=True)

    return StudentFeeStats(
        total_fees_demanded=total_demanded,
        total_paid=total_paid,
        total_pending=total_pending,
        fees=fees,
        recent_payments=all_payments
    )

@router.get("/payments/{payment_id}/receipt")
def get_receipt_data(
    payment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get data to generate a receipt for a specific payment.
    """
    payment = db.query(FeePayment).filter(FeePayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    fee = payment.fee
    student = fee.student
    
    if current_user.role == "student" and student.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this receipt")
        
    return {
        "receipt_no": f"REC-{payment.id:05d}",
        "date": payment.payment_date,
        "student_name": student.full_name,
        "student_roll": student.student_profile.roll_number if student.student_profile else "N/A",
        "fee_title": fee.title,
        "amount_paid": payment.amount_paid,
        "payment_method": payment.payment_method,
        "reference": payment.reference_number
    }
