# AI CareerTrack REST API Documentation

Base URL: `/api`

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints

### Register User
- **POST** `/api/auth/register`
- **Body**:
```json
{
  "email": "user@university.edu",
  "password": "securepassword",
  "full_name": "Jane Doe",
  "target_role": "Backend Engineer",
  "education": "B.S. in Computer Science"
}
```
- **Response** `201 Created`:
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "user@university.edu",
    "full_name": "Jane Doe",
    "target_role": "Backend Engineer",
    "education": "B.S. in Computer Science"
  }
}
```

### Login
- **POST** `/api/auth/login`
- **Body**:
```json
{
  "email": "user@university.edu",
  "password": "securepassword"
}
```
- **Response** `200 OK`: Returns JWT token and user profile.

### Get Current User Profile
- **GET** `/api/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** `200 OK`: Returns authenticated user details.

---

## 2. Job Applications Endpoints

### List Applications
- **GET** `/api/applications`
- **Query Parameters**:
  - `status`: Filter by status (`Applied`, `Assessment`, `Interview`, `Selected`, `Rejected`)
  - `search`: Case-insensitive text search in company, role, or location
  - `sort`: `newest`, `oldest`, `deadline`, `company`
- **Response** `200 OK`: `{ "applications": [...] }`

### Create Application
- **POST** `/api/applications`
- **Body**:
```json
{
  "company_name": "Stripe",
  "job_role": "Backend Engineer",
  "job_description": "Building high-availability payment APIs...",
  "company_website": "https://stripe.com",
  "application_link": "https://stripe.com/jobs/123",
  "application_date": "2026-10-15",
  "application_deadline": "2026-11-20",
  "location": "Remote / San Francisco",
  "salary_range": "$140k - $170k",
  "application_status": "Interview",
  "notes": "Completed initial screening round."
}
```

### Update Application
- **PUT** `/api/applications/:id`
- **Body**: Partial application updates.

### Delete Application
- **DELETE** `/api/applications/:id`

---

## 3. Resume & ATS Analysis Endpoints

### Upload Resume
- **POST** `/api/resume/upload`
- **Content-Type**: `multipart/form-data` or `application/json`
- Supports file upload (`.pdf`, `.docx`, `.txt`) or raw `resume_text`.

### Get Latest Resume & Score
- **GET** `/api/resume`
- Returns parsed resume metadata and previous ATS analysis.

### Run AI ATS Diagnostic
- **POST** `/api/resume/analyze`
- Executes Gemini 3.8 Flash evaluation and produces structured ATS assessment.

---

## 4. Skill Gap Diagnostics Endpoints

### Analyze Job Description
- **POST** `/api/skills/analyze`
- **Body**:
```json
{
  "target_role": "Python Developer",
  "job_description": "Requires Python, FastAPI, Docker, and PostgreSQL...",
  "custom_skills": ["Python", "SQL", "Git"]
}
```
- **Response**: Exact matching, missing, partially matching skills, match percentage, and 4-phase learning roadmap.

---

## 5. AI Interview Coach Endpoints

### Generate Dynamic Question
- **POST** `/api/interview/generate`
- **Body**:
```json
{
  "job_role": "Software Engineer",
  "category": "Technical",
  "difficulty": "Intermediate",
  "company_target": "Google"
}
```

### Evaluate Candidate Response
- **POST** `/api/interview/evaluate`
- **Body**:
```json
{
  "session_id": "session-uuid",
  "user_answer": "I would structure the database using read-replicas..."
}
```
- **Response**: Hiring verdict, score /100, strengths, missed concepts, and gold-standard sample answer.

### Interview History
- **GET** `/api/interview/history`

---

## 6. Deadlines & Notifications Endpoints

- **GET** `/api/notifications`: Retrieves user notifications and unread badge count.
- **PUT** `/api/notifications/:id/read`: Marks a single notification as read.
- **POST** `/api/notifications/mark-all-read`: Marks all notifications as read.

---

## 7. Analytics Endpoints

- **GET** `/api/analytics/dashboard`: Computes live pipeline telemetry, conversion rates, and monthly trends from database records.
