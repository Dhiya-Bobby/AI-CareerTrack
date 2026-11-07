import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { SkillGapAnalysis } from '../types';
import { api } from '../services/api';

const SAMPLE_JOB_DESCRIPTIONS = [
  {
    role: 'Python Backend Engineer',
    desc: `We are looking for a Python Backend Engineer to build high-performance microservices.
Requirements:
- 0-2 years experience with Python, FastAPI, Flask, or Django
- Solid knowledge of SQL (PostgreSQL), RESTful API design, and Redis caching
- Familiarity with Docker, Git version control, and CI/CD pipelines
- Understanding of distributed systems, message queues (Kafka/RabbitMQ) is a strong plus.`,
  },
  {
    role: 'Full Stack React & Node Developer',
    desc: `Join our team to develop modern web applications.
Requirements:
- Strong proficiency in React, TypeScript, HTML5, and Tailwind CSS
- Node.js backend development with Express or NestJS
- Experience with MongoDB or PostgreSQL databases
- State management, WebSockets, Jest/Vitest automated unit testing, and AWS deployment.`,
  },
  {
    role: 'Cloud & DevOps Engineer',
    desc: `Seeking an early career Cloud Platform Engineer.
Requirements:
- Strong Linux fundamentals and scripting (Bash / Python)
- AWS or GCP cloud services (EC2, S3, IAM, Cloud Run)
- Container orchestration with Docker and Kubernetes
- Infrastructure as Code (Terraform) and GitHub Actions automation.`,
  },
];

export const SkillGapView: React.FC = () => {
  const [targetRole, setTargetRole] = useState('Python Backend Engineer');
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_DESCRIPTIONS[0].desc);
  const [customSkillsInput, setCustomSkillsInput] = useState('');
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim() || !jobDescription.trim()) {
      setError('Please provide a target role and job description.');
      return;
    }

    setLoading(true);
    setError(null);

    const custom_skills = customSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await api.analyzeSkillGap({
        target_role: targetRole,
        job_description: jobDescription,
        custom_skills: custom_skills.length > 0 ? custom_skills : undefined,
      });
      setAnalysis(res.analysis);
    } catch (err: any) {
      setError(err.message || 'Skill gap analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySample = (sample: { role: string; desc: string }) => {
    setTargetRole(sample.role);
    setJobDescription(sample.desc);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          AI Skill Gap Diagnostics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Paste any job description to instantly map your resume skills, calculate match percentage, and receive a customized preparation roadmap.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Target Role & Job Description</h3>
          {/* Quick presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-slate-400 shrink-0">Sample presets:</span>
            {SAMPLE_JOB_DESCRIPTIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySample(preset)}
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                {preset.role.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Role Name
              </label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. SDE 1, Python Developer, Frontend Engineer"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Candidate Skills (Optional override)
              </label>
              <input
                type="text"
                value={customSkillsInput}
                onChange={(e) => setCustomSkillsInput(e.target.value)}
                placeholder="e.g. Python, SQL, Docker, Redis (leave empty to use your resume)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Job Description or Requirements
            </label>
            <textarea
              rows={4}
              required
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste full job description or key technical requirements..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
            />
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Comparing Skills with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Skill Gap Diagnostic</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {analysis && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                Compatibility Rating
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {analysis.target_role} Skill Match
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Comparative breakdown between role requirements and candidate verified technical proficiencies.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="text-center">
                <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {analysis.skill_match_percentage}%
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    analysis.skill_match_percentage >= 75
                      ? 'bg-emerald-100 text-emerald-800'
                      : analysis.skill_match_percentage >= 50
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {analysis.skill_match_percentage >= 75
                    ? 'Strong Match'
                    : analysis.skill_match_percentage >= 50
                    ? 'Moderate Alignment'
                    : 'Prerequisite Gaps'}
                </span>
              </div>
            </div>
          </div>

          {/* Three Categorized Skill Columns: Matching, Partially Matching, Missing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Matching */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-semibold text-slate-900">
                  Matching Skills ({analysis.matching_skills.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matching_skills.length === 0 ? (
                  <p className="text-xs text-slate-400">None identified</p>
                ) : (
                  analysis.matching_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md"
                    >
                      ✓ {skill}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Partially Matching */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-semibold text-slate-900">
                  Partially Matching ({analysis.partially_matching_skills.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.partially_matching_skills.length === 0 ? (
                  <p className="text-xs text-slate-400">None identified</p>
                ) : (
                  analysis.partially_matching_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-md"
                    >
                      ~ {skill}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-semibold text-slate-900">
                  Missing Skills ({analysis.missing_skills.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missing_skills.length === 0 ? (
                  <p className="text-xs text-slate-400">None missing</p>
                ) : (
                  analysis.missing_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200 rounded-md"
                    >
                      ✕ {skill}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recommended Learning Topics */}
          {analysis.recommended_learning_topics && analysis.recommended_learning_topics.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Recommended Learning Curriculum
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.recommended_learning_topics.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900">{item.topic}</h5>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {item.estimated_time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                        Curated Resources:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.resources.map((res, ri) => (
                          <span
                            key={ri}
                            className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700"
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Preparation Roadmap */}
          {analysis.suggested_preparation_roadmap &&
            analysis.suggested_preparation_roadmap.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    4-Phase Preparation Roadmap
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analysis.suggested_preparation_roadmap.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                          Phase 0{idx + 1}
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 mt-1">{step.step}</h5>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {step.timeframe}
                        </p>

                        <ul className="mt-3 space-y-1 text-xs text-slate-600">
                          {step.focus_areas.map((fa, fi) => (
                            <li key={fi} className="flex items-start gap-1.5">
                              <span className="text-blue-500 font-bold">·</span>
                              <span>{fa}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
