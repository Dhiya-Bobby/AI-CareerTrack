# AI CareerTrack System Architecture

## Overview
AI CareerTrack is structured as an industry-standard full-stack web application designed for high security, low latency, and accurate AI evaluation.

```
+-------------------------------------------------------------+
|                      React 19 Frontend                      |
|  - Modern SaaS Navigation (Sidebar, Breadcrumbs, Headers)   |
|  - Applications Pipeline (Table & Card Grid Views)          |
|  - AI Resume ATS Analyzer (Upload, Score Breakdown)         |
|  - Skill Gap Diagnostics (Math & Contextual Roadmaps)       |
|  - AI Interview Coach (Speech Recognition & Q&A Evaluation) |
|  - Recharts Visualizations & Funnel Reports                 |
+------------------------------+------------------------------+
                               |
                        REST / Bearer JWT
                               |
+------------------------------v------------------------------+
|                    REST API Server                          |
|  - Express / Node.js runtime on Port 3000                   |
|  - Python FastAPI alternative for Python production         |
|  - Bcrypt 10-round salted password hashing                  |
|  - JWT stateless session token verification                 |
|  - Multer memory storage & safe document extraction         |
|  - Deadline background verification engine                  |
+--------------+------------------------------+---------------+
               |                              |
+--------------v---------------+ +------------v---------------+
|     Data Persistence Layer   | |       Google Gemini AI     |
|   - MongoDB Collections      | |   - Gemini 3.8 Flash SDK   |
|   - Document indexes         | |   - Structured JSON schema |
|   - Atomic storage engine    | |   - ATS & Skill Gap models |
+------------------------------+ +----------------------------+
```

## Security Best Practices
1. **Password Hashing**: Passwords are never stored in plaintext; salted with bcrypt (10 rounds).
2. **Stateless Authorization**: Verified via signed JWTs with expiration; tokens kept client-side and sent via HTTP `Authorization: Bearer <token>` headers.
3. **User Isolation**: Every database query filters by `user_id` extracted directly from the verified JWT token.
4. **Environment Secrets**: `GEMINI_API_KEY` and `JWT_SECRET` are kept strictly server-side.
5. **No Hallucinated Scores**: Skill match and ATS calculations are generated through structured JSON schemas with explicit grading rubrics.
