import os
import uuid
import aiofiles
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.syllabus import Syllabus
from app.schemas.syllabus import SyllabusResponse, SyllabusUpdate

router = APIRouter()

UPLOAD_DIR = "uploads/syllabus"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[SyllabusResponse])
def get_syllabus(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    branch: Optional[str] = None,
    semester: Optional[str] = None,
    search: Optional[str] = None,
) -> Any:
    """
    Retrieve all syllabus documents.
    """
    query = db.query(Syllabus)
    
    if branch:
        query = query.filter(Syllabus.branch == branch)
    if semester:
        query = query.filter(Syllabus.semester == semester)
    if search:
        query = query.filter(Syllabus.title.ilike(f"%{search}%"))

    return query.order_by(Syllabus.upload_date.desc()).all()

@router.post("/", response_model=SyllabusResponse)
async def upload_syllabus(
    title: str = Form(...),
    branch: str = Form(...),
    semester: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a new syllabus (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

    # Database record
    db_syllabus = Syllabus(
        title=title,
        branch=branch,
        semester=semester,
        file_path=file_path.replace("\\", "/"), # Normalize path for web
        uploader_id=current_user.id
    )
    db.add(db_syllabus)
    db.commit()
    db.refresh(db_syllabus)
    return db_syllabus

@router.put("/{syllabus_id}", response_model=SyllabusResponse)
def update_syllabus(
    *,
    syllabus_id: int,
    db: Session = Depends(deps.get_db),
    syllabus_in: SyllabusUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update syllabus metadata (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if syllabus_in.title is not None:
        record.title = syllabus_in.title
    if syllabus_in.branch is not None:
        record.branch = syllabus_in.branch
    if syllabus_in.semester is not None:
        record.semester = syllabus_in.semester

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{syllabus_id}")
def delete_syllabus(
    *,
    syllabus_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a syllabus and its file (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Delete physical file
    if os.path.exists(record.file_path):
        try:
            os.remove(record.file_path)
        except Exception as e:
            print(f"Warning: Failed to delete file {record.file_path}: {e}")

    db.delete(record)
    db.commit()
    return {"msg": "Syllabus deleted successfully"}
