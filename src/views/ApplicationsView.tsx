import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  MoreVertical,
  Layers,
  Table as TableIcon,
  Globe,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { JobApplication, ApplicationStatus } from '../types';
import { api } from '../services/api';
import { ApplicationModal } from '../components/ApplicationModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface ApplicationsViewProps {
  onOpenAddModal: () => void;
  selectedAppForEdit?: JobApplication | null;
}

const STATUSES: { id: ApplicationStatus | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'All Applications', color: '#64748B' },
  { id: 'Applied', label: 'Applied', color: '#3B82F6' },
  { id: 'Assessment', label: 'Assessment', color: '#8B5CF6' },
  { id: 'Interview', label: 'Interview', color: '#F59E0B' },
  { id: 'Selected', label: 'Selected / Offer', color: '#10B981' },
  { id: 'Rejected', label: 'Rejected', color: '#EF4444' },
];

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({ onOpenAddModal }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailModalApp, setDetailModalApp] = useState<JobApplication | null>(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await api.getApplications({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortOption,
      });
      setApplications(res.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [statusFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApps();
  };

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await api.updateApplication(appId, { application_status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, application_status: newStatus } : a))
      );
    } catch (e) {
      console.error('Status change error:', e);
    }
  };

  const handleEditClick = (app: JobApplication) => {
    setEditingApp(app);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteApplication(deletingId);
      setApplications((prev) => prev.filter((a) => a._id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdited = async (data: Partial<JobApplication>) => {
    if (!editingApp) return;
    const res = await api.updateApplication(editingApp._id, data);
    setApplications((prev) =>
      prev.map((a) => (a._id === editingApp._id ? res.application : a))
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Job Applications Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your recruitment stages, interview dates, and company communications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {STATUSES.map((st) => {
            const isActive = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by company, role, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 shrink-0">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="newest">Applied: Newest First</option>
              <option value="oldest">Applied: Oldest First</option>
              <option value="deadline">Closest Deadline</option>
              <option value="company">Company Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No applications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'Try modifying your search query or status filter to see other applications.'
              : 'Start building your job search pipeline by adding your first application.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Job Application</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Company & Role</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Next Deadline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Company & Role */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer" onClick={() => setDetailModalApp(app)}>
                          {app.company_name}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{app.job_role}</div>
                      </div>
                    </td>

                    {/* Location & Salary */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{app.location || 'Remote'}</div>
                      {app.salary_range && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {app.salary_range}
                        </div>
                      )}
                    </td>

                    {/* Status with quick selector */}
                    <td className="py-3.5 px-4">
                      <select
                        value={app.application_status}
                        onChange={(e) =>
                          handleStatusChange(app._id, e.target.value as ApplicationStatus)
                        }
                        className={`text-xs font-semibold px-2 py-1 rounded-md border border-transparent hover:border-slate-300 focus:outline-none cursor-pointer ${
                          app.application_status === 'Selected'
                            ? 'bg-emerald-50 text-emerald-700'
                            : app.application_status === 'Interview'
                            ? 'bg-amber-50 text-amber-700'
                            : app.application_status === 'Assessment'
                            ? 'bg-purple-50 text-purple-700'
                            : app.application_status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Assessment">Assessment</option>
                        <option value="Interview">Interview</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Applied Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono tabular-nums">
                      {app.application_date || '—'}
                    </td>

                    {/* Next Deadline */}
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {app.application_deadline ? (
                        <span className="text-slate-700">{app.application_deadline}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {app.application_link && (
                          <a
                            href={app.application_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Job Listing Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEditClick(app)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Application"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(app._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3
                      onClick={() => setDetailModalApp(app)}
                      className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                    >
                      {app.company_name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">{app.job_role}</p>
                  </div>

                  <select
                    value={app.application_status}
                    onChange={(e) =>
                      handleStatusChange(app._id, e.target.value as ApplicationStatus)
                    }
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                      app.application_status === 'Selected'
                        ? 'bg-emerald-50 text-emerald-700'
                        : app.application_status === 'Interview'
                        ? 'bg-amber-50 text-amber-700'
                        : app.application_status === 'Assessment'
                        ? 'bg-purple-50 text-purple-700'
                        : app.application_status === 'Rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Interview">Interview</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{app.location || 'Remote'}</span>
                  </div>

                  {app.application_deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-mono">Deadline: {app.application_deadline}</span>
                    </div>
                  )}

                  {app.salary_range && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono">$</span>
                      <span className="font-mono">{app.salary_range}</span>
                    </div>
                  )}
                </div>

                {app.notes && (
                  <p className="mt-3 text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                    {app.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  Applied {app.application_date}
                </span>

                <div className="flex items-center gap-1">
                  {app.application_link && (
                    <a
                      href={app.application_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Job Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEditClick(app)}
                    className="p-1 text-slate-400 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(app._id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <ApplicationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSaveEdited}
        application={editingApp}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Job Application"
        message="Are you sure you want to delete this application record? All interview logs and notes associated with it will be removed."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingId(null);
        }}
      />

      {/* Detail Slideout / Modal */}
      {detailModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-xl w-full rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-600">
                  {detailModalApp.application_status}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {detailModalApp.company_name}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {detailModalApp.job_role} · {detailModalApp.location}
                </p>
              </div>
              <button
                onClick={() => setDetailModalApp(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {detailModalApp.salary_range && (
                <div>
                  <span className="font-semibold text-slate-700">Salary Target:</span>{' '}
                  <span className="font-mono text-slate-900">{detailModalApp.salary_range}</span>
                </div>
              )}

              {detailModalApp.application_deadline && (
                <div>
                  <span className="font-semibold text-slate-700">Next Milestone:</span>{' '}
                  <span className="font-mono text-amber-700 font-semibold">
                    {detailModalApp.application_deadline}
                  </span>
                </div>
              )}

              {detailModalApp.job_description && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Job Description:
                  </span>
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-700 font-mono text-[11px] max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {detailModalApp.job_description}
                  </div>
                </div>
              )}

              {detailModalApp.notes && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Interview Notes:
                  </span>
                  <div className="p-3 bg-blue-50/50 rounded-lg text-slate-800 text-xs">
                    {detailModalApp.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                Applied on {detailModalApp.application_date}
              </span>
              <button
                onClick={() => {
                  setDetailModalApp(null);
                  handleEditClick(detailModalApp);
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Edit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
