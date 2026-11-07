from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# User Models
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    target_role: Optional[str] = "Software Engineer"
    education: Optional[str] = "B.S. in Computer Science"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    target_role: Optional[str] = None
    education: Optional[str] = None
    experience_level: Optional[str] = None
    target_companies: Optional[List[str]] = []

# Job Application Models
class JobApplicationCreate(BaseModel):
    company_name: str
    job_role: str
    job_description: Optional[str] = ""
    company_website: Optional[str] = ""
    application_link: Optional[str] = ""
    application_date: Optional[str] = None
    application_deadline: Optional[str] = None
    location: Optional[str] = "Remote / Hybrid"
    salary_range: Optional[str] = None
    application_status: str = "Applied" # Applied, Assessment, Interview, Selected, Rejected
    notes: Optional[str] = ""

class JobApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_role: Optional[str] = None
    job_description: Optional[str] = None
    company_website: Optional[str] = None
    application_link: Optional[str] = None
    application_date: Optional[str] = None
    application_deadline: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    application_status: Optional[str] = None
    notes: Optional[str] = None

# Resume Models
class ResumeUploadResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    createdAt: str
    preview_text: str

class ResumeAnalysisResponse(BaseModel):
    overall_score: int
    summary: str
    technical_skills: List[str]
    soft_skills: List[str]
    education_details: List[Dict[str, Any]]
    projects_experience: List[Dict[str, Any]]
    structure_evaluation: Dict[str, Any]
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]
    missing_keywords: List[str]

# Skill Gap Models
class SkillGapRequest(BaseModel):
    target_role: str
    job_description: str
    custom_skills: Optional[List[str]] = []

# Interview Models
class InterviewGenerateRequest(BaseModel):
    job_role: str
    category: str # Technical, HR, Coding, Behavioral, Company-specific
    difficulty: str # Beginner, Intermediate, Advanced
    company_target: Optional[str] = None

class InterviewEvaluateRequest(BaseModel):
    session_id: str
    user_answer: str
