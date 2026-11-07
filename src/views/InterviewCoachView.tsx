import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  History,
  Send,
  RefreshCw,
  Mic,
  MicOff,
  ChevronRight,
  Code2,
  UserCheck,
  Building,
  Target,
  RotateCcw,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { InterviewSession } from '../types';
import { api } from '../services/api';

const CATEGORIES = [
  'Technical',
  'HR',
  'Coding',
  'Behavioral',
  'Company-specific',
] as const;

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const InterviewCoachView: React.FC = () => {
  const [jobRole, setJobRole] = useState('Software Engineer (Early Career)');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Technical');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('Intermediate');
  const [companyTarget, setCompanyTarget] = useState('');

  // Active session
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.getInterviewHistory();
      setHistory(res.sessions || []);
    } catch (e) {
      console.error('Failed to load interview history:', e);
    }
  };

  const handleGenerateQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!jobRole.trim()) {
      setError('Please provide a target job role.');
      return;
    }

    setGenerating(true);
    setError(null);
    setUserAnswer('');

    try {
      const res = await api.generateInterviewQuestion({
        job_role: jobRole.trim(),
        category,
        difficulty,
        company_target: companyTarget.trim() || undefined,
      });

      if (!res || !res.session) {
        throw new Error('Server returned an empty interview session.');
      }

      setActiveSession(res.session);
    } catch (err: any) {
      console.error('Error generating interview question:', err);
      const userMessage =
        err.message ||
        'Unable to synthesize question with Gemini at this time. Please check your network or try again.';
      setError(userMessage);
    } finally {
      // Always stop the loading animation and re-enable button
      setGenerating(false);
    }
  };

  const handleEvaluateAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !userAnswer.trim()) {
      setError('Please provide your answer before submitting.');
      return;
    }

    setEvaluating(true);
    setError(null);

    try {
      const res = await api.evaluateInterviewAnswer({
        session_id: activeSession._id,
        user_answer: userAnswer.trim(),
      });
      setActiveSession(res.session);
      await fetchHistory();
    } catch (err: any) {
      console.error('Error evaluating interview answer:', err);
      setError(err.message || 'Failed to evaluate your answer. Please retry.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleResetForNewQuestion = () => {
    setActiveSession(null);
    setUserAnswer('');
    setError(null);
  };

  // Web Speech recognition toggle
  const toggleRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setUserAnswer((prev) => (prev ? prev + ' ' + currentTranscript : currentTranscript));
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            AI Interactive Interview Coach
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate real technical, behavioral, and system design interviews powered by Google Gemini AI.
          </p>
        </div>

        {activeSession && (
          <button
            onClick={handleResetForNewQuestion}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Configure New Question</span>
          </button>
        )}
      </div>

      {/* Setup Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Interview Parameters</h3>
          <span className="text-[11px] text-slate-400">30s timeout · 3-attempt backoff</span>
        </div>

        <form onSubmit={handleGenerateQuestion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Job Role
              </label>
              <input
                type="text"
                required
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Backend SDE 1, Frontend React"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interview Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c} Interview
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Company (Optional)
              </label>
              <input
                type="text"
                value={companyTarget}
                onChange={(e) => setCompanyTarget(e.target.value)}
                placeholder="e.g. Google, Amazon, Stripe"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              {generating ? 'Connecting to Gemini model cascade with exponential backoff...' : ''}
            </span>

            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Question with Gemini...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Generate Interview Question</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Question Generation Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => handleGenerateQuestion()}
            disabled={generating}
            className="shrink-0 px-3 py-1 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* Active Question & Answer Arena */}
      {activeSession && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            {/* Fallback Question Bank Banner if Gemini was offline */}
            {activeSession.is_fallback ? (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Predefined Fallback Question Bank:</span>{' '}
                  Gemini API is temporarily experiencing high load. This verified interview question was loaded from the curated offline question bank based on your role and difficulty settings.
                </div>
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-medium">
                  {activeSession.source || 'Generated by Google Gemini'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
              <span>{activeSession.job_role}</span>
              <span>·</span>
              <span>{activeSession.category}</span>
              <span>·</span>
              <span className="font-mono">{activeSession.difficulty}</span>
            </div>

            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {activeSession.question}
            </h3>

            {activeSession.context_or_scenario && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed font-mono">
                {activeSession.context_or_scenario}
              </div>
            )}

            {activeSession.rubric_points && activeSession.rubric_points.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Key Concepts Evaluated:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSession.rubric_points.map((rp, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200"
                    >
                      {rp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Answer Input or Evaluated View */}
          {!activeSession.completed ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900">Your Candidate Response</h4>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isRecording
                        ? 'bg-rose-50 text-rose-700 border border-rose-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                        <span>Listening... (Click to Stop)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Speak Answer (Voice Input)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <textarea
                rows={6}
                required
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Explain your approach, architectural trade-offs, code structures, or STAR method behavioral examples..."
                className="w-full p-4 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed font-sans"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="button"
                  onClick={handleEvaluateAnswer}
                  disabled={evaluating || !userAnswer.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {evaluating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Grading response with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit for Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* EVALUATION RESULTS CARD */
            activeSession.evaluation && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                      Hiring Verdict
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      {activeSession.evaluation.overall_verdict}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Evaluated against industry tech placement interview standards.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-center">
                      <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                        {activeSession.evaluation.score}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Overall Score
                      </span>
                    </div>

                    <div className="h-10 w-px bg-slate-200" />

                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-slate-500">Tech Depth:</span>{' '}
                        <span className="font-mono font-bold text-slate-900">
                          {activeSession.evaluation.technical_depth_score}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Clarity:</span>{' '}
                        <span className="font-mono font-bold text-slate-900">
                          {activeSession.evaluation.clarity_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Answer Reference */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Your Submitted Answer
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 leading-relaxed">
                    {activeSession.user_answer}
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h4 className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-3">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Strengths in Your Answer</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {activeSession.evaluation.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mb-3">
                      <Award className="w-4 h-4" />
                      <span>Actionable Improvements</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {activeSession.evaluation.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold mt-0.5">→</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Missing points */}
                {activeSession.evaluation.missing_points &&
                  activeSession.evaluation.missing_points.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-semibold text-rose-700 flex items-center gap-1.5 mb-3">
                        <AlertCircle className="w-4 h-4" />
                        <span>Key Concepts Missed</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {activeSession.evaluation.missing_points.map((mp, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-500 font-bold">✕</span>
                            <span>{mp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Ideal Gold-Standard Sample Answer */}
                <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xs bg-gradient-to-b from-blue-50/20 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Gold-Standard Sample Answer (Staff / Top 1% Model)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans bg-white p-4 rounded-xl border border-slate-200">
                    {activeSession.evaluation.ideal_sample_answer}
                  </p>
                </div>

                {/* Option to generate another question */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleResetForNewQuestion}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Practice Another Interview Question</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Past Interview History */}
      {history.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Interview Practice History</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{history.length} completed</span>
          </div>

          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  setActiveSession(item);
                  setUserAnswer(item.user_answer || '');
                }}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {item.question}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.job_role} · {item.category} ·{' '}
                    <span className="font-mono">{item.difficulty}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {item.evaluation ? (
                    <span className="text-xs font-mono font-bold tabular-nums px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {item.evaluation.score}/100
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Incomplete</span>
                  )}
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
