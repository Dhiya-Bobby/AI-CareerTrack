import React, { useState } from 'react';
import {
  UserCheck,
  Building,
  GraduationCap,
  Briefcase,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProfileView: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [targetRole, setTargetRole] = useState(user?.target_role || 'Software Engineer');
  const [education, setEducation] = useState(user?.education || 'B.S. in Computer Science');
  const [experienceLevel, setExperienceLevel] = useState(
    user?.experience_level || 'Entry Level / Fresher'
  );
  const [targetCompanies, setTargetCompanies] = useState(
    user?.target_companies?.join(', ') || 'Google, Microsoft, Stripe, Amazon, Meta'
  );

  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const companiesArray = targetCompanies
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const res = await api.updateProfile({
        full_name: fullName.trim(),
        target_role: targetRole.trim(),
        education: education.trim(),
        experience_level: experienceLevel,
        target_companies: companiesArray,
      });
      updateUser(res.user);
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.seedDemoData();
      await refreshUser();
      setSuccessMsg('Demo applications, resume data, and ATS analysis loaded successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to seed demo data.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Candidate Profile & Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your career target parameters, academic degree, and placement pipeline preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal / Candidate Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email (Account ID)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Target Role
              </label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer, SDE 1"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                <option value="Entry Level / Fresher">Entry Level / College Graduate</option>
                <option value="Internship Seeker">Internship Seeker</option>
                <option value="Mid-Level (1-3 years)">Junior / Mid-Level (1-3 years)</option>
                <option value="Senior (3+ years)">Senior (3+ years)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Education / Degree Details
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. University of California, Berkeley – B.S. in Computer Science"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Dream Companies (Comma separated)
            </label>
            <input
              type="text"
              value={targetCompanies}
              onChange={(e) => setTargetCompanies(e.target.value)}
              placeholder="Google, Microsoft, Stripe, Datadog"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recruiter / Placement Demo Controls */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xs border border-slate-800">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-600 rounded-xl shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">
              Portfolio & Placement Demonstration Data
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              If you want to demonstrate this application during technical placement interviews or recruiter reviews, you can load realistic job applications (Google, Microsoft, Stripe, Amazon) and an authenticated AI resume profile at any time.
            </p>

            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shadow-xs"
            >
              {seeding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Demonstration Dataset...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Load Placement Season Demo Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
