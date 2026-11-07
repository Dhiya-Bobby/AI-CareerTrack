export type ApplicationStatus = 'Applied' | 'Assessment' | 'Interview' | 'Selected' | 'Rejected';

export interface User {
  id: string;
  email: string;
  full_name: string;
  target_role?: string;
  education?: string;
  experience_level?: string;
  target_companies?: string[];
}

export interface JobApplication {
  _id: string;
  user_id: string;
  company_name: string;
  job_role: string;
  job_description?: string;
  company_website?: string;
  application_link?: string;
  application_date: string;
  application_deadline?: string;
  location: string;
  salary_range?: string;
  application_status: ApplicationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeData {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  raw_text: string;
  createdAt: string;
}

export interface ResumeAnalysis {
  _id: string;
  resume_id: string;
  overall_score: number;
  score_explanation?: string;
  summary: string;
  technical_skills: string[];
  soft_skills: string[];
  categorized_skills?: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools_and_cloud: string[];
    soft_skills: string[];
  };
  education_details: Array<{
    degree?: string;
    institution?: string;
    year?: string;
    details?: string;
  }>;
  projects_experience: Array<{
    title: string;
    organization?: string;
    description?: string;
    highlights?: string[];
  }>;
  structure_evaluation: {
    formatting_score: number;
    impact_score: number;
    clarity_score: number;
    ats_compatibility: string;
    formatting_suggestions?: string[];
    content_improvements?: string[];
  };
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  missing_keywords: string[];
  job_role_matching?: {
    target_role: string;
    matching_skills: string[];
    missing_skills: string[];
    match_percentage: number;
  };
  improvement_recommendations?: {
    actionable_improvements: string[];
    recommended_skills: string[];
    ats_compatibility_tips: string[];
  };
  createdAt: string;
}

export interface SkillGapAnalysis {
  _id: string;
  target_role: string;
  job_description: string;
  skill_match_percentage: number;
  matching_skills: string[];
  missing_skills: string[];
  partially_matching_skills: string[];
  recommended_technical_skills: string[];
  recommended_learning_topics: Array<{
    topic: string;
    description: string;
    estimated_time: string;
    resources: string[];
  }>;
  suggested_preparation_roadmap: Array<{
    step: string;
    timeframe: string;
    focus_areas: string[];
  }>;
  createdAt: string;
}

export interface InterviewSession {
  _id: string;
  job_role: string;
  category: 'Technical' | 'HR' | 'Coding' | 'Behavioral' | 'Company-specific';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  context_or_scenario?: string;
  rubric_points?: string[];
  user_answer?: string;
  evaluation?: {
    score: number;
    overall_verdict: string;
    strengths: string[];
    improvements: string[];
    missing_points: string[];
    ideal_sample_answer: string;
    technical_depth_score: number;
    clarity_score: number;
  };
  completed: boolean;
  is_fallback?: boolean;
  source?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'deadline' | 'status_reminder' | 'system' | 'interview';
  related_application_id?: string;
  read: boolean;
  due_date?: string;
  createdAt: string;
}

export interface DashboardAnalytics {
  metrics: {
    total: number;
    inProgress: number;
    applied: number;
    assessment: number;
    interview: number;
    selected: number;
    rejected: number;
    successRate: number;
    interviewConversionRate: number;
    rejectionRate: number;
  };
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  monthlyTrends: Array<{ month: string; applications: number; interviews: number; offers: number }>;
  companyStats: Array<{ name: string; count: number }>;
  upcomingDeadlines: Array<{
    id: string;
    company_name: string;
    job_role: string;
    deadline: string;
    days_left: number;
    status: ApplicationStatus;
  }>;
  recentApplications: JobApplication[];
}
