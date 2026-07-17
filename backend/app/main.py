from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import auth, students, attendance, marks, fees, notes, papers, syllabus, holidays, notifications, timetable, search
from app.core.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Campus Connect API",
    description="Smart Student Management System API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(marks.router, prefix="/api/marks", tags=["marks"])
app.include_router(fees.router, prefix="/api/fees", tags=["fees"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(papers.router, prefix="/api/papers", tags=["papers"])
app.include_router(syllabus.router, prefix="/api/syllabus", tags=["syllabus"])
app.include_router(holidays.router, prefix="/api/holidays", tags=["holidays"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(timetable.router, prefix="/api/timetable", tags=["timetable"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

import os
os.makedirs("uploads/profiles", exist_ok=True)
os.makedirs("uploads/notes", exist_ok=True)
os.makedirs("uploads/papers", exist_ok=True)
os.makedirs("uploads/syllabus", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "Welcome to Campus Connect API"}
