from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps

from app.models.holiday import Holiday
from app.schemas.holiday import HolidayCreate, HolidayResponse, HolidayUpdate
from datetime import date

router = APIRouter()

@router.get("/", response_model=List[HolidayResponse])
def get_holidays(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    year: Optional[int] = None,
    month: Optional[int] = None
) -> Any:
    """
    Retrieve all holidays, optionally filtered by year/month.
    """
    query = db.query(Holiday)
    # Simple filtering since date is a Date object.
    # In SQLite/MySQL, exact year/month extraction syntax varies, 
    # but we can filter simply in Python if data is small, or use SQLAlchemy func.extract.
    # For simplicity, returning all and filtering on frontend is fine for a small dataset,
    # but let's just return all ordered by date.
    
    holidays = query.order_by(Holiday.date.asc()).all()
    
    if year:
        holidays = [h for h in holidays if h.date.year == year]
    if month:
        holidays = [h for h in holidays if h.date.month == month]
        
    return holidays

@router.post("/", response_model=HolidayResponse)
def create_holiday(
    *,
    db: Session = Depends(deps.get_db),
    holiday_in: HolidayCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new holiday (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # Check if holiday exists on this date
    existing = db.query(Holiday).filter(Holiday.date == holiday_in.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="A holiday is already scheduled for this date.")

    db_holiday = Holiday(
        title=holiday_in.title,
        date=holiday_in.date,
        description=holiday_in.description
    )
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.put("/{holiday_id}", response_model=HolidayResponse)
def update_holiday(
    *,
    holiday_id: int,
    db: Session = Depends(deps.get_db),
    holiday_in: HolidayUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update holiday (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Holiday not found")

    if holiday_in.date is not None and holiday_in.date != record.date:
        existing = db.query(Holiday).filter(Holiday.date == holiday_in.date).first()
        if existing:
            raise HTTPException(status_code=400, detail="A holiday is already scheduled for this date.")

    if holiday_in.title is not None:
        record.title = holiday_in.title
    if holiday_in.date is not None:
        record.date = holiday_in.date
    if holiday_in.description is not None:
        record.description = holiday_in.description

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{holiday_id}")
def delete_holiday(
    *,
    holiday_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a holiday (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Holiday not found")

    db.delete(record)
    db.commit()
    return {"msg": "Holiday deleted successfully"}
