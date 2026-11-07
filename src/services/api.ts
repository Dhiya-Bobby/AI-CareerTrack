import {
  User,
  JobApplication,
  ResumeData,
  ResumeAnalysis,
  SkillGapAnalysis,
  InterviewSession,
  NotificationItem,
  DashboardAnalytics,
} from '../types';

const TOKEN_KEY = 'ai_careertrack_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 30000): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default JSON Content-Type if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const error: any = new Error(errorMsg);
      error.status = response.status;
      throw error;
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError: any = new Error(
        'Request timed out after 30 seconds. The server or AI service may be under high load. Please try again.'
      );
      timeoutError.status = 504;
      throw timeoutError;
    }
    if (err.message && err.message.includes('Failed to fetch')) {
      const netErr: any = new Error(
        'Network error connecting to the backend server. Please verify your connection.'
      );
      netErr.status = 0;
      throw netErr;
    }
    throw err;
  }
}

export const api = {
  // Auth
  async register(body: {
    email: string;
    password: string;
    full_name: string;
    target_role?: string;
    education?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(body: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async updateProfile(profile: Partial<User>): Promise<{ user: User; message: string }> {
    return request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      removeStoredToken();
    }
  },

  // Applications
  async getApplications(params: { search?: string; status?: string; sort?: string } = {}): Promise<{
    applications: JobApplication[];
  }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ applications: JobApplication[] }>(`/api/applications${qs}`);
  },

  async createApplication(data: Partial<JobApplication>): Promise<{
    message: string;
    application: JobApplication;
  }> {
    return request<{ message: string; application: JobApplication }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApplication(
    id: string,
    data: Partial<JobApplication>
  ): Promise<{ message: string; application: JobApplication }> {
    return request<{ message: string; application: JobApplication }>(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteApplication(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/applications/${id}`, {
      method: 'DELETE',
    });
  },

  // Resume
  async uploadResumeFile(file: File): Promise<{ message: string; resume: any }> {
    const formData = new FormData();
    formData.append('resume_file', file);
    return request<{ message: string; resume: any }>('/api/resume/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async uploadResumeText(resume_text: string, filename = 'pasted_resume.txt'): Promise<{
    message: string;
    resume: any;
  }> {
    return request<{ message: string; resume: any }>('/api/resume/upload', {
      method: 'POST',
      body: JSON.stringify({ resume_text, filename }),
    });
  },

  async getResume(): Promise<{ resume: ResumeData | null; analysis: ResumeAnalysis | null }> {
    return request<{ resume: ResumeData | null; analysis: ResumeAnalysis | null }>('/api/resume');
  },

  async analyzeResume(data: { resume_text?: string; resume_id?: string; target_role?: string } = {}): Promise<{
    message: string;
    analysis: ResumeAnalysis;
  }> {
    return request<{ message: string; analysis: ResumeAnalysis }>('/api/resume/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Skill Gap
  async analyzeSkillGap(data: {
    target_role: string;
    job_description: string;
    custom_skills?: string[];
  }): Promise<{ message: string; analysis: SkillGapAnalysis }> {
    return request<{ message: string; analysis: SkillGapAnalysis }>('/api/skills/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Interview Coach
  async generateInterviewQuestion(data: {
    job_role: string;
    category: string;
    difficulty: string;
    company_target?: string;
  }): Promise<{ message: string; session: InterviewSession }> {
    return request<{ message: string; session: InterviewSession }>('/api/interview/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async evaluateInterviewAnswer(data: {
    session_id: string;
    user_answer: string;
  }): Promise<{ message: string; session: InterviewSession }> {
    return request<{ message: string; session: InterviewSession }>('/api/interview/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getInterviewHistory(): Promise<{ sessions: InterviewSession[] }> {
    return request<{ sessions: InterviewSession[] }>('/api/interview/history');
  },

  // Analytics
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    return request<DashboardAnalytics>('/api/analytics/dashboard');
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    return request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ message: string; notification: NotificationItem }> {
    return request<{ message: string; notification: NotificationItem }>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  async markAllNotificationsRead(): Promise<{ message: string }> {
    return request<{ message: string }>('/api/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  // Demo Seeder
  async seedDemoData(): Promise<{ message: string }> {
    return request<{ message: string }>('/api/demo/seed', {
      method: 'POST',
    });
  },

  // Server health
  async checkHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
    return request<{ status: string; geminiConfigured: boolean }>('/api/health');
  },
};
