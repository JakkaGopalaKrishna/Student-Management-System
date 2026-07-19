import os
import sys
import random
from datetime import date, timedelta, datetime

# Add the backend directory to python path
sys.path.append('/home/jgkrishna/Desktop/Student-Management-System/backend')

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import Student, Teacher, Admin
from app.models.mark import Mark, ExamType
from app.models.attendance import Attendance, AttendanceStatus
from app.models.fee import Fee, FeeStatus

# Ensure tables are created
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_data():
    password_hash = get_password_hash("aditya@123")
    
    # 1. Add Teachers
    teachers_data = [
        {"name": "Dr. Smith", "email": "smith@college.edu", "phone": "1234567890", "department_branch": "Computer Science", "employee_id": "EMP001", "designation": "Professor"},
        {"name": "Prof. Davis", "email": "davis@college.edu", "phone": "1234567891", "department_branch": "Mechanical", "employee_id": "EMP002", "designation": "Assistant Professor"}
    ]
    
    teachers = []
    for t_data in teachers_data:
        existing = db.query(Teacher).filter(Teacher.email == t_data["email"]).first()
        if not existing:
            teacher = Teacher(
                name=t_data["name"],
                email=t_data["email"],
                hashed_password=password_hash,
                phone=t_data["phone"],
                department_branch=t_data["department_branch"],
                employee_id=t_data["employee_id"],
                designation=t_data["designation"],
                created_at=datetime.utcnow()
            )
            db.add(teacher)
            teachers.append(teacher)
        else:
            teachers.append(existing)
            
    db.commit()

    # 2. Add Students
    students_data = [
        {"name": "Alice Johnson", "email": "alice@student.edu", "phone": "9876543210", "department_branch": "Computer Science", "roll_number": "CS-2023-001", "semester": "5th", "section": "A"},
        {"name": "Bob Williams", "email": "bob@student.edu", "phone": "9876543211", "department_branch": "Computer Science", "roll_number": "CS-2023-002", "semester": "5th", "section": "B"},
        {"name": "Charlie Brown", "email": "charlie@student.edu", "phone": "9876543212", "department_branch": "Mechanical", "roll_number": "ME-2023-001", "semester": "3rd", "section": "A"},
        {"name": "Diana Prince", "email": "diana@student.edu", "phone": "9876543213", "department_branch": "Electrical", "roll_number": "EE-2023-001", "semester": "1st", "section": "A"},
        {"name": "Evan Wright", "email": "evan@student.edu", "phone": "9876543214", "department_branch": "Computer Science", "roll_number": "CS-2023-003", "semester": "7th", "section": "A"}
    ]
    
    students = []
    for s_data in students_data:
        existing = db.query(Student).filter(Student.email == s_data["email"]).first()
        if not existing:
            student = Student(
                name=s_data["name"],
                email=s_data["email"],
                hashed_password=password_hash,
                phone=s_data["phone"],
                department_branch=s_data["department_branch"],
                roll_number=s_data["roll_number"],
                semester=s_data["semester"],
                section=s_data["section"],
                created_at=datetime.utcnow()
            )
            db.add(student)
            students.append(student)
        else:
            students.append(existing)
            
    db.commit()

    # 3. Add Marks, Attendance, and Fees for each student
    subjects = ["Data Structures", "Algorithms", "Operating Systems", "Database Systems"]
    
    for student in students:
        # Add Marks
        if db.query(Mark).filter(Mark.student_id == student.id).count() == 0:
            for sub in subjects:
                mark = Mark(
                    student_id=student.id,
                    subject=sub,
                    semester=student.semester,
                    exam_type=ExamType.INTERNAL,
                    marks_obtained=random.uniform(15.0, 30.0),
                    max_marks=30.0,
                    remarks="Good"
                )
                db.add(mark)
                
                mark2 = Mark(
                    student_id=student.id,
                    subject=sub,
                    semester=student.semester,
                    exam_type=ExamType.EXTERNAL,
                    marks_obtained=random.uniform(40.0, 70.0),
                    max_marks=70.0,
                    remarks="Passed"
                )
                db.add(mark2)

        # Add Attendance
        if db.query(Attendance).filter(Attendance.student_id == student.id).count() == 0:
            for i in range(10):
                att_date = date.today() - timedelta(days=i)
                att = Attendance(
                    student_id=student.id,
                    date=att_date,
                    subject=random.choice(subjects),
                    status=random.choice([AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT]),
                    remarks=""
                )
                db.add(att)
                
        # Add Fees
        if db.query(Fee).filter(Fee.student_id == student.id).count() == 0:
            fee1 = Fee(
                student_id=student.id,
                title="Tuition Fee Semester " + student.semester,
                total_amount=50000.0,
                paid_amount=random.choice([0.0, 25000.0, 50000.0]),
                due_date=date.today() + timedelta(days=30),
            )
            if fee1.paid_amount == 50000.0:
                fee1.status = FeeStatus.PAID
            elif fee1.paid_amount > 0:
                fee1.status = FeeStatus.PARTIAL
            else:
                fee1.status = FeeStatus.PENDING
                
            db.add(fee1)

    db.commit()
    print("Database seeded successfully with dummy data! All passwords set to 'aditya@123'")

if __name__ == "__main__":
    try:
        seed_data()
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
