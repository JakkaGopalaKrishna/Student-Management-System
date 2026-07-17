# Campus Connect - Smart Student Management System

![Campus Connect](https://img.shields.io/badge/Status-Production_Ready-success) ![Version](https://img.shields.io/badge/Version-2.0-blue)

**Campus Connect** is a comprehensive, production-ready Student Management System designed specifically for modern educational institutions. Developed as a final-year diploma project, it seamlessly integrates advanced administrative controls with an intuitive student experience.

The application strictly adheres to the requested technology stack: a **FastAPI** backend powering a robust **MySQL** relational database, consumed by a beautiful, responsive, dependency-free **HTML5/CSS3/Vanilla JS** frontend.

---

## 🌟 Core Features

### 🔐 Secure Authentication & Authorization
- **Role-Based Access Control (RBAC):** Strict separation of concerns between `Admin` and `Student` roles.
- **JWT Authentication:** Secure stateless session management.
- **Password Hashing:** Utilizing bcrypt for maximum database security.

### 👥 Student & Profile Management
- **Admin Controls:** Register, manage, and monitor the entire student body.
- **Student Dashboard:** Personalized student profiles featuring dynamic updates, photo uploads, and self-service editable details.

### 📅 Academic Operations
- **Attendance Tracking:** Granular day-by-day attendance tracking with overall percentage calculators.
- **Marks & Grading:** Detailed academic performance tracking (Internal & External marks) with automated Pass/Fail logic.
- **Timetable Generation:** A highly dynamic, visual weekly grid and exam scheduler.
- **Syllabus Management:** Centralized repository for branch and semester-specific curricula.

### 💰 Financial Management
- **Fee Tracking:** Granular control over expected, paid, and pending fee records.
- **Financial Status:** Visual indicators for students regarding their dues.

### 📚 Digital Repository
- **Digital Library (Notes):** Upload, search, and download PDF study materials.
- **Previous Papers:** A dedicated archive for past examination papers.

### 🚀 Advanced Integrations
- **Global Search:** A debounced, real-time universal search bar indexing across all modules (Students, Notes, Papers, Syllabus, Notifications).
- **Official Reports:** An admin-only engine that aggregates live data into official, downloadable A4 PDF documents using client-side generation (`html2pdf.js`).
- **Live Notifications:** Priority-based announcement broadcasting with dynamic unread badges on the navigation bar.

---

## 🏗️ Technical Architecture

The project is structured as a decoupled monolith, strictly separating the client interface from the server logic.

### 1. Backend (FastAPI + MySQL)
- **Framework:** FastAPI (High performance, async python framework).
- **ORM:** SQLAlchemy.
- **Database:** MySQL (`pymysql` driver).
- **Structure:**
  - `models/`: SQLAlchemy declarative base models mapping directly to MySQL tables.
  - `schemas/`: Pydantic models enforcing strict input validation and response shaping.
  - `api/routes/`: Modularized routing (e.g., `students.py`, `fees.py`, `search.py`).
  - `core/`: Security protocols, database connections, and configuration management.

### 2. Frontend (HTML5 / CSS3 / Vanilla JS)
- **UI/UX:** Responsive CSS Grid and Flexbox layouts. Uses modern CSS Variables for a dynamic theming engine (Light/Dark mode).
- **Interactivity:** Clean, modular Vanilla JavaScript. No heavy frontend frameworks (React/Vue/jQuery) ensuring lightning-fast load times.
- **API Integration:** A centralized `api.js` utilizing the Fetch API to securely communicate with the FastAPI backend, handling JWT token injection automatically.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- MySQL Server (running on `localhost:3306`)
- A basic HTTP server (e.g., VSCode Live Server) for the frontend

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Database:
   - Ensure your MySQL server is running.
   - Create a database named `campus_connect` in MySQL.
   - The `.env` file is pre-configured for `mysql+pymysql://root:@localhost:3306/campus_connect`. Update the credentials if your MySQL requires a password.
5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will be live at http://localhost:8000. Swagger UI documentation is automatically generated at http://localhost:8000/docs.*

### Frontend Setup
1. Open the `frontend` folder in your preferred code editor.
2. Launch the application using a local web server (like the VSCode "Live Server" extension) so that it serves `index.html`.
3. Log in using the default Admin credentials (or register a new user).

---

## 🎨 UI & Theming

The application features a robust theming engine. Users can toggle between **Light Mode** and **Dark Mode** via the Settings page. This is handled entirely through CSS Variables (`css/variables.css`), ensuring a flash-free, highly performant visual transition that persists across sessions.

---

*This project was meticulously crafted to meet all requirements of a professional, production-ready Student Management System.*
