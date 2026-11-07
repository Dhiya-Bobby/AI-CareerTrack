import React, { useState, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
  Target,
  ShieldCheck,
  Cpu,
  Database,
  Code2,
  Wrench,
  TrendingUp,
  FileCheck,
  Check,
  XCircle,
} from 'lucide-react';
import { ResumeData, ResumeAnalysis } from '../types';
import { api } from '../services/api';

const TARGET_ROLE_OPTIONS = [
  'Full Stack Software Engineer',
  'Backend Engineer (Python / Node / Go)',
  'Frontend Engineer (React / TypeScript)',
  'DevOps & Cloud Infrastructure Engineer',
  'Data Engineer & AI / ML Specialist',
  'Mobile Application Developer',
  'Software Development Engineer in Test (SDET)',
  'Product Software Engineer',
];

export const ResumeAnalyzerView: React.FC = () => {
  const [currentResume, setCurrentResume] = useState<ResumeData | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(TARGET_ROLE_OPTIONS[0]);

  // Input mode toggle
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchResumeData = async () => {
    try {
      setLoading(true);
      const res = await api.getResume();
      setCurrentResume(res.resume);
      setCurrentAnalysis(res.analysis);
      if (res.analysis?.job_role_matching?.target_role) {
        setSelectedRole(res.analysis.job_role_matching.target_role);
      }
      setError(null);
    } catch (err: any) {
      console.error('Failed to load resume data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeData();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);
      await api.uploadResumeFile(selectedFile);
      setSelectedFile(null);
      await fetchResumeData();
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume file.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await api.uploadResumeText(pastedText.trim(), 'candidate_resume.txt');
      setPastedText('');
      await fetchResumeData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit resume text.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const res = await api.analyzeResume({
        resume_id: currentResume?.id,
        target_role: selectedRole,
      });
      setCurrentAnalysis(res.analysis);
    } catch (err: any) {
      // Preserve currentResume so the user never loses their uploaded file!
      setError(
        err.message ||
          'Analysis is currently unavailable due to high model demand. Your resume is safely preserved; please click "Retry Analysis" below to retry.'
      );
    } finally {
      // Guaranteed stop of loading animation and re-enabling of controls
      setAnalyzing(false);
    }
  };

  // Helper safe extractions for categorized skills
  const categorized = currentAnalysis?.categorized_skills || {
    languages: [],
    frameworks: [],
    databases: [],
    tools_and_cloud: [],
    soft_skills: currentAnalysis?.soft_skills || [],
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>AI Resume & ATS Analyzer</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Gemini Powered
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate your resume against top tech company applicant tracking systems with deep skill extraction and role matching.
          </p>
        </div>

        {currentResume && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRunAiAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing ATS Diagnostic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentAnalysis ? 'Re-Analyze Resume with AI' : 'Start AI Analysis'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Target Role & Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <label htmlFor="target-role-select" className="text-xs font-semibold text-slate-800 block">
              Benchmark Target Job Role
            </label>
            <p className="text-[11px] text-slate-500">
              Evaluates keyword density and skill coverage tailored to this engineering specialization
            </p>
          </div>
        </div>

        <div className="w-full md:w-72">
          <select
            id="target-role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={analyzing}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            {TARGET_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error / High Demand Alert Banner with Retry Button */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">ATS Analysis Notice</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">{error}</p>
              {currentResume && (
                <p className="mt-1 text-[11px] text-amber-700 font-medium">
                  ✓ Your resume <span className="font-semibold">"{currentResume.filename}"</span> remains safely preserved in your workspace.
                </p>
              )}
            </div>
          </div>
          {currentResume && (
            <button
              onClick={handleRunAiAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>Retry Analysis</span>
            </button>
          )}
        </div>
      )}

      {/* Upload & Document Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload / Paste Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Resume Document</span>
              </h3>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    inputMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    inputMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {inputMode === 'upload' ? (
              <form onSubmit={handleFileUpload} className="space-y-3">
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
                  <Upload className="w-7 h-7 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Select PDF or DOCX file'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Plaintext extraction + Gemini ATS parsing
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!selectedFile || loading}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  {loading ? 'Uploading & Parsing...' : 'Save Resume Document'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasteSubmit} className="space-y-3">
                <textarea
                  rows={5}
                  required
                  placeholder="Paste your resume markdown, education, work experience, projects, and skills here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
                <button
                  type="submit"
                  disabled={!pastedText.trim() || loading}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Resume Text'}
                </button>
              </form>
            )}
          </div>

          {currentResume && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                  {currentResume.filename}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {new Date(currentResume.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>{(currentResume.raw_text?.length || 0).toLocaleString()} characters extracted</span>
                <span className="text-emerald-600 font-medium">Ready</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Section A - ATS Score & Metric Gauge */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          {!currentAnalysis ? (
            <div className="py-12 text-center my-auto">
              <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">
                Ready for AI Diagnostic & ATS Scoring
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {currentResume
                  ? `Your resume is ready. Click "Start AI Analysis" to benchmark against ${selectedRole}.`
                  : 'Upload your resume or paste its text on the left to unlock comprehensive ATS scoring, skill categorization, and role matching.'}
              </p>
              {currentResume && (
                <button
                  onClick={handleRunAiAnalysis}
                  disabled={analyzing}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing ATS Diagnostic...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start AI Analysis</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Section A: ATS Score & Diagnostics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      Section A · ATS Readiness Diagnostic
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                      Target: {currentAnalysis.job_role_matching?.target_role || selectedRole}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    ATS Score & Executive Summary
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {currentAnalysis.score_explanation || currentAnalysis.summary}
                  </p>
                </div>

                <div className="text-center sm:text-right shrink-0 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 min-w-[130px]">
                  <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                    {currentAnalysis.overall_score}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 mt-1 rounded ${
                      currentAnalysis.overall_score >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentAnalysis.overall_score >= 65
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentAnalysis.overall_score >= 80
                      ? 'High Tier (Placement Ready)'
                      : currentAnalysis.overall_score >= 65
                      ? 'Solid Foundations'
                      : 'Needs Optimization'}
                  </span>
                </div>
              </div>

              {/* Sub Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    Formatting & Layout
                  </span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {currentAnalysis.structure_evaluation?.formatting_score || 85}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    Impact & Metrics
                  </span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {currentAnalysis.structure_evaluation?.impact_score || 80}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    Clarity & Grammar
                  </span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {currentAnalysis.structure_evaluation?.clarity_score || 88}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    ATS Compatibility
                  </span>
                  <div className="text-xs font-semibold text-emerald-700 mt-1 truncate">
                    {currentAnalysis.structure_evaluation?.ats_compatibility || 'Compatible'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* When analysis exists, render Sections B, C, D, E */}
      {currentAnalysis && (
        <div className="space-y-6">
          {/* Section D: Job Role Matching */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Section D · Job Role Matching ({currentAnalysis.job_role_matching?.target_role || selectedRole})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Match Compatibility:</span>
                <span className="text-sm font-mono font-bold text-blue-600">
                  {currentAnalysis.job_role_matching?.match_percentage || 75}%
                </span>
              </div>
            </div>

            <div className="mt-3">
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(5, currentAnalysis.job_role_matching?.match_percentage || 75))}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matching Skills */}
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Matching Skills in Resume ({currentAnalysis.job_role_matching?.matching_skills?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAnalysis.job_role_matching?.matching_skills?.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs font-mono font-medium bg-white text-emerald-800 rounded border border-emerald-200"
                      >
                        ✓ {skill}
                      </span>
                    )) || <span className="text-xs text-slate-400">None extracted</span>}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing Skills for Target Role ({currentAnalysis.job_role_matching?.missing_skills?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAnalysis.job_role_matching?.missing_skills?.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs font-mono font-medium bg-white text-amber-900 rounded border border-amber-200"
                      >
                        + {skill}
                      </span>
                    )) || <span className="text-xs text-slate-400">None identified</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Categorized Skill Extraction */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Award className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Section B · Categorized Skill Extraction
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Programming Languages */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-800">
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Programming Languages ({categorized.languages?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categorized.languages && categorized.languages.length > 0 ? (
                    categorized.languages.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs font-mono bg-white text-slate-800 rounded border border-slate-200">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No languages detected</span>
                  )}
                </div>
              </div>

              {/* Frameworks & Libraries */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-800">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Frameworks & Libraries ({categorized.frameworks?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categorized.frameworks && categorized.frameworks.length > 0 ? (
                    categorized.frameworks.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs font-mono bg-white text-slate-800 rounded border border-slate-200">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No frameworks detected</span>
                  )}
                </div>
              </div>

              {/* Databases & Storage */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-800">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Databases & Storage ({categorized.databases?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categorized.databases && categorized.databases.length > 0 ? (
                    categorized.databases.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs font-mono bg-white text-slate-800 rounded border border-slate-200">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No databases detected</span>
                  )}
                </div>
              </div>

              {/* Tools & Cloud Infrastructure */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-800">
                  <Wrench className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Tools & Cloud Tech ({categorized.tools_and_cloud?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categorized.tools_and_cloud && categorized.tools_and_cloud.length > 0 ? (
                    categorized.tools_and_cloud.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs font-mono bg-white text-slate-800 rounded border border-slate-200">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No tools detected</span>
                  )}
                </div>
              </div>

              {/* Soft Skills & Leadership */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 md:col-span-2">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-800">
                  <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                  <span>Soft Skills & Professional Leadership ({categorized.soft_skills?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categorized.soft_skills && categorized.soft_skills.length > 0 ? (
                    categorized.soft_skills.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-purple-50 text-purple-800 rounded border border-purple-200 font-medium">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No soft skills detected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Resume Evaluation (Strengths, Weaknesses, Keywords, Formatting & Content) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Section C · Resume Strengths, Weaknesses & Structural Diagnostic
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resume Strengths</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {currentAnalysis.strengths?.map((str, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 bg-emerald-50/40 rounded-lg border border-emerald-100/60">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Weaknesses & Optimization Gaps</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {currentAnalysis.weaknesses?.map((weak, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 bg-rose-50/40 rounded-lg border border-rose-100/60">
                      <span className="text-rose-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-semibold text-slate-900">
                  Missing High-Impact ATS Keywords
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentAnalysis.missing_keywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs font-mono text-amber-900 bg-amber-50 border border-amber-200 rounded"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Formatting & Content Improvement Suggestions */}
            {(currentAnalysis.structure_evaluation?.formatting_suggestions ||
              currentAnalysis.structure_evaluation?.content_improvements) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                {currentAnalysis.structure_evaluation.formatting_suggestions && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <h5 className="text-xs font-semibold text-slate-800 mb-2">
                      Formatting Suggestions
                    </h5>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {currentAnalysis.structure_evaluation.formatting_suggestions.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-500">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentAnalysis.structure_evaluation.content_improvements && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <h5 className="text-xs font-semibold text-slate-800 mb-2">
                      Content & Bullet Improvements
                    </h5>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {currentAnalysis.structure_evaluation.content_improvements.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-500">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section E: Improvement Recommendations */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Section E · Targeted Improvement Recommendations
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Actionable Improvements */}
              <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100">
                <h4 className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>Actionable Improvements</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {(
                    currentAnalysis.improvement_recommendations?.actionable_improvements ||
                    currentAnalysis.improvement_suggestions ||
                    []
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Skills */}
              <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-100">
                <h4 className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  <span>Recommended Skills to Master</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    currentAnalysis.improvement_recommendations?.recommended_skills ||
                    currentAnalysis.missing_keywords ||
                    []
                  ).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs font-mono font-medium bg-white text-purple-800 rounded border border-purple-200"
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* ATS Compatibility Tips */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ATS Compatibility Tips</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {(
                    currentAnalysis.improvement_recommendations?.ats_compatibility_tips || [
                      'Avoid multi-column tables and non-standard symbols in work history',
                      'Stick to standard headers: Education, Experience, Skills, Projects',
                      'Quantify metrics with %, $, or latency reductions',
                    ]
                  ).map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Extracted Experience & Projects */}
          {currentAnalysis.projects_experience && currentAnalysis.projects_experience.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Extracted Experience & Project Highlights ({currentAnalysis.projects_experience.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentAnalysis.projects_experience.map((proj, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                    {proj.organization && (
                      <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                        {proj.organization}
                      </p>
                    )}
                    {proj.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                    {proj.highlights && proj.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                        {proj.highlights.map((h, hi) => (
                          <li key={hi} className="flex items-start gap-1.5">
                            <span className="text-slate-400">·</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
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
