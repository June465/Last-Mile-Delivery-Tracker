from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Notification, User, UserRole
from app.schemas import NotificationResponse
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.ADMIN:
        return db.query(Notification).order_by(Notification.timestamp.desc()).all()
    else:
        # Match recipient by email or phone
        return db.query(Notification).filter(
            (Notification.recipient == current_user.email) |
            (Notification.recipient == (current_user.phone or ""))
        ).order_by(Notification.timestamp.desc()).all()
