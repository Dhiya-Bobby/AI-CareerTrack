import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { JobApplication, NotificationItem } from '../types';
import { api } from '../services/api';

interface DeadlinesViewProps {
  onSelectApplication?: (app: JobApplication) => void;
}

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({ onSelectApplication }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'overdue'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, notifsRes] = await Promise.all([
        api.getApplications({ sort: 'deadline' }),
        api.getNotifications(),
      ]);
      setApplications(appsRes.applications.filter((a) => !!a.application_deadline) || []);
      setNotifications(notifsRes.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const now = new Date();

  const deadlinesWithDiff = applications.map((app) => {
    const d = new Date(app.application_deadline!);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      app,
      diffDays,
      isOverdue: diffDays < 0 && app.application_status !== 'Selected' && app.application_status !== 'Rejected',
      isUpcoming7Days: diffDays >= 0 && diffDays <= 7,
    };
  });

  const filteredDeadlines = deadlinesWithDiff.filter((item) => {
    if (filterType === 'overdue') return item.isOverdue;
    if (filterType === 'urgent') return item.isUpcoming7Days;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Application Deadlines & Milestones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor upcoming technical rounds, assessment deadlines, and notification alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All Deadlines
          </button>
          <button
            onClick={() => setFilterType('urgent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'urgent'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Next 7 Days
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'overdue'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Overdue Alerts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadlines Timeline (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Scheduled Application Timelines
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading schedules...</div>
            ) : filteredDeadlines.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No matching application deadlines found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeadlines.map(({ app, diffDays, isOverdue, isUpcoming7Days }) => (
                  <div
                    key={app._id}
                    className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
                      isOverdue
                        ? 'bg-rose-50/50 border-rose-200'
                        : isUpcoming7Days
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {app.company_name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {app.application_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{app.job_role}</p>
                      {app.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                          "{app.notes}"
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-mono font-bold tabular-nums px-2.5 py-1 rounded-md inline-block ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : isUpcoming7Days
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {diffDays < 0
                          ? `${Math.abs(diffDays)}d Overdue`
                          : diffDays === 0
                          ? 'Due Today!'
                          : `${diffDays} days left`}
                      </div>
                      <span className="block text-[11px] text-slate-400 font-mono mt-1">
                        {app.application_deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications & System Alerts (Right 1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">In-App Notifications</h3>
              </div>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No notifications recorded.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      n.read
                        ? 'bg-slate-50/50 border-slate-100 opacity-60'
                        : 'bg-blue-50/50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{n.title}</p>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n._id)}
                          className="text-[10px] text-blue-600 hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                      {n.message}
                    </p>
                    <span className="block text-[10px] text-slate-400 mt-2 font-mono">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
