import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import {
  usersDb,
  applicationsDb,
  resumesDb,
  resumeAnalysisDb,
  skillGapAnalysisDb,
  interviewSessionsDb,
  notificationsDb,
  JobApplicationDoc,
} from './storage.ts';
import {
  analyzeResumeWithGemini,
  analyzeSkillGapWithGemini,
  generateInterviewQuestionWithGemini,
  evaluateInterviewAnswerWithGemini,
  getAiClient,
} from './geminiService.ts';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'careertrack-jwt-secure-signing-secret-key-2026';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Set up Multer memory storage for resume uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc|txt|md)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are supported.'));
    }
  },
});

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// Authentication middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  });
}

// Automatically sync upcoming deadline notifications for a user
async function checkDeadlinesAndNotify(userId: string) {
  try {
    const apps = await applicationsDb.find({ user_id: userId });
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const app of apps) {
      if (app.application_deadline && app.application_status !== 'Selected' && app.application_status !== 'Rejected') {
        const deadlineDate = new Date(app.application_deadline);
        const deadlineStr = app.application_deadline.split('T')[0];

        // If overdue
        if (deadlineDate < now) {
          const existingNotif = await notificationsDb.findOne({
            user_id: userId,
            related_application_id: app._id,
            type: 'deadline',
            due_date: deadlineStr,
          });
          if (!existingNotif) {
            await notificationsDb.insertOne({
              user_id: userId,
              title: `Application Overdue: ${app.company_name}`,
              message: `The deadline for ${app.job_role} at ${app.company_name} was ${deadlineStr}.`,
              type: 'deadline',
              related_application_id: app._id,
              read: false,
              due_date: deadlineStr,
            });
          }
        } else if (deadlineDate <= sevenDaysLater) {
          // Approaching within 7 days
          const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const existingNotif = await notificationsDb.findOne({
            user_id: userId,
            related_application_id: app._id,
            type: 'deadline',
            due_date: deadlineStr,
          });
          if (!existingNotif) {
            await notificationsDb.insertOne({
              user_id: userId,
              title: `Upcoming Deadline: ${app.company_name}`,
              message: `${app.job_role} deadline is in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${deadlineStr}).`,
              type: 'deadline',
              related_application_id: app._id,
              read: false,
              due_date: deadlineStr,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error checking deadlines:', err);
  }
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, target_role, education } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await usersDb.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await usersDb.insertOne({
      email: normalizedEmail,
      password_hash,
      full_name: full_name.trim(),
      target_role: target_role?.trim() || 'Software Engineer',
      education: education?.trim() || 'B.S. in Computer Science',
      experience_level: 'Entry Level / Fresher',
    });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Initial welcome notification
    await notificationsDb.insertOne({
      user_id: newUser._id,
      title: 'Welcome to AI CareerTrack',
      message: 'Upload your resume to get instant ATS scores and personalized interview coaching.',
      type: 'system',
      read: false,
    });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        full_name: newUser.full_name,
        target_role: newUser.target_role,
        education: newUser.education,
        experience_level: newUser.experience_level,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersDb.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Check deadlines in background
    checkDeadlinesAndNotify(user._id);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        target_role: user.target_role,
        education: user.education,
        experience_level: user.experience_level,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// Get Current User (Me)
app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await usersDb.findById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Trigger deadline check
    checkDeadlinesAndNotify(user._id);

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        target_role: user.target_role,
        education: user.education,
        experience_level: user.experience_level,
        target_companies: user.target_companies || [],
      },
    });
  } catch (err: any) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Server error retrieving user profile.' });
  }
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { full_name, target_role, education, experience_level, target_companies } = req.body;
    const updated = await usersDb.updateOne(req.userId!, {
      full_name,
      target_role,
      education,
      experience_level,
      target_companies,
    });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: updated._id,
        email: updated.email,
        full_name: updated.full_name,
        target_role: updated.target_role,
        education: updated.education,
        experience_level: updated.experience_level,
        target_companies: updated.target_companies || [],
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully.' });
});

// ==========================================
// JOB APPLICATIONS ROUTES
// ==========================================

// Get All Applications (with search, filter, sort)
app.get('/api/applications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, sort } = req.query;
    let list = await applicationsDb.find({ user_id: req.userId! });

    if (status && status !== 'all') {
      list = list.filter((app) => app.application_status.toLowerCase() === (status as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(
        (app) =>
          app.company_name.toLowerCase().includes(q) ||
          app.job_role.toLowerCase().includes(q) ||
          app.location.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.application_date).getTime() - new Date(b.application_date).getTime();
      }
      if (sort === 'deadline') {
        if (!a.application_deadline) return 1;
        if (!b.application_deadline) return -1;
        return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
      }
      if (sort === 'company') {
        return a.company_name.localeCompare(b.company_name);
      }
      // default: newest application_date
      return new Date(b.application_date).getTime() - new Date(a.application_date).getTime();
    });

    return res.json({ applications: list });
  } catch (err) {
    console.error('Get applications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve job applications.' });
  }
});

// Create Application
app.post('/api/applications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      company_name,
      job_role,
      job_description,
      company_website,
      application_link,
      application_date,
      application_deadline,
      location,
      salary_range,
      application_status,
      notes,
    } = req.body;

    if (!company_name || !job_role) {
      return res.status(400).json({ error: 'Company name and job role are required.' });
    }

    const validStatuses = ['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'];
    const status = validStatuses.includes(application_status) ? application_status : 'Applied';

    const newApp = await applicationsDb.insertOne({
      user_id: req.userId!,
      company_name: company_name.trim(),
      job_role: job_role.trim(),
      job_description: job_description || '',
      company_website: company_website || '',
      application_link: application_link || '',
      application_date: application_date || new Date().toISOString().split('T')[0],
      application_deadline: application_deadline || '',
      location: location || 'Remote / Hybrid',
      salary_range: salary_range || '',
      application_status: status as any,
      notes: notes || '',
    });

    // If status is Interview or Assessment, generate notification
    if (status === 'Interview') {
      await notificationsDb.insertOne({
        user_id: req.userId!,
        title: `Interview Scheduled: ${newApp.company_name}`,
        message: `Practice your technical and behavioral responses in the AI Interview Coach for ${newApp.job_role}!`,
        type: 'interview',
        related_application_id: newApp._id,
        read: false,
      });
    }

    // Trigger deadline check
    checkDeadlinesAndNotify(req.userId!);

    return res.status(201).json({
      message: 'Application created successfully',
      application: newApp,
    });
  } catch (err) {
    console.error('Create application error:', err);
    return res.status(500).json({ error: 'Failed to create job application.' });
  }
});

// Update Application
app.put('/api/applications/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await applicationsDb.findById(id);

    if (!existing || existing.user_id !== req.userId!) {
      return res.status(404).json({ error: 'Application not found or unauthorized.' });
    }

    const previousStatus = existing.application_status;
    const updated = await applicationsDb.updateOne(id, req.body);

    // If status changed to Interview, remind to prepare
    if (req.body.application_status === 'Interview' && previousStatus !== 'Interview') {
      await notificationsDb.insertOne({
        user_id: req.userId!,
        title: `Interview Stage Reached: ${updated?.company_name}`,
        message: `Congratulations! Use the AI Interview Coach to prepare questions for ${updated?.job_role}.`,
        type: 'interview',
        related_application_id: id,
        read: false,
      });
    }

    checkDeadlinesAndNotify(req.userId!);

    return res.json({
      message: 'Application updated successfully',
      application: updated,
    });
  } catch (err) {
    console.error('Update application error:', err);
    return res.status(500).json({ error: 'Failed to update job application.' });
  }
});

// Delete Application
app.delete('/api/applications/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await applicationsDb.findById(id);

    if (!existing || existing.user_id !== req.userId!) {
      return res.status(404).json({ error: 'Application not found or unauthorized.' });
    }

    await applicationsDb.deleteOne(id);
    return res.json({ message: 'Application deleted successfully.' });
  } catch (err) {
    console.error('Delete application error:', err);
    return res.status(500).json({ error: 'Failed to delete job application.' });
  }
});

// ==========================================
// RESUME MODULE ROUTES
// ==========================================

// Upload Resume (file or raw text)
app.post(
  '/api/resume/upload',
  authenticateToken,
  upload.single('resume_file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let rawText = '';
      let filename = 'pasted_resume.txt';
      let fileType = 'text/plain';
      let fileSize = 0;

      if (req.file) {
        filename = req.file.originalname;
        fileType = req.file.mimetype;
        fileSize = req.file.size;

        if (fileType.includes('pdf')) {
          // Extract text from PDF buffer
          const buffer = req.file.buffer;
          // Simple clean text extraction from PDF stream chunks if standard PDF
          const str = buffer.toString('binary');
          const textMatches = str.match(/\((.*?)\)\s*Tj/g) || [];
          const extracted = textMatches
            .map((m) => m.replace(/^\(/, '').replace(/\)\s*Tj$/, ''))
            .join(' ');
          rawText = extracted && extracted.length > 50 ? extracted : buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        } else {
          // TXT, DOCX, or Markdown
          rawText = req.file.buffer.toString('utf-8');
        }
      } else if (req.body.resume_text) {
        rawText = req.body.resume_text;
        filename = req.body.filename || 'manual_entry_resume.txt';
        fileSize = Buffer.byteLength(rawText, 'utf-8');
      } else {
        return res.status(400).json({ error: 'Please upload a PDF/DOCX file or paste your resume text.' });
      }

      if (!rawText || rawText.trim().length < 40) {
        return res.status(400).json({
          error: 'Could not extract sufficient text from document. Please ensure it contains readable text or paste directly.',
        });
      }

      const newResume = await resumesDb.insertOne({
        user_id: req.userId!,
        filename,
        file_type: fileType,
        raw_text: rawText.trim(),
        file_size: fileSize,
      });

      return res.status(201).json({
        message: 'Resume uploaded successfully',
        resume: {
          id: newResume._id,
          filename: newResume.filename,
          file_size: newResume.file_size,
          createdAt: newResume.createdAt,
          preview_text: newResume.raw_text.slice(0, 300) + '...',
        },
      });
    } catch (err: any) {
      console.error('Resume upload error:', err);
      return res.status(500).json({ error: err.message || 'Failed to upload resume.' });
    }
  }
);

// Get Latest Resume and Analysis
app.get('/api/resume', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resumes = await resumesDb.find({ user_id: req.userId! });
    resumes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestResume = resumes[0] || null;

    let latestAnalysis = null;
    if (latestResume) {
      const analyses = await resumeAnalysisDb.find({
        user_id: req.userId!,
        resume_id: latestResume._id,
      });
      analyses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      latestAnalysis = analyses[0] || null;
    }

    return res.json({
      resume: latestResume
        ? {
            id: latestResume._id,
            filename: latestResume.filename,
            file_type: latestResume.file_type,
            file_size: latestResume.file_size,
            raw_text: latestResume.raw_text,
            createdAt: latestResume.createdAt,
          }
        : null,
      analysis: latestAnalysis,
    });
  } catch (err) {
    console.error('Get resume error:', err);
    return res.status(500).json({ error: 'Failed to retrieve resume details.' });
  }
});

// Analyze Resume with Gemini AI
app.post('/api/resume/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let resumeText = req.body.resume_text;
    let resumeId = req.body.resume_id;
    let targetRole = req.body.target_role;

    if (!resumeText) {
      const resumes = await resumesDb.find({ user_id: req.userId! });
      resumes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (resumes.length === 0) {
        return res.status(400).json({ error: 'No resume found. Please upload or paste a resume first.' });
      }
      resumeText = resumes[0].raw_text;
      resumeId = resumes[0]._id;
    }

    if (!targetRole) {
      const user = await usersDb.findById(req.userId!);
      targetRole = user?.target_role || 'Software Engineer';
    }

    if (!getAiClient()) {
      return res.status(503).json({
        error: 'Gemini AI API Key is not configured on the server. Please check Settings > Secrets.',
      });
    }

    const aiResult = await analyzeResumeWithGemini(resumeText, targetRole);

    // Save complete structured analysis in database
    const savedAnalysis = await resumeAnalysisDb.insertOne({
      user_id: req.userId!,
      resume_id: resumeId || 'direct_analysis',
      overall_score: aiResult.overall_score || 78,
      score_explanation: aiResult.score_explanation || 'Evaluation based on extracted skills, project achievements, and ATS formatting clarity.',
      summary: aiResult.summary || 'Strong candidate profile with solid foundational skills.',
      technical_skills: aiResult.technical_skills || [],
      soft_skills: aiResult.soft_skills || [],
      categorized_skills: aiResult.categorized_skills || {
        languages: (aiResult.technical_skills || []).slice(0, 5),
        frameworks: [],
        databases: [],
        tools_and_cloud: [],
        soft_skills: aiResult.soft_skills || [],
      },
      education_details: aiResult.education_details || [],
      projects_experience: aiResult.projects_experience || [],
      structure_evaluation: aiResult.structure_evaluation || {
        formatting_score: 80,
        impact_score: 75,
        clarity_score: 80,
        ats_compatibility: 'High (Standard single-column clean format)',
        formatting_suggestions: [],
        content_improvements: [],
      },
      strengths: aiResult.strengths || [],
      weaknesses: aiResult.weaknesses || [],
      improvement_suggestions: aiResult.improvement_suggestions || [],
      missing_keywords: aiResult.missing_keywords || [],
      job_role_matching: aiResult.job_role_matching || {
        target_role: targetRole,
        matching_skills: (aiResult.technical_skills || []).slice(0, 6),
        missing_skills: aiResult.missing_keywords || [],
        match_percentage: aiResult.overall_score || 75,
      },
      improvement_recommendations: aiResult.improvement_recommendations || {
        actionable_improvements: aiResult.improvement_suggestions || [],
        recommended_skills: aiResult.missing_keywords || [],
        ats_compatibility_tips: [
          'Use standard reverse-chronological work and education layouts.',
          'Quantify accomplishments with concrete percentages, latency metrics, or user volume.',
        ],
      },
    });

    return res.json({
      message: 'Resume analyzed successfully',
      analysis: savedAnalysis,
    });
  } catch (err: any) {
    console.error('Analyze resume error:', err);
    // Note: The uploaded resume in resumesDb remains preserved
    return res.status(503).json({
      error: err.message || 'AI resume analysis encountered a temporary service issue. Your resume is safely preserved; please click Retry Analysis.',
    });
  }
});

// ==========================================
// SKILL GAP ANALYZER ROUTES
// ==========================================

app.post('/api/skills/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { target_role, job_description, custom_skills } = req.body;

    if (!target_role || !job_description) {
      return res.status(400).json({ error: 'Target role and job description are required.' });
    }

    let candidateSkills: string[] = custom_skills || [];

    // If candidate skills not provided in request, attempt to extract from latest resume analysis
    if (candidateSkills.length === 0) {
      const analyses = await resumeAnalysisDb.find({ user_id: req.userId! });
      analyses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (analyses.length > 0 && analyses[0].technical_skills) {
        candidateSkills = analyses[0].technical_skills;
      }
    }

    if (!getAiClient()) {
      return res.status(503).json({
        error: 'Gemini AI API Key is not configured on the server. Please check Settings > Secrets.',
      });
    }

    const gapResult = await analyzeSkillGapWithGemini(target_role, job_description, candidateSkills);

    const saved = await skillGapAnalysisDb.insertOne({
      user_id: req.userId!,
      target_role,
      job_description,
      skill_match_percentage: gapResult.skill_match_percentage,
      matching_skills: gapResult.matching_skills,
      missing_skills: gapResult.missing_skills,
      partially_matching_skills: gapResult.partially_matching_skills,
      recommended_technical_skills: gapResult.recommended_technical_skills,
      recommended_learning_topics: gapResult.recommended_learning_topics,
      suggested_preparation_roadmap: gapResult.suggested_preparation_roadmap,
    });

    return res.json({
      message: 'Skill gap analysis complete',
      analysis: saved,
    });
  } catch (err: any) {
    console.error('Skill gap analysis error:', err);
    return res.status(503).json({ error: err.message || 'Failed to complete skill gap analysis.' });
  }
});

// ==========================================
// AI INTERVIEW COACH ROUTES
// ==========================================

// Generate question
app.post('/api/interview/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { job_role, category, difficulty, company_target } = req.body;

    if (!job_role || !category || !difficulty) {
      return res.status(400).json({ error: 'Job role, category, and difficulty level are required.' });
    }

    const generated = await generateInterviewQuestionWithGemini(
      job_role,
      category,
      difficulty,
      company_target
    );

    const session = await interviewSessionsDb.insertOne({
      user_id: req.userId!,
      job_role,
      category,
      difficulty,
      question: generated.question,
      context_or_scenario: generated.context_or_scenario,
      rubric_points: generated.rubric_points,
      is_fallback: generated.is_fallback || false,
      source: generated.source || 'Gemini AI',
      completed: false,
    });

    return res.json({
      message: 'Interview question generated',
      session,
    });
  } catch (err: any) {
    console.error('Interview generate error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate interview question.' });
  }
});

// Evaluate answer
app.post('/api/interview/evaluate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id, user_answer } = req.body;

    if (!session_id || !user_answer) {
      return res.status(400).json({ error: 'Session ID and your answer are required.' });
    }

    const session = await interviewSessionsDb.findById(session_id);
    if (!session || session.user_id !== req.userId!) {
      return res.status(404).json({ error: 'Interview session not found or unauthorized.' });
    }

    const evalResult = await evaluateInterviewAnswerWithGemini(
      session.job_role,
      session.category,
      session.difficulty,
      session.question,
      user_answer
    );

    const updated = await interviewSessionsDb.updateOne(session_id, {
      user_answer,
      evaluation: evalResult,
      completed: true,
    });

    return res.json({
      message: 'Evaluation complete',
      session: updated,
    });
  } catch (err: any) {
    console.error('Interview evaluation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to evaluate interview answer.' });
  }
});

// Interview History
app.get('/api/interview/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await interviewSessionsDb.find({ user_id: req.userId! });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ sessions: list });
  } catch (err) {
    console.error('Get interview history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve interview history.' });
  }
});

// ==========================================
// ANALYTICS & DASHBOARD METRICS
// ==========================================

app.get('/api/analytics/dashboard', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const apps = await applicationsDb.find({ user_id: req.userId! });

    const total = apps.length;
    const applied = apps.filter((a) => a.application_status === 'Applied').length;
    const assessment = apps.filter((a) => a.application_status === 'Assessment').length;
    const interview = apps.filter((a) => a.application_status === 'Interview').length;
    const selected = apps.filter((a) => a.application_status === 'Selected').length;
    const rejected = apps.filter((a) => a.application_status === 'Rejected').length;

    // Rates
    const inProgress = applied + assessment + interview;
    const resolved = selected + rejected;
    const successRate = total > 0 ? Math.round((selected / total) * 100) : 0;
    const interviewConversionRate = total > 0 ? Math.round(((interview + selected) / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

    // Monthly trends (group by YYYY-MM)
    const monthMap: Record<string, { month: string; applications: number; interviews: number; offers: number }> = {};
    for (const app of apps) {
      const d = app.application_date ? new Date(app.application_date) : new Date(app.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthMap[key]) {
        monthMap[key] = { month: monthLabel, applications: 0, interviews: 0, offers: 0 };
      }
      monthMap[key].applications += 1;
      if (app.application_status === 'Interview') monthMap[key].interviews += 1;
      if (app.application_status === 'Selected') monthMap[key].offers += 1;
    }

    const monthlyTrends = Object.keys(monthMap)
      .sort()
      .map((k) => monthMap[k]);

    // Company stats
    const companyMap: Record<string, number> = {};
    for (const app of apps) {
      companyMap[app.company_name] = (companyMap[app.company_name] || 0) + 1;
    }
    const companyStats = Object.entries(companyMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    // Status distribution
    const statusDistribution = [
      { name: 'Applied', value: applied, color: '#3B82F6' },
      { name: 'Assessment', value: assessment, color: '#8B5CF6' },
      { name: 'Interview', value: interview, color: '#F59E0B' },
      { name: 'Selected', value: selected, color: '#10B981' },
      { name: 'Rejected', value: rejected, color: '#EF4444' },
    ];

    // Upcoming deadlines (< 14 days)
    const now = new Date();
    const upcomingDeadlines = apps
      .filter((a) => a.application_deadline && a.application_status !== 'Selected' && a.application_status !== 'Rejected')
      .map((a) => {
        const d = new Date(a.application_deadline!);
        const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: a._id,
          company_name: a.company_name,
          job_role: a.job_role,
          deadline: a.application_deadline,
          days_left: daysLeft,
          status: a.application_status,
        };
      })
      .sort((a, b) => a.days_left - b.days_left)
      .slice(0, 5);

    // Recent applications
    const recent = [...apps]
      .sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime())
      .slice(0, 5);

    return res.json({
      metrics: {
        total,
        inProgress,
        applied,
        assessment,
        interview,
        selected,
        rejected,
        successRate,
        interviewConversionRate,
        rejectionRate,
      },
      statusDistribution,
      monthlyTrends,
      companyStats,
      upcomingDeadlines,
      recentApplications: recent,
    });
  } catch (err) {
    console.error('Analytics dashboard error:', err);
    return res.status(500).json({ error: 'Failed to compute analytics dashboard.' });
  }
});

// ==========================================
// NOTIFICATIONS ROUTES
// ==========================================

app.get('/api/notifications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await notificationsDb.find({ user_id: req.userId! });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = list.filter((n) => !n.read).length;
    return res.json({ notifications: list, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notif = await notificationsDb.findById(id);
    if (!notif || notif.user_id !== req.userId!) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const updated = await notificationsDb.updateOne(id, { read: true });
    return res.json({ message: 'Marked as read', notification: updated });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

app.post('/api/notifications/mark-all-read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await notificationsDb.find({ user_id: req.userId! });
    for (const item of list) {
      if (!item.read) {
        await notificationsDb.updateOne(item._id, { read: true });
      }
    }
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

// ==========================================
// DEMO SEED ROUTE (FOR EASY RECRUITER / REVIEW)
// ==========================================

app.post('/api/demo/seed', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    // Clear user's existing records
    const existingApps = await applicationsDb.find({ user_id: userId });
    for (const a of existingApps) await applicationsDb.deleteOne(a._id);

    // Realistic placement-season sample applications
    const sampleApps: Omit<JobApplicationDoc, '_id' | 'createdAt' | 'updatedAt'>[] = [
      {
        user_id: userId,
        company_name: 'Google',
        job_role: 'Software Engineer (Early Career)',
        job_description:
          'Design scalable distributed backend systems, microservices in Go/C++/Java, and collaborate on high-throughput cloud infrastructure.',
        company_website: 'https://careers.google.com',
        application_link: 'https://careers.google.com/jobs/results/12345',
        application_date: '2026-10-15',
        application_deadline: '2026-11-20',
        location: 'Mountain View, CA / Hybrid',
        salary_range: '$145k - $175k',
        application_status: 'Interview',
        notes: 'Passed Technical Screening. Virtual Onsite scheduled for distributed systems & algorithms.',
      },
      {
        user_id: userId,
        company_name: 'Microsoft',
        job_role: 'Software Engineer - Azure Cloud',
        job_description:
          'Building reliable cloud infrastructure, RESTful microservices, and telemetry pipelines for Azure Core Compute.',
        company_website: 'https://careers.microsoft.com',
        application_link: 'https://careers.microsoft.com/us/en/job/6789',
        application_date: '2026-10-22',
        application_deadline: '2026-11-12',
        location: 'Redmond, WA / Remote',
        salary_range: '$135k - $160k',
        application_status: 'Assessment',
        notes: 'Completed Codility Online Assessment (3 questions, 100% test cases passed). Awaiting recruiter feedback.',
      },
      {
        user_id: userId,
        company_name: 'Stripe',
        job_role: 'Backend Engineer - Payments Platform',
        job_description:
          'Maintain high-availability payment routing APIs, idempotent transactional databases, and fraud detection integrations.',
        company_website: 'https://stripe.com/jobs',
        application_link: 'https://stripe.com/jobs/listing/stripe-pay',
        application_date: '2026-10-05',
        application_deadline: '2026-10-28',
        location: 'San Francisco, CA / Remote',
        salary_range: '$160k - $190k',
        application_status: 'Selected',
        notes: 'Offer received! Final compensation package with equity and sign-on bonus under review.',
      },
      {
        user_id: userId,
        company_name: 'Amazon',
        job_role: 'Software Development Engineer I (SDE 1)',
        job_description:
          'Develop customer-facing low-latency APIs on AWS (Lambda, DynamoDB, ECS) for global fulfillment.',
        company_website: 'https://amazon.jobs',
        application_link: 'https://amazon.jobs/en/jobs/998877',
        application_date: '2026-09-28',
        application_deadline: '2026-11-04',
        location: 'Seattle, WA',
        salary_range: '$130k - $155k',
        application_status: 'Interview',
        notes: 'Final round technical interview scheduled on Leadership Principles & System Design.',
      },
      {
        user_id: userId,
        company_name: 'Meta',
        job_role: 'Software Engineer, Systems & Infrastructure',
        job_description:
          'Optimize massive scale infrastructure, caching layers, and asynchronous messaging pipelines.',
        company_website: 'https://metacareers.com',
        application_link: 'https://metacareers.com/v1',
        application_date: '2026-09-10',
        application_deadline: '2026-10-01',
        location: 'Menlo Park, CA',
        salary_range: '$150k - $180k',
        application_status: 'Rejected',
        notes: 'Reached round 2. Position filled by internal transfer. Re-apply in 6 months.',
      },
      {
        user_id: userId,
        company_name: 'Datadog',
        job_role: 'Full Stack Engineer - Observability',
        job_description:
          'Create real-time metric visualization interfaces in React/TypeScript and fast Golang ingestion servers.',
        company_website: 'https://www.datadoghq.com/careers',
        application_link: 'https://datadoghq.com/jobs',
        application_date: '2026-11-01',
        application_deadline: '2026-11-25',
        location: 'New York, NY / Hybrid',
        salary_range: '$140k - $165k',
        application_status: 'Applied',
        notes: 'Referred by alumni. Application submitted through employee referral portal.',
      },
    ];

    for (const sample of sampleApps) {
      await applicationsDb.insertOne(sample);
    }

    // Seed sample resume if not present
    const existingResumes = await resumesDb.find({ user_id: userId });
    if (existingResumes.length === 0) {
      const sampleResume = await resumesDb.insertOne({
        user_id: userId,
        filename: 'Alex_Chen_Software_Engineer_Resume.pdf',
        file_type: 'application/pdf',
        file_size: 45210,
        raw_text: `ALEX CHEN
San Francisco, CA | (555) 019-2834 | alex.chen@example.edu | linkedin.com/in/alexchen-swe | github.com/alexchen-dev

EDUCATION
University of California, Berkeley – B.S. in Computer Science (GPA: 3.84/4.00) | Expected May 2026
Relevant Coursework: Data Structures & Algorithms, Distributed Systems, Operating Systems, Database Management Systems, Computer Networks.

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, Java, Go, C++, SQL, HTML/CSS
Frameworks & Libraries: React, Node.js, Express, FastAPI, Next.js, Tailwind CSS, PyTorch
Databases & Cloud: PostgreSQL, MongoDB, Redis, AWS (S3, EC2, Lambda), Docker, Git, CI/CD pipelines, REST APIs, GraphQL

WORK & LEADERSHIP EXPERIENCE
Software Engineering Intern | CloudScale Labs (June 2025 – August 2025)
- Architected an asynchronous event-driven notification microservice in Python/FastAPI processing 45,000+ daily webhooks with Redis pub/sub.
- Designed automated regression test suite using pytest, achieving 94% code coverage and preventing 12 deployment regressions.
- Containerized development workflows using Docker Compose, reducing team onboarding setup time from 3 hours to 15 minutes.

Open Source Contributor & CS Teaching Assistant | UC Berkeley (Jan 2025 – Present)
- Guided 120+ undergraduate students through binary search trees, Dijkstra shortest paths, and dynamic programming algorithms.
- Contributed bug fixes and documentation to Apache Kafka client library in Python.

PROJECTS
AI CareerTrack – Career Intelligence & Interview Coach (Python, React, TypeScript, MongoDB, Gemini API)
- Built full-stack platform managing job pipelines, ATS score diagnostics, and dynamic interview simulations.
- Integrated Gemini API with structured JSON schemas to compute skill match percentages against complex job descriptions.

Real-Time Distributed Chat Engine (Go, WebSockets, PostgreSQL, Redis)
- Developed horizontally scalable chat server handling 10,000 concurrent WebSocket connections with <15ms latency.
- Implemented JWT token rotation and message persistence in PostgreSQL with read-replica caching.`,
      });

      // Seed analysis for this resume
      await resumeAnalysisDb.insertOne({
        user_id: userId,
        resume_id: sampleResume._id,
        overall_score: 88,
        summary:
          'High-caliber candidate with strong CS fundamentals, concrete distributed systems internship experience, and impressive full-stack projects.',
        technical_skills: [
          'Python',
          'TypeScript',
          'JavaScript',
          'Java',
          'Go',
          'C++',
          'SQL',
          'React',
          'Node.js',
          'Express',
          'FastAPI',
          'Docker',
          'PostgreSQL',
          'MongoDB',
          'Redis',
          'AWS',
          'Git',
        ],
        soft_skills: [
          'Technical Mentorship',
          'Cross-Functional Collaboration',
          'Agile Methodologies',
          'Written & Verbal Communication',
        ],
        education_details: [
          {
            degree: 'B.S. in Computer Science',
            institution: 'University of California, Berkeley',
            year: 'Expected May 2026',
            details: 'GPA: 3.84/4.00, Dean’s Honors List',
          },
        ],
        projects_experience: [
          {
            title: 'Software Engineering Intern',
            organization: 'CloudScale Labs',
            description: 'Asynchronous event-driven webhook pipeline and testing automation.',
            highlights: [
              'Processed 45,000+ daily webhooks with Redis Pub/Sub',
              '94% pytest code coverage',
              'Dockerized team onboarding workflows',
            ],
          },
          {
            title: 'AI CareerTrack Platform',
            organization: 'Independent Project',
            description: 'Career intelligence and interview coach using Gemini AI and React.',
            highlights: ['Structured JSON parsing', 'ATS diagnostics', 'Skill gap analysis'],
          },
        ],
        structure_evaluation: {
          formatting_score: 92,
          impact_score: 87,
          clarity_score: 90,
          ats_compatibility: 'High (Single column, standard header hierarchy, clean metric quantification)',
        },
        strengths: [
          'Strong metrics and quantification throughout (e.g., 45k+ webhooks, 94% coverage, <15ms latency).',
          'Diverse, modern tech stack balancing systems engineering (Go, C++) and web engineering (React, FastAPI).',
          'Excellent structural readability with clear sections for Education, Skills, Experience, and Projects.',
        ],
        weaknesses: [
          'Could highlight more cloud architectural components (e.g. Terraform, Kubernetes, IAM).',
          'Limited mention of system monitoring / observability tools like Prometheus or Datadog.',
        ],
        improvement_suggestions: [
          'Add a line mentioning Kubernetes or Infrastructure as Code (Terraform) in the CloudScale Labs experience.',
          'Specify performance benchmarks in the Distributed Chat project (e.g. throughput in requests/sec).',
          'Include a direct link to a hosted live demo for portfolio projects.',
        ],
        missing_keywords: [
          'Kubernetes (K8s)',
          'Terraform / IaC',
          'CI/CD Pipelines (GitHub Actions)',
          'System Design / High Availability',
          'Prometheus / Grafana',
        ],
      });
    }

    checkDeadlinesAndNotify(userId);

    return res.json({ message: 'Demo data loaded successfully with realistic applications and resume analysis.' });
  } catch (err) {
    console.error('Seed error:', err);
    return res.status(500).json({ error: 'Failed to seed demo data.' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    geminiConfigured: !!getAiClient(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ==========================================
// VITE DEV SERVER / STATIC ASSETS
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI CareerTrack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
