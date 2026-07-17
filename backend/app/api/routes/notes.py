import os
import uuid
import aiofiles
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.note import Note
from app.schemas.note import NoteResponse, NoteUpdate

router = APIRouter()

UPLOAD_DIR = "uploads/notes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[NoteResponse])
def get_notes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    branch: Optional[str] = None,
    semester: Optional[str] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None,
) -> Any:
    """
    Retrieve all notes.
    """
    query = db.query(Note)
    
    if branch:
        query = query.filter(Note.branch == branch)
    if semester:
        query = query.filter(Note.semester == semester)
    if subject:
        query = query.filter(Note.subject.ilike(f"%{subject}%"))
    if search:
        query = query.filter(Note.title.ilike(f"%{search}%"))

    return query.order_by(Note.upload_date.desc()).all()

@router.post("/", response_model=NoteResponse)
async def upload_note(
    title: str = Form(...),
    branch: str = Form(...),
    semester: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a new note (Admin only).
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
    db_note = Note(
        title=title,
        branch=branch,
        semester=semester,
        subject=subject,
        file_path=file_path.replace("\\", "/"), # Normalize path for web
        uploader_id=current_user.id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    *,
    note_id: int,
    db: Session = Depends(deps.get_db),
    note_in: NoteUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update note metadata (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Note).filter(Note.id == note_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Note not found")

    if note_in.title is not None:
        record.title = note_in.title
    if note_in.branch is not None:
        record.branch = note_in.branch
    if note_in.semester is not None:
        record.semester = note_in.semester
    if note_in.subject is not None:
        record.subject = note_in.subject

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{note_id}")
def delete_note(
    *,
    note_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a note and its file (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Note).filter(Note.id == note_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Note not found")

    # Delete physical file
    if os.path.exists(record.file_path):
        try:
            os.remove(record.file_path)
        except Exception as e:
            print(f"Warning: Failed to delete file {record.file_path}: {e}")

    db.delete(record)
    db.commit()
    return {"msg": "Note deleted successfully"}
