import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, DollarSign, Calendar, Globe, Link2, FileText } from 'lucide-react';
import { JobApplication, ApplicationStatus } from '../types';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<JobApplication>) => Promise<void>;
  application?: JobApplication | null;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Applied',
  'Assessment',
  'Interview',
  'Selected',
  'Rejected',
];

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  application,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [applicationLink, setApplicationLink] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [location, setLocation] = useState('Remote / Hybrid');
  const [salaryRange, setSalaryRange] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('Applied');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      setCompanyName(application.company_name || '');
      setJobRole(application.job_role || '');
      setJobDescription(application.job_description || '');
      setCompanyWebsite(application.company_website || '');
      setApplicationLink(application.application_link || '');
      setApplicationDate(application.application_date || '');
      setApplicationDeadline(application.application_deadline || '');
      setLocation(application.location || 'Remote / Hybrid');
      setSalaryRange(application.salary_range || '');
      setApplicationStatus(application.application_status || 'Applied');
      setNotes(application.notes || '');
    } else {
      setCompanyName('');
      setJobRole('');
      setJobDescription('');
      setCompanyWebsite('');
      setApplicationLink('');
      setApplicationDate(new Date().toISOString().split('T')[0]);
      setApplicationDeadline('');
      setLocation('Remote / Hybrid');
      setSalaryRange('');
      setApplicationStatus('Applied');
      setNotes('');
    }
    setError(null);
  }, [application, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !jobRole.trim()) {
      setError('Company name and job role are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        company_name: companyName.trim(),
        job_role: jobRole.trim(),
        job_description: jobDescription.trim(),
        company_website: companyWebsite.trim(),
        application_link: applicationLink.trim(),
        application_date: applicationDate,
        application_deadline: applicationDeadline,
        location: location.trim(),
        salary_range: salaryRange.trim(),
        application_status: applicationStatus,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {application ? 'Edit Application' : 'Track New Job Application'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record interview dates, target salaries, and application status.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Stripe, Microsoft"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Role <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Software Engineer, Backend Intern"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pipeline Status
              </label>
              <select
                value={applicationStatus}
                onChange={(e) => setApplicationStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Remote, Seattle, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Salary Range (Optional)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. $130k - $160k"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deadline / Round Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Posting / Portal Link
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  placeholder="https://linkedin.com/jobs/..."
                  value={applicationLink}
                  onChange={(e) => setApplicationLink(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Job Description (Used for Skill Gap Analysis)
            </label>
            <textarea
              rows={3}
              placeholder="Paste requirements, tech stack details, or responsibilities..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Candidate Notes & Interview Logs
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Recruiter call went well. Coding test scheduled on dynamic programming..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {loading ? 'Saving...' : application ? 'Update Application' : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
