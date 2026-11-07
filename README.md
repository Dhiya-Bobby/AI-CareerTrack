# AI CareerTrack – AI-Powered Job Application & Career Management Platform

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20Node%20%7C%20MongoDB%20%7C%20Gemini-indigo.svg)](#technology-stack)
[![AI Driven](https://img.shields.io/badge/AI-Google%20Gemini%203.8%20Flash-00C49F.svg)](#ai-integration)

> An industry-level, full-stack career platform designed for college students, fresh graduates, and software engineers to manage job pipelines, analyze resumes with ATS algorithms, diagnose skill gaps against job postings, and practice with an interactive AI interview coach.

---

## 🚀 Key Features

### 1. Job Application Tracker
- **Pipeline Stages**: Track applications seamlessly across `Applied`, `Assessment`, `Interview`, `Selected`, and `Rejected`.
- **Advanced Filtering & Sorting**: Filter by stage, search by company/role/location, and sort by upcoming deadlines or application dates.
- **Dual Visual Modes**: Switch between high-density data tables and visual Kanban card views.
- **Notes & Milestone Tracking**: Record recruiter notes, assessment scores, and compensation targets.

### 2. AI Resume & ATS Analyzer
- **Document Processing**: Upload PDF and DOCX documents or paste formatted resume text.
- **ATS Scoring Engine**: 0–100 score evaluating formatting, metric quantification, clarity, and ATS screener readability.
- **Automatic Entity Extraction**: Identifies technical skills, soft skills, university coursework, and project highlights.
- **Actionable Critique**: Highlights key strengths, weak bullet points, concrete improvement suggestions, and missing high-yield keywords.

### 3. AI Skill Gap Diagnostics
- **Target Role Matching**: Paste any job description to compare against your verified resume skills.
- **Mathematical Alignment**: Computes exact matching, missing, and partially matching skill lists.
- **Curated Learning Roadmap**: 4-phase preparation timeline with estimated study hours and authoritative documentation resources.

### 4. Interactive AI Interview Coach
- **Dynamic Question Synthesis**: Generates authentic technical, HR, coding, and behavioral interview questions customized to your target role and difficulty level.
- **Voice & Text Answering**: Dictate responses using integrated browser speech-to-text or structured text inputs.
- **Executive Hiring Evaluation**: Grades responses on depth, clarity, and technical correctness with a gold-standard sample answer.
- **Historical Telemetry**: Tracks previous interview sessions and scores.

### 5. Application Deadline Management & Notifications
- **Upcoming Milestone Alerts**: Automatic detection of milestones approaching within 7 days.
- **Overdue Detection**: Highlights overdue applications with quick follow-up actions.
- **In-App Notification Center**: Real-time alerts with unread badges and batch dismissals.

### 6. Analytics & Funnel Reports
- **Interactive Visualizations**: Powered by Recharts for monthly velocity, interview conversion rate, and company distribution.
- **Conversion Funnel**: Tracks the drop-off rate from initial application to final offer.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons |
| **Backend (Runtime)** | Node.js Express full-stack API with Vite middlewares |
| **Backend (FastAPI)** | Python 3.10+, FastAPI, Motor, Pydantic v2, PyPDF, python-docx |
| **Database** | MongoDB (PyMongo / Motor & JSON document persistence layer) |
| **AI Integration** | Google Gemini 3.8 Flash (`@google/genai` & Python GenAI SDK) |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt password hashing, persistent sessions |
| **Testing** | Pytest, AsyncClient, TypeScript strict compiler |

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│     React 19 SPA + TypeScript + Tailwind CSS + Recharts     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST API / Bearer JWT
┌──────────────────────────────▼──────────────────────────────┐
│                    REST API Gateway                         │
│   Authentication · Applications · Resume · Skills · Coach   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     Database Layer          ││       AI Engine              │
│    MongoDB Collections:     ││    Google Gemini 3.8 Flash   │
│  - users                    ││   - ATS Resume Analysis      │
│  - job_applications         ││   - Skill Gap Diagnostics    │
│  - resumes & analysis       ││   - Question Synthesis       │
│  - interview_sessions       ││   - Gold-Standard Evaluation │
│  - notifications            ││                              │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/AI-CareerTrack.git
cd AI-CareerTrack
```

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
JWT_SECRET="your-jwt-secure-secret-key"
MONGODB_URI="mongodb://localhost:27017" # Optional
```

### 3. Run the Web Application
```bash
# Install dependencies
npm install

# Start the full-stack server
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Running the Python FastAPI Backend (Optional / Portfolio)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

---

## 🧪 Testing

Run automated tests:
```bash
# TypeScript compilation and lint verification
npm run lint

# Python backend pytest suite
pytest backend/tests/test_api.py -v
```

---

## 📄 Documentation

- [API Specification](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [System Architecture](./ARCHITECTURE.md)

---

## ⚖️ License
Apache-2.0 License. Built for Computer Science Engineering portfolio and technical placement demonstration.
