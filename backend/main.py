"""
AI CareerTrack - FastAPI Production Backend
Industry-grade REST API architecture with MongoDB and Google Gemini integration.
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

from backend.database import (
    init_indexes,
    users_collection,
    applications_collection,
    resumes_collection,
    resume_analysis_collection,
    skill_gap_collection,
    interview_sessions_collection,
    notifications_collection,
)
from backend.models import (
    UserRegisterRequest,
    UserLoginRequest,
    JobApplicationCreate,
    JobApplicationUpdate,
    SkillGapRequest,
    InterviewGenerateRequest,
    InterviewEvaluateRequest,
)

app = FastAPI(
    title="AI CareerTrack REST API",
    description="Enterprise-grade career tracking, ATS resume analysis, skill gap diagnostics, and AI interview coach.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_indexes()

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI CareerTrack FastAPI Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }

# FastAPI routers can be modularized under backend/routers
