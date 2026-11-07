import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface BaseDoc {
  _id: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export class JsonCollection<T extends BaseDoc> {
  private filePath: string;
  private memoryCache: Map<string, T> = new Map();
  private loaded = false;

  constructor(public collectionName: string) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const list: T[] = JSON.parse(raw);
        this.memoryCache.clear();
        for (const item of list) {
          this.memoryCache.set(item._id, item);
        }
      } else {
        this.persist();
      }
      this.loaded = true;
    } catch (err) {
      console.error(`Error loading collection ${this.collectionName}:`, err);
      this.memoryCache = new Map();
      this.loaded = true;
    }
  }

  private persist() {
    try {
      const items = Array.from(this.memoryCache.values());
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error saving collection ${this.collectionName}:`, err);
    }
  }

  async find(query: Partial<T> | ((item: T) => boolean) = {}): Promise<T[]> {
    if (!this.loaded) this.load();
    const all = Array.from(this.memoryCache.values());
    if (typeof query === 'function') {
      return all.filter(query);
    }
    return all.filter((item) => {
      for (const key of Object.keys(query)) {
        if ((item as any)[key] !== (query as any)[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query: Partial<T> | ((item: T) => boolean)): Promise<T | null> {
    const results = await this.find(query);
    return results[0] || null;
  }

  async findById(id: string): Promise<T | null> {
    if (!this.loaded) this.load();
    return this.memoryCache.get(id) || null;
  }

  async insertOne(doc: Omit<T, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }): Promise<T> {
    if (!this.loaded) this.load();
    const now = new Date().toISOString();
    const _id = doc._id || crypto.randomUUID();
    const fullDoc = {
      ...doc,
      _id,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    this.memoryCache.set(_id, fullDoc);
    this.persist();
    return fullDoc;
  }

  async updateOne(id: string, update: Partial<T>): Promise<T | null> {
    if (!this.loaded) this.load();
    const existing = this.memoryCache.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...update,
      _id: existing._id,
      user_id: existing.user_id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.memoryCache.set(id, updated);
    this.persist();
    return updated;
  }

  async deleteOne(id: string): Promise<boolean> {
    if (!this.loaded) this.load();
    const existed = this.memoryCache.delete(id);
    if (existed) {
      this.persist();
    }
    return existed;
  }

  async count(query: Partial<T> = {}): Promise<number> {
    const list = await this.find(query);
    return list.length;
  }
}

// Collections according to database specifications:
// 1. users
// 2. job_applications
// 3. resumes
// 4. resume_analysis
// 5. skill_gap_analysis
// 6. interview_sessions
// 7. interview_questions
// 8. notifications

export interface UserDoc extends BaseDoc {
  email: string;
  password_hash: string;
  full_name: string;
  target_role?: string;
  target_companies?: string[];
  education?: string;
  experience_level?: string;
  avatar_url?: string;
}

export interface JobApplicationDoc extends BaseDoc {
  company_name: string;
  job_role: string;
  job_description?: string;
  company_website?: string;
  application_link?: string;
  application_date: string;
  application_deadline?: string;
  location: string;
  salary_range?: string;
  application_status: 'Applied' | 'Assessment' | 'Interview' | 'Selected' | 'Rejected';
  notes?: string;
}

export interface ResumeDoc extends BaseDoc {
  filename: string;
  file_type: string;
  raw_text: string;
  file_size: number;
}

export interface ResumeAnalysisDoc extends BaseDoc {
  resume_id: string;
  overall_score: number; // 0-100
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
  education_details: Array<{ degree?: string; institution?: string; year?: string; details?: string }>;
  projects_experience: Array<{ title: string; organization?: string; description?: string; highlights?: string[] }>;
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
}

export interface SkillGapAnalysisDoc extends BaseDoc {
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
}

export interface InterviewSessionDoc extends BaseDoc {
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
}

export interface NotificationDoc extends BaseDoc {
  title: string;
  message: string;
  type: 'deadline' | 'status_reminder' | 'system' | 'interview';
  related_application_id?: string;
  read: boolean;
  due_date?: string;
}

export const usersDb = new JsonCollection<UserDoc>('users');
export const applicationsDb = new JsonCollection<JobApplicationDoc>('job_applications');
export const resumesDb = new JsonCollection<ResumeDoc>('resumes');
export const resumeAnalysisDb = new JsonCollection<ResumeAnalysisDoc>('resume_analysis');
export const skillGapAnalysisDb = new JsonCollection<SkillGapAnalysisDoc>('skill_gap_analysis');
export const interviewSessionsDb = new JsonCollection<InterviewSessionDoc>('interview_sessions');
export const notificationsDb = new JsonCollection<NotificationDoc>('notifications');
