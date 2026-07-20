# Database Tables Documentation

This document outlines the database tables and their schema used in the Student Management System.

## Users

### `admins`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `name` | String(100) | Full name |
| `email` | String(100) | Unique, Indexed |
| `hashed_password` | String(255) | |
| `phone` | String(20) | |
| `department_branch` | String(100) | |
| `status` | String(20) | Default: "active" |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |
| `reset_password_token` | String(255) | Indexed |
| `reset_password_expire` | DateTime | |

### `teachers`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `name` | String(100) | Full name |
| `email` | String(100) | Unique, Indexed |
| `hashed_password` | String(255) | |
| `phone` | String(20) | |
| `department_branch` | String(100) | |
| `status` | String(20) | Default: "active" |
| `employee_id` | String(50) | Unique, Indexed |
| `gender` | String(20) | |
| `designation` | String(100) | |
| `qualification` | String(200) | |
| `experience` | String(100) | |
| `address` | Text | |
| `profile_photo` | String(255) | |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |
| `reset_password_token` | String(255) | Indexed |
| `reset_password_expire` | DateTime | |

### `students`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `name` | String(100) | Full name |
| `email` | String(100) | Unique, Indexed |
| `hashed_password` | String(255) | |
| `phone` | String(20) | |
| `department_branch` | String(100) | E.g., Computer Science |
| `status` | String(20) | Default: "active" |
| `roll_number` | String(50) | Unique, Indexed |
| `gender` | String(20) | |
| `dob` | String(20) | YYYY-MM-DD |
| `semester` | String(20) | |
| `section` | String(20) | |
| `address` | Text | |
| `parent_name` | String(100) | |
| `parent_phone` | String(20) | |
| `profile_photo` | String(255) | |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |
| `reset_password_token` | String(255) | Indexed |
| `reset_password_expire` | DateTime | |

---

## Academic Records

### `attendance`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `student_id` | Integer | Foreign Key (`students.id`) |
| `date` | Date | Indexed |
| `subject` | String(100) | Indexed |
| `status` | Enum | Present, Absent, Late |
| `remarks` | Text | |

### `marks`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `student_id` | Integer | Foreign Key (`students.id`) |
| `subject` | String(100) | Indexed |
| `semester` | String(20) | Indexed |
| `exam_type` | Enum | Internal, External |
| `marks_obtained` | Float | |
| `max_marks` | Float | |
| `remarks` | Text | |

---

## Finance & Fees

### `fees`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `student_id` | Integer | Foreign Key (`students.id`) |
| `title` | String(150) | |
| `total_amount` | Float | |
| `paid_amount` | Float | Default: 0.0 |
| `due_date` | Date | |
| `status` | Enum | Pending, Partial, Paid |

### `fee_payments`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `fee_id` | Integer | Foreign Key (`fees.id`) |
| `amount_paid` | Float | |
| `payment_date` | Date | Default: current date |
| `payment_method` | String(50) | |
| `reference_number`| String(100) | |

---

## Content & Resources

### `notes`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `title` | String(200) | |
| `branch` | String(100) | Indexed |
| `semester` | String(50) | Indexed |
| `subject` | String(100) | Indexed |
| `file_path` | String(500) | |
| `upload_date` | DateTime | Default: current time |
| `uploader_id` | Integer | Foreign Key (`admins.id`) |

### `papers`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `title` | String(200) | |
| `branch` | String(100) | Indexed |
| `semester` | String(50) | Indexed |
| `subject` | String(100) | Indexed |
| `year` | Integer | Indexed |
| `file_path` | String(500) | |
| `upload_date` | DateTime | Default: current time |
| `uploader_id` | Integer | Foreign Key (`admins.id`) |

### `syllabus`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `title` | String(200) | |
| `branch` | String(100) | Indexed |
| `semester` | String(50) | Indexed |
| `file_path` | String(500) | |
| `upload_date` | DateTime | Default: current time |
| `uploader_id` | Integer | Foreign Key (`admins.id`) |

---

## Scheduling & Communication

### `timetable`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `branch` | String(100) | Indexed |
| `semester` | String(50) | Indexed |
| `entry_type` | Enum | class, exam |
| `subject` | String(200) | |
| `room` | String(100) | |
| `start_time` | Time | |
| `end_time` | Time | |
| `day_of_week` | String(20) | For weekly classes (e.g., Monday) |
| `exam_date` | Date | For exams |

### `holidays`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `title` | String(100) | |
| `date` | Date | Unique, Indexed |
| `description` | String(500) | |

### `notifications`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `title` | String(200) | |
| `message` | Text | |
| `priority` | Enum | low, medium, high |
| `created_at` | DateTime | Default: current time |

### `notification_reads`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key |
| `student_id` | Integer | Foreign Key (`students.id`) |
| `notification_id` | Integer | Foreign Key (`notifications.id`) |
| `read_at` | DateTime | Default: current time |
