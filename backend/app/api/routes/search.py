from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api import deps

from app.models.user import Student
from app.models.note import Note
from app.models.paper import Paper
from app.models.syllabus import Syllabus
from app.models.notification import Notification
from app.schemas.search import SearchResponse, SearchResult

router = APIRouter()

@router.get("/", response_model=SearchResponse)
def global_search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Search across multiple modules and return unified results.
    """
    results = []
    limit_per_category = 3
    search_term = f"%{q}%"

    # 1. Search Students (Admin only)
    if current_user.role == "admin":
        students = db.query(Student).filter(
            (Student.name.ilike(search_term) | 
             Student.roll_number.ilike(search_term) |
             Student.email.ilike(search_term))
        ).limit(limit_per_category).all()

        for s in students:
            results.append(SearchResult(
                type="student",
                title=s.name,
                subtitle=f"{s.roll_number} • {s.department_branch} ({s.semester})",
                link="students.html",
                id=s.id
            ))

    # 2. Search Notes
    notes = db.query(Note).filter(
        Note.title.ilike(search_term) | 
        Note.subject.ilike(search_term)
    ).limit(limit_per_category).all()
    
    for n in notes:
        results.append(SearchResult(
            type="note",
            title=n.title,
            subtitle=f"{n.subject} • {n.branch}",
            link="student-notes.html" if current_user.role == "student" else "notes.html",
            id=n.id
        ))

    # 3. Search Previous Papers
    papers = db.query(Paper).filter(
        Paper.title.ilike(search_term) | 
        Paper.subject.ilike(search_term)
    ).limit(limit_per_category).all()

    for p in papers:
        results.append(SearchResult(
            type="paper",
            title=p.title,
            subtitle=f"{p.subject} • {p.year}",
            link="student-papers.html" if current_user.role == "student" else "papers.html",
            id=p.id
        ))

    # 4. Search Syllabus (Covers "Subjects" search as well)
    syllabus = db.query(Syllabus).filter(
        Syllabus.title.ilike(search_term)
    ).limit(limit_per_category).all()

    for s in syllabus:
        results.append(SearchResult(
            type="syllabus",
            title=s.title,
            subtitle=f"{s.branch} • {s.semester}",
            link="student-syllabus.html" if current_user.role == "student" else "syllabus.html",
            id=s.id
        ))

    # 5. Search Notifications
    notifications = db.query(Notification).filter(
        Notification.title.ilike(search_term) | 
        Notification.message.ilike(search_term)
    ).limit(limit_per_category).all()

    for n in notifications:
        results.append(SearchResult(
            type="notification",
            title=n.title,
            subtitle=f"{n.priority.upper()} Priority",
            link="student-notifications.html" if current_user.role == "student" else "notifications.html",
            id=n.id
        ))

    return {"results": results}
