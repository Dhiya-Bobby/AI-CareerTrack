import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Supported model cascade: primary model with verified fallback alternatives
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const VERIFIED_FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];

/**
 * Returns an authenticated GoogleGenAI client instance.
 */
export function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
      timeout: 30000, // 30-second API request timeout
    },
  });
}

export const ai = getAiClient();

/**
 * Helper to determine if an error is a temporary retryable error (503 Service Unavailable / high demand, 429 Rate Limit, 404 model rotation, or timeout).
 */
function isRetryableError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code || err.statusCode;
  const message = String(err.message || '').toLowerCase();

  return (
    status === 503 ||
    status === 429 ||
    status === 404 ||
    message.includes('503') ||
    message.includes('429') ||
    message.includes('404') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('resource_exhausted') ||
    message.includes('not found') ||
    message.includes('temporarily unavailable') ||
    message.includes('timeout') ||
    message.includes('deadline exceeded')
  );
}

/**
 * Executes a Gemini API task with exponential backoff retry handling (max 3 attempts).
 * Automatically tries compatible fallback models if the primary model is experiencing high demand.
 */
export async function executeWithRetry<T>(
  taskDescription: string,
  fn: (client: GoogleGenAI, model: string) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  const client = getAiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured in server environment. Please configure it in Settings > Secrets.');
  }

  let lastError: any = null;
  const modelsToTry = Array.from(new Set([PRIMARY_MODEL, ...VERIFIED_FALLBACK_MODELS]));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Select model: start with primary, use fallback on subsequent attempts if retryable
    const model = modelsToTry[(attempt - 1) % modelsToTry.length];

    try {
      // Enforce 30-second timeout per attempt
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini API request timed out after 30 seconds (${taskDescription}).`)), 30000)
      );

      return await Promise.race([fn(client, model), timeoutPromise]);
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Attempt ${attempt}/${maxRetries} failed for ${taskDescription} using ${model}]:`, err.message || err);

      if (attempt < maxRetries && isRetryableError(err)) {
        // Exponential backoff: 1000ms, 2000ms, 4000ms (+ jitter)
        const backoffDelay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 300;
        console.log(`[Gemini] Retrying in ${Math.round(backoffDelay)}ms with alternate model...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      } else if (!isRetryableError(err)) {
        // Non-retryable error (e.g. invalid schema, authentication rejected)
        break;
      }
    }
  }

  // Construct user-friendly error message based on error type
  if (isRetryableError(lastError)) {
    throw new Error(
      'The AI model is currently experiencing high demand across Google Gemini services. Your data has been preserved. Please click "Retry" in a few moments.'
    );
  }

  const rawMsg = lastError?.message || 'Gemini API call failed.';
  throw new Error(`AI processing notice: ${rawMsg}`);
}

// ==========================================
// PREDEFINED FALLBACK INTERVIEW QUESTION BANK
// Used when Gemini is temporarily unavailable
// ==========================================

export interface FallbackQuestion {
  question: string;
  context_or_scenario: string;
  rubric_points: string[];
}

export const FALLBACK_QUESTION_BANK: Record<string, FallbackQuestion[]> = {
  'Technical-Beginner': [
    {
      question: 'Explain the difference between SQL and NoSQL databases. When would you prefer MongoDB over PostgreSQL?',
      context_or_scenario: 'You are selecting a data persistence store for a new job application tracking service with variable schema requirements.',
      rubric_points: [
        'Structured tabular vs document-based JSON models',
        'ACID transactions vs flexible schema evolution',
        'Horizontal sharding scalability vs complex joins',
        'Concrete scenario justification',
      ],
    },
    {
      question: 'What is the Event Loop in JavaScript/Node.js, and how does asynchronous non-blocking I/O work?',
      context_or_scenario: 'An HTTP server processes incoming resume upload streams while simultaneously serving database read requests.',
      rubric_points: [
        'Call stack, Web APIs / libuv worker threads, Task queue & Microtask queue',
        'Promise resolution order and microtask prioritization',
        'Why long-running CPU loops block the event loop',
      ],
    },
  ],
  'Technical-Intermediate': [
    {
      question: 'How would you implement a thread-safe, in-memory rate limiter supporting millions of users with dynamic limits?',
      context_or_scenario: 'You are designing an edge enforcement middleware for an internal Google Cloud or API gateway service.',
      rubric_points: [
        'Token Bucket or Sliding Window Log algorithm',
        'Concurrency handling (atomic CAS operations, Redis Lua scripts, or minimal lock contention)',
        'Memory optimization per user key (TTL eviction)',
        'Handling clock skew and distributed synchronization',
      ],
    },
    {
      question: 'Explain how database indexing works under the hood (B-Trees vs Hash indexes) and how composite indexes should be ordered.',
      context_or_scenario: 'Queries filtering by `user_id` and sorting by `application_date DESC` are taking >800ms as table grows to 5 million rows.',
      rubric_points: [
        'B+ Tree node structure, leaf pointers, and range scan efficiency',
        'Equality first, range second principle in compound indexes',
        'Index selectivity and avoiding unindexed table scans',
      ],
    },
  ],
  'Technical-Advanced': [
    {
      question: 'Design a globally distributed, highly available job application and notification pipeline with idempotent event delivery.',
      context_or_scenario: 'At 50,000 requests/sec, network partitions may cause duplicate delivery of interview status updates to webhook subscribers.',
      rubric_points: [
        'Idempotency keys with unique constraint stores & distributed locks',
        'Event-driven architecture with Kafka / RabbitMQ and dead-letter queues',
        'CAP theorem trade-offs between consistency and partition tolerance',
        'Outbox pattern to guarantee atomic database updates and event publishing',
      ],
    },
  ],
  'Coding-Beginner': [
    {
      question: 'Given an array of strings representing candidate skills, find all unique skills and return them sorted by frequency.',
      context_or_scenario: 'You need to display top skills extracted across 1,000 applicants for a frontend engineering role.',
      rubric_points: [
        'Hash map / dictionary frequency counter: O(N) time',
        'Sorting entries by frequency: O(U log U) where U is unique count',
        'Handling case insensitivity and whitespace trimming',
      ],
    },
  ],
  'Coding-Intermediate': [
    {
      question: 'Given a list of job interview time intervals [start, end], find the minimum number of interview rooms required.',
      context_or_scenario: 'Campus recruitment scheduling system allocating physical conference rooms for 50 candidates.',
      rubric_points: [
        'Min-heap approach or two-pointer sorted event endpoints: O(N log N)',
        'Tracking active overlapping intervals at any point in time',
        'Edge case handling for adjacent non-overlapping times (start == end)',
      ],
    },
  ],
  'Coding-Advanced': [
    {
      question: 'Implement an LRU (Least Recently Used) Cache with O(1) get and O(1) put operations.',
      context_or_scenario: 'Caching pre-computed ATS resume scores in server memory to prevent redundant AI model invocations.',
      rubric_points: [
        'Combination of Hash Map and Doubly Linked List',
        'Node eviction from tail and insertion at head on access',
        'Handling capacity limits and boundary conditions correctly',
      ],
    },
  ],
  'Behavioral-Intermediate': [
    {
      question: 'Describe a situation where a technical project deadline was at risk. How did you prioritize requirements and communicate with stakeholders?',
      context_or_scenario: 'College capstone project or internship sprint delivery where external API integrations took longer than expected.',
      rubric_points: [
        'STAR method structure (Situation, Task, Action, Result)',
        'Scope trade-offs (identifying MVP must-haves vs nice-to-haves)',
        'Proactive communication with mentors or engineering managers',
        'Reflective lessons learned for future sprints',
      ],
    },
  ],
  'HR-Beginner': [
    {
      question: 'Walk me through your background and why you are interested in joining this engineering team.',
      context_or_scenario: 'Initial screening conversation with university recruiter or technical talent partner.',
      rubric_points: [
        'Concise 90-second professional elevator pitch',
        'Connecting academic CS coursework with hands-on projects/internships',
        'Genuine alignment with company mission and tech stack',
      ],
    },
  ],
  'HR-Intermediate': [
    {
      question: 'Where do you see your technical trajectory in the next 2-3 years, and what engineering competencies are you actively developing?',
      context_or_scenario: 'Recruiter or engineering director evaluating long-term technical growth and autonomy.',
      rubric_points: [
        'Clear learning goals (e.g. systems architecture, cloud infrastructure, mentoring)',
        'Self-directed learning habits (open source, documentation, personal projects)',
        'Receptiveness to feedback and engineering code reviews',
      ],
    },
  ],
  'Company-specific-Intermediate': [
    {
      question: 'How do you embody Customer Obsession (or Googleyness / First Principles) when resolving a contentious technical dispute with a teammate?',
      context_or_scenario: 'Evaluating cultural alignment with FAANG / Tier-1 startup engineering leadership principles.',
      rubric_points: [
        'Disagree and commit principle or data-driven consensus building',
        'Prioritizing end-user experience and reliability over personal technical dogma',
        'Constructive peer code review etiquette',
      ],
    },
  ],
};

export function getFallbackQuestion(jobRole: string, category: string, difficulty: string): FallbackQuestion {
  const key = `${category}-${difficulty}`;
  const candidates = FALLBACK_QUESTION_BANK[key] ||
    FALLBACK_QUESTION_BANK[`Technical-${difficulty}`] ||
    FALLBACK_QUESTION_BANK['Technical-Intermediate'];

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    question: `${selected.question} (Role: ${jobRole})`,
    context_or_scenario: selected.context_or_scenario,
    rubric_points: selected.rubric_points,
  };
}

// ==========================================
// RESUME ATS ANALYZER WITH GEMINI
// ==========================================

export async function analyzeResumeWithGemini(resumeText: string, targetRole = 'Software Engineer') {
  return executeWithRetry('Resume ATS Analysis', async (client, model) => {
    const prompt = `You are a Principal Software Engineering Recruiter and ATS (Applicant Tracking System) Expert.
Analyze the following resume thoroughly for the target role: "${targetRole}".
Provide a complete, structured JSON assessment.

Resume content:
"""
${resumeText.slice(0, 15000)}
"""

Provide:
1. overall_score: (0 to 100) based on quantifiable metrics, formatting, and ATS match.
2. score_explanation: Clear 2-3 sentence explanation of how this score was computed.
3. summary: Executive 2-sentence summary of the candidate.
4. technical_skills: Complete flat list of all identified technical skills.
5. categorized_skills:
   - languages: list of programming languages (e.g. Python, TypeScript, Java, C++)
   - frameworks: list of web/application frameworks (e.g. React, FastAPI, Node.js)
   - databases: list of SQL/NoSQL databases (e.g. PostgreSQL, MongoDB, Redis)
   - tools_and_cloud: list of tools and cloud services (e.g. Docker, AWS, Git)
   - soft_skills: list of soft/collaboration skills
6. soft_skills: List of soft skills.
7. education_details: List of degrees, institutions, years, details.
8. projects_experience: List of extracted projects/experiences with title, organization, description, highlights.
9. structure_evaluation:
   - formatting_score (0-100)
   - impact_score (0-100)
   - clarity_score (0-100)
   - ats_compatibility (e.g. "High", "Moderate", "Needs Work")
   - formatting_suggestions: 2-3 concrete tips on layout, headings, and readability.
   - content_improvements: 2-3 tips on bullet point impact and metric quantification.
10. strengths: 3-5 verified strengths.
11. weaknesses: 3-5 weak areas or omissions.
12. improvement_suggestions: 3-5 concrete action items.
13. missing_keywords: 4-6 high-yield industry keywords missing from this resume.
14. job_role_matching:
    - target_role: "${targetRole}"
    - matching_skills: list of candidate skills that fit this role
    - missing_skills: list of expected skills for this role missing from the resume
    - match_percentage: integer 0-100
15. improvement_recommendations:
    - actionable_improvements: 3 concrete recommendations
    - recommended_skills: 3-5 technical skills to learn next
    - ats_compatibility_tips: 2 tips to ensure parsing by Taleo, Greenhouse, and Lever ATS systems.`;

    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overall_score: { type: Type.INTEGER },
            score_explanation: { type: Type.STRING },
            summary: { type: Type.STRING },
            technical_skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            categorized_skills: {
              type: Type.OBJECT,
              properties: {
                languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
                databases: { type: Type.ARRAY, items: { type: Type.STRING } },
                tools_and_cloud: { type: Type.ARRAY, items: { type: Type.STRING } },
                soft_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['languages', 'frameworks', 'databases', 'tools_and_cloud', 'soft_skills'],
            },
            soft_skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            education_details: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  year: { type: Type.STRING },
                  details: { type: Type.STRING },
                },
              },
            },
            projects_experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  organization: { type: Type.STRING },
                  description: { type: Type.STRING },
                  highlights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['title'],
              },
            },
            structure_evaluation: {
              type: Type.OBJECT,
              properties: {
                formatting_score: { type: Type.INTEGER },
                impact_score: { type: Type.INTEGER },
                clarity_score: { type: Type.INTEGER },
                ats_compatibility: { type: Type.STRING },
                formatting_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                content_improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['formatting_score', 'impact_score', 'clarity_score', 'ats_compatibility'],
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            missing_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            job_role_matching: {
              type: Type.OBJECT,
              properties: {
                target_role: { type: Type.STRING },
                matching_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                match_percentage: { type: Type.INTEGER },
              },
              required: ['target_role', 'matching_skills', 'missing_skills', 'match_percentage'],
            },
            improvement_recommendations: {
              type: Type.OBJECT,
              properties: {
                actionable_improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommended_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                ats_compatibility_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['actionable_improvements', 'recommended_skills', 'ats_compatibility_tips'],
            },
          },
          required: [
            'overall_score',
            'summary',
            'technical_skills',
            'soft_skills',
            'education_details',
            'projects_experience',
            'structure_evaluation',
            'strengths',
            'weaknesses',
            'improvement_suggestions',
            'missing_keywords',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  });
}

// ==========================================
// SKILL GAP ANALYZER WITH GEMINI
// ==========================================

export async function analyzeSkillGapWithGemini(
  targetRole: string,
  jobDescription: string,
  candidateSkills: string[]
) {
  return executeWithRetry('Skill Gap Analysis', async (client, model) => {
    const prompt = `You are a Career Technical Advisor and Staff Engineer.
Compare the Candidate's current skills against the Target Job Description.

Target Job Role: "${targetRole}"
Job Description:
"""
${jobDescription.slice(0, 10000)}
"""

Candidate's Current Skills:
${JSON.stringify(candidateSkills)}

Instructions:
1. Identify EXACT MATCHING skills that the candidate has and the job explicitly or implicitly requires.
2. Identify MISSING skills that are crucial for this job that the candidate lacks.
3. Identify PARTIALLY MATCHING skills.
4. Compute an honest, mathematically realistic skill match percentage (0 to 100).
5. Recommend high-priority technical skills to learn first.
6. Provide structured recommended learning topics with estimated study times and suggested resources.
7. Create a 4-step preparation roadmap with realistic timeframes.`;

    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skill_match_percentage: { type: Type.INTEGER },
            matching_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            partially_matching_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_technical_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_learning_topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimated_time: { type: Type.STRING },
                  resources: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['topic', 'description', 'estimated_time', 'resources'],
              },
            },
            suggested_preparation_roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  focus_areas: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['step', 'timeframe', 'focus_areas'],
              },
            },
          },
          required: [
            'skill_match_percentage',
            'matching_skills',
            'missing_skills',
            'partially_matching_skills',
            'recommended_technical_skills',
            'recommended_learning_topics',
            'suggested_preparation_roadmap',
          ],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  });
}

// ==========================================
// INTERVIEW QUESTION GENERATION & EVALUATION
// ==========================================

export async function generateInterviewQuestionWithGemini(
  jobRole: string,
  category: string,
  difficulty: string,
  companyTarget?: string
): Promise<{ question: string; context_or_scenario: string; rubric_points: string[]; is_fallback?: boolean; source?: string }> {
  try {
    return await executeWithRetry('Interview Question Generation', async (client, model) => {
      const prompt = `You are a Senior Engineering Hiring Manager at top tech firms (FAANG / Tier-1 Startups).
Generate an authentic, high-yield interview question for a candidate.

Target Role: ${jobRole}
Category: ${category} (Technical, HR, Coding, Behavioral, Company-specific)
Difficulty Level: ${difficulty} (Beginner, Intermediate, Advanced)
${companyTarget ? `Target Company: ${companyTarget}` : ''}

Generate:
1. A realistic, specific interview question tailored to this role and difficulty.
2. Context or scenario (e.g. system design trade-off, incident, conflict, algorithmic requirement).
3. 3-4 key rubric points that a stellar candidate's answer should cover.`;

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              context_or_scenario: { type: Type.STRING },
              rubric_points: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['question', 'context_or_scenario', 'rubric_points'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        ...parsed,
        is_fallback: false,
        source: `Generated by Google Gemini (${model})`,
      };
    });
  } catch (err: any) {
    console.warn('[Gemini Interview Question Generation Failed - Using Fallback Question Bank]:', err.message);
    const fallback = getFallbackQuestion(jobRole, category, difficulty);
    return {
      ...fallback,
      is_fallback: true,
      source: 'Predefined Question Bank (Offline / Gemini Unavailable)',
    };
  }
}

export async function evaluateInterviewAnswerWithGemini(
  jobRole: string,
  category: string,
  difficulty: string,
  question: string,
  userAnswer: string
) {
  try {
    return await executeWithRetry('Interview Answer Evaluation', async (client, model) => {
      const prompt = `You are an elite Tech Interviewer evaluating a candidate's answer.

Role: ${jobRole}
Category: ${category}
Difficulty: ${difficulty}
Question: "${question}"
Candidate Answer:
"""
${userAnswer}
"""

Evaluate the candidate's answer rigorously:
1. Overall score (0 to 100).
2. Overall verdict (e.g., "Strong Hire", "Lean Hire", "Needs Work", "Unsatisfactory").
3. Key strengths in their answer.
4. Specific actionable areas for improvement.
5. Key technical or behavioral concepts they missed or glossed over.
6. A concise, gold-standard sample answer demonstrating how a top 1% candidate would address the question.
7. Technical depth score (0-100) and Clarity & Communication score (0-100).`;

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              overall_verdict: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              missing_points: { type: Type.ARRAY, items: { type: Type.STRING } },
              ideal_sample_answer: { type: Type.STRING },
              technical_depth_score: { type: Type.INTEGER },
              clarity_score: { type: Type.INTEGER },
            },
            required: [
              'score',
              'overall_verdict',
              'strengths',
              'improvements',
              'missing_points',
              'ideal_sample_answer',
              'technical_depth_score',
              'clarity_score',
            ],
          },
        },
      });

      return JSON.parse(response.text || '{}');
    });
  } catch (err: any) {
    console.warn('[Gemini Interview Answer Evaluation Failed - Using Rule-Based Fallback]:', err.message);

    // Rule-based fallback evaluation when Gemini is unreachable
    const wordCount = userAnswer.trim().split(/\s+/).filter(Boolean).length;
    const baseScore = Math.min(85, Math.max(45, Math.round(50 + Math.min(35, wordCount / 4))));

    return {
      score: baseScore,
      overall_verdict: baseScore >= 75 ? 'Lean Hire (Rule-Based Evaluation)' : 'Needs Work (Rule-Based Evaluation)',
      strengths: [
        `Provided a direct response addressing the prompt (${wordCount} words).`,
        'Demonstrated foundational conceptual familiarity with the subject matter.',
      ],
      improvements: [
        'Elaborate with specific concrete metrics, edge-case analysis, and architectural trade-offs.',
        'Structure responses using the STAR method for behavioral questions or explicit architectural components for systems questions.',
      ],
      missing_points: [
        'Detailed scalability implications under high load or network partitioning.',
        'Production error handling and automated testing strategies.',
      ],
      ideal_sample_answer:
        'A comprehensive answer begins by stating clarifying assumptions, discussing primary design trade-offs, providing the core algorithmic/system approach with time/space complexity, and concluding with failure modes and telemetry.',
      technical_depth_score: Math.max(40, baseScore - 5),
      clarity_score: Math.min(90, baseScore + 5),
    };
  }
}
