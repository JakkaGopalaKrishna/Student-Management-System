import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from sqlalchemy.orm import Session

def seed_admin(db: Session, email: str, password: str, full_name: str):
    admin = db.query(User).filter(User.email == email).first()
    if admin:
        print(f"Admin with email {email} already exists!")
        return

    admin = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        role=UserRole.ADMIN
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Admin created successfully! Email: {email}, Password: {password}")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_admin(db, "admin@campusconnect.com", "admin123", "System Administrator")
    finally:
        db.close()
