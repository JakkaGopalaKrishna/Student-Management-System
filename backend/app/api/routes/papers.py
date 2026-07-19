import os
import uuid
import aiofiles
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api import deps

from app.models.paper import Paper
from app.schemas.paper import PaperResponse, PaperUpdate

router = APIRouter()

UPLOAD_DIR = "uploads/papers"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[PaperResponse])
def get_papers(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
    branch: Optional[str] = None,
    semester: Optional[str] = None,
    subject: Optional[str] = None,
    year: Optional[int] = None,
    search: Optional[str] = None,
) -> Any:
    """
    Retrieve all papers.
    """
    query = db.query(Paper)
    
    if branch:
        query = query.filter(Paper.branch == branch)
    if semester:
        query = query.filter(Paper.semester == semester)
    if subject:
        query = query.filter(Paper.subject.ilike(f"%{subject}%"))
    if year:
        query = query.filter(Paper.year == year)
    if search:
        query = query.filter(Paper.title.ilike(f"%{search}%"))

    return query.order_by(Paper.year.desc(), Paper.upload_date.desc()).all()

@router.post("/", response_model=PaperResponse)
async def upload_paper(
    title: str = Form(...),
    branch: str = Form(...),
    semester: str = Form(...),
    subject: str = Form(...),
    year: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a new paper (Admin only).
    """
    if current_user.role != "admin":
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
    db_paper = Paper(
        title=title,
        branch=branch,
        semester=semester,
        subject=subject,
        year=year,
        file_path=file_path.replace("\\", "/"), # Normalize path for web
        uploader_id=current_user.id
    )
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    return db_paper

@router.put("/{paper_id}", response_model=PaperResponse)
def update_paper(
    *,
    paper_id: int,
    db: Session = Depends(deps.get_db),
    paper_in: PaperUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update paper metadata (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Paper).filter(Paper.id == paper_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Paper not found")

    if paper_in.title is not None:
        record.title = paper_in.title
    if paper_in.branch is not None:
        record.branch = paper_in.branch
    if paper_in.semester is not None:
        record.semester = paper_in.semester
    if paper_in.subject is not None:
        record.subject = paper_in.subject
    if paper_in.year is not None:
        record.year = paper_in.year

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{paper_id}")
def delete_paper(
    *,
    paper_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a paper and its file (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Paper).filter(Paper.id == paper_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Delete physical file
    if os.path.exists(record.file_path):
        try:
            os.remove(record.file_path)
        except Exception as e:
            print(f"Warning: Failed to delete file {record.file_path}: {e}")

    db.delete(record)
    db.commit()
    return {"msg": "Paper deleted successfully"}
