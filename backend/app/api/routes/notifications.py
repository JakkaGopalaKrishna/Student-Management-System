from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationRead
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationResponse
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve all notifications. For students, annotates 'is_read'.
    """
    notifications = db.query(Notification).order_by(Notification.created_at.desc()).all()
    
    result = []
    
    if current_user.role == UserRole.STUDENT:
        # Get all read records for this student
        read_records = db.query(NotificationRead).filter(NotificationRead.student_id == current_user.id).all()
        read_ids = {r.notification_id for r in read_records}
        
        for n in notifications:
            n_dict = {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "priority": n.priority,
                "created_at": n.created_at,
                "is_read": n.id in read_ids
            }
            result.append(n_dict)
    else:
        # Admins just see the notifications
        for n in notifications:
            n_dict = {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "priority": n.priority,
                "created_at": n.created_at,
                "is_read": None
            }
            result.append(n_dict)
            
    return result

@router.post("/", response_model=NotificationResponse)
def create_notification(
    *,
    db: Session = Depends(deps.get_db),
    notif_in: NotificationCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new notification (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_notif = Notification(
        title=notif_in.title,
        message=notif_in.message,
        priority=notif_in.priority
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

@router.put("/{notif_id}", response_model=NotificationResponse)
def update_notification(
    *,
    notif_id: int,
    db: Session = Depends(deps.get_db),
    notif_in: NotificationUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a notification (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Notification).filter(Notification.id == notif_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notif_in.title is not None:
        record.title = notif_in.title
    if notif_in.message is not None:
        record.message = notif_in.message
    if notif_in.priority is not None:
        record.priority = notif_in.priority

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{notif_id}")
def delete_notification(
    *,
    notif_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a notification (Admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    record = db.query(Notification).filter(Notification.id == notif_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Delete associated reads first (cascade not set up, so manual delete)
    db.query(NotificationRead).filter(NotificationRead.notification_id == notif_id).delete()
    
    db.delete(record)
    db.commit()
    return {"msg": "Notification deleted successfully"}

@router.post("/{notif_id}/read")
def mark_as_read(
    *,
    notif_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark a notification as read (Student only).
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can mark as read")

    # Check if notification exists
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    # Check if already read
    read_record = db.query(NotificationRead).filter(
        NotificationRead.student_id == current_user.id,
        NotificationRead.notification_id == notif_id
    ).first()
    
    if not read_record:
        new_read = NotificationRead(
            student_id=current_user.id,
            notification_id=notif_id
        )
        db.add(new_read)
        db.commit()
        
    return {"msg": "Marked as read"}

@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all notifications as read (Student only).
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can mark as read")

    # Get all notifications
    notifications = db.query(Notification).all()
    notif_ids = {n.id for n in notifications}
    
    # Get already read
    read_records = db.query(NotificationRead).filter(NotificationRead.student_id == current_user.id).all()
    read_ids = {r.notification_id for r in read_records}
    
    unread_ids = notif_ids - read_ids
    
    for uid in unread_ids:
        new_read = NotificationRead(
            student_id=current_user.id,
            notification_id=uid
        )
        db.add(new_read)
        
    db.commit()
    return {"msg": "All marked as read"}
