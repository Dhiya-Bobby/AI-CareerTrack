# AI CareerTrack Database Schema Documentation

AI CareerTrack employs a MongoDB document model with strict user data isolation via `user_id`.

---

## 1. `users` Collection
Stores registered user credentials, profile information, and career aspirations.

```json
{
  "_id": "UUID / ObjectId",
  "email": "candidate@university.edu",
  "password_hash": "$2a$10$... (Bcrypt salt + hash)",
  "full_name": "Alex Chen",
  "target_role": "Software Engineer",
  "education": "University of California, Berkeley – B.S. in CS",
  "experience_level": "Entry Level / Fresher",
  "target_companies": ["Google", "Stripe", "Microsoft"],
  "createdAt": "2026-10-01T12:00:00Z",
  "updatedAt": "2026-10-01T12:00:00Z"
}
```
**Indexes**:
- `{ email: 1 }` (Unique)

---

## 2. `job_applications` Collection
Stores applications tracked across all recruitment stages.

```json
{
  "_id": "UUID / ObjectId",
  "user_id": "user-uuid",
  "company_name": "Google",
  "job_role": "Software Engineer (Early Career)",
  "job_description": "Building scalable backend services...",
  "company_website": "https://careers.google.com",
  "application_link": "https://careers.google.com/jobs/123",
  "application_date": "2026-10-15",
  "application_deadline": "2026-11-20",
  "location": "Mountain View, CA / Hybrid",
  "salary_range": "$145k - $175k",
  "application_status": "Interview", // Applied | Assessment | Interview | Selected | Rejected
  "notes": "Passed technical phone screen.",
  "createdAt": "2026-10-15T10:00:00Z",
  "updatedAt": "2026-10-25T14:30:00Z"
}
```
**Indexes**:
- `{ user_id: 1, application_date: -1 }`
- `{ user_id: 1, application_status: 1 }`

---

## 3. `resumes` Collection
Stores raw extracted document text and file metadata.

```json
{
  "_id": "UUID / ObjectId",
  "user_id": "user-uuid",
  "filename": "Alex_Chen_Software_Engineer_Resume.pdf",
  "file_type": "application/pdf",
  "file_size": 45210,
  "raw_text": "Full extracted resume text...",
  "createdAt": "2026-10-15T10:00:00Z",
  "updatedAt": "2026-10-15T10:00:00Z"
}
```

---

## 4. `resume_analysis` Collection
Stores structured Gemini AI ATS evaluation outputs.

```json
{
  "_id": "UUID / ObjectId",
  "user_id": "user-uuid",
  "resume_id": "resume-uuid",
  "overall_score": 88,
  "summary": "High-caliber candidate with strong CS fundamentals...",
  "technical_skills": ["Python", "TypeScript", "FastAPI", "React", "Docker"],
  "soft_skills": ["Technical Mentorship", "Agile Collaboration"],
  "education_details": [
    {
      "degree": "B.S. in Computer Science",
      "institution": "UC Berkeley",
      "year": "Expected May 2026",
      "details": "GPA: 3.84/4.00"
    }
  ],
  "projects_experience": [
    {
      "title": "Software Engineering Intern",
      "organization": "CloudScale Labs",
      "description": "Event-driven webhook pipeline...",
      "highlights": ["Processed 45k+ webhooks", "94% pytest coverage"]
    }
  ],
  "structure_evaluation": {
    "formatting_score": 92,
    "impact_score": 87,
    "clarity_score": 90,
    "ats_compatibility": "High"
  },
  "strengths": ["Strong metrics and quantification throughout."],
  "weaknesses": ["Could highlight more cloud components (Terraform, K8s)."],
  "improvement_suggestions": ["Include performance throughput in requests/sec."],
  "missing_keywords": ["Kubernetes", "CI/CD Pipelines", "Prometheus"],
  "createdAt": "2026-10-15T10:05:00Z"
}
```

---

## 5. `skill_gap_analysis` Collection
```json
{
  "_id": "UUID / ObjectId",
  "user_id": "user-uuid",
  "target_role": "Python Backend Engineer",
  "job_description": "...",
  "skill_match_percentage": 75,
  "matching_skills": ["Python", "SQL", "Git", "REST APIs"],
  "missing_skills": ["Docker", "Kafka"],
  "partially_matching_skills": ["FastAPI"],
  "recommended_technical_skills": ["Docker", "Kafka"],
  "recommended_learning_topics": [
    {
      "topic": "Docker Containerization",
      "description": "Multi-stage Docker builds and docker-compose...",
      "estimated_time": "10-12 hours",
      "resources": ["Docker Official Docs", "FastAPI in Containers Guide"]
    }
  ],
  "suggested_preparation_roadmap": [
    {
      "step": "Container Fundamentals",
      "timeframe": "Week 1",
      "focus_areas": ["Dockerfile", "Port mapping", "Volume mounts"]
    }
  ],
  "createdAt": "2026-10-16T12:00:00Z"
}
```

---

## 6. `interview_sessions` Collection
```json
{
  "_id": "UUID / ObjectId",
  "user_id": "user-uuid",
  "job_role": "Software Engineer",
  "category": "Technical",
  "difficulty": "Intermediate",
  "question": "Design an idempotent payment webhook receiver...",
  "context_or_scenario": "At 10,000 req/sec, network retries may duplicate calls.",
  "rubric_points": ["Idempotency keys", "Database transactions", "Deduplication caches"],
  "user_answer": "I would use a unique idempotency key stored in Redis...",
  "evaluation": {
    "score": 88,
    "overall_verdict": "Strong Hire",
    "strengths": ["Correctly leveraged Redis atomic set-if-not-exists."],
    "improvements": ["Mention TTL expiration window on idempotency keys."],
    "missing_points": ["Dead-letter queues for unprocessable webhooks."],
    "ideal_sample_answer": "A resilient idempotent webhook processor uses...",
    "technical_depth_score": 90,
    "clarity_score": 85
  },
  "completed": true,
  "createdAt": "2026-10-18T15:00:00Z"
}
```

---

## 7. `notifications` Collection
```json
{
  "_id": "UUID / ObjectId",
  "user_id": "user-uuid",
  "title": "Upcoming Deadline: Microsoft",
  "message": "Software Engineer deadline is in 3 days.",
  "type": "deadline",
  "related_application_id": "app-uuid",
  "read": false,
  "due_date": "2026-11-12",
  "createdAt": "2026-11-09T00:00:00Z"
}
```
