import sys
import os

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash

# Import all models to ensure they are registered with Base
from app.models.user import Admin, Teacher, Student
from app.models.attendance import Attendance
from app.models.fee import Fee, FeePayment
from app.models.mark import Mark
from app.models.note import Note
from app.models.paper import Paper
from app.models.syllabus import Syllabus
from app.models.holiday import Holiday
from app.models.notification import Notification, NotificationRead

def init_admin():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    admin_email = "admin@campus.com"
    admin_password = "adminpassword"
    
    try:
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.email == admin_email).first()
        if existing_admin:
            print("Admin account already exists.")
            return

        print("Creating admin account...")
        admin = Admin(
            name="Super Admin",
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            phone="1234567890",
            status="active"
        )
        db.add(admin)
        db.commit()
        print(f"Admin account created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()
