import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  XCircle,
  ArrowUpRight,
  Plus,
  FileText,
  Target,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardAnalytics, JobApplication, ApplicationStatus } from '../types';
import { api } from '../services/api';
import { NavView } from '../components/Sidebar';

interface DashboardViewProps {
  onSelectView: (view: NavView) => void;
  onOpenAddApplication: () => void;
  onSelectApplication?: (app: JobApplication) => void;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Applied: '#3B82F6',
  Assessment: '#8B5CF6',
  Interview: '#F59E0B',
  Selected: '#10B981',
  Rejected: '#EF4444',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectView,
  onOpenAddApplication,
  onSelectApplication,
}) => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardAnalytics();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-xl" />
          <div className="h-72 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">Failed to load overview</h3>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, statusDistribution, monthlyTrends, upcomingDeadlines, recentApplications } =
    data;

  const statCards = [
    {
      label: 'Total Applications',
      value: metrics.total,
      sub: `${metrics.inProgress} in progress`,
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Interviews Scheduled',
      value: metrics.interview,
      sub: `${metrics.interviewConversionRate}% pipeline rate`,
      icon: Sparkles,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Offers & Selected',
      value: metrics.selected,
      sub: `${metrics.successRate}% success rate`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Under Assessment',
      value: metrics.assessment,
      sub: 'Online tests pending',
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Rejected',
      value: metrics.rejected,
      sub: `${metrics.rejectionRate}% closure rate`,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      label: 'Application Success',
      value: `${metrics.successRate}%`,
      sub: 'Offers / Total Apps',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-xs text-blue-400 font-medium mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>AI Career Intelligence Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Supercharge your tech placement & job pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Track active interviews, scan resumes against ATS algorithms, and practice tailored interview questions with Gemini AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={onOpenAddApplication}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Track Application</span>
          </button>
          <button
            onClick={() => onSelectView('resume')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors whitespace-nowrap border border-slate-700"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Scan Resume</span>
          </button>
          <button
            onClick={() => onSelectView('interview')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors whitespace-nowrap border border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Mock Interview</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {card.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Application Velocity</h3>
              <p className="text-xs text-slate-500">
                Monthly submissions and interview milestones
              </p>
            </div>
            <button
              onClick={() => onSelectView('analytics')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              <span>Detailed Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {monthlyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly data yet. Track your first application to generate trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="applications" name="Applications" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interviews" name="Interviews" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="offers" name="Offers" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pipeline Distribution Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Pipeline Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown by current stage</p>
          </div>

          <div className="h-52 my-auto flex items-center justify-center">
            {metrics.total === 0 ? (
              <p className="text-xs text-slate-400">No applications recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 ml-auto">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Deadlines & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">Upcoming Milestones & Deadlines</h3>
            </div>
            <button
              onClick={() => onSelectView('deadlines')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View all &rarr;
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No urgent deadlines recorded in the next 14 days.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingDeadlines.map((dl) => (
                <div key={dl.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {dl.company_name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{dl.job_role}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[11px] font-mono tabular-nums font-medium px-2 py-0.5 rounded ${
                        dl.days_left <= 2
                          ? 'bg-rose-50 text-rose-700 font-semibold'
                          : dl.days_left <= 7
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {dl.days_left < 0
                        ? `${Math.abs(dl.days_left)}d overdue`
                        : dl.days_left === 0
                        ? 'Today!'
                        : `${dl.days_left}d left`}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                      {dl.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">Recent Applications</h3>
            </div>
            <button
              onClick={() => onSelectView('applications')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Open Tracker &rarr;
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-slate-400">No applications tracked yet.</p>
              <button
                onClick={onOpenAddApplication}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                + Add your first application
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApplications.map((app) => (
                <div
                  key={app._id}
                  onClick={() => onSelectApplication && onSelectApplication(app)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {app.company_name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {app.job_role} · <span className="font-mono">{app.location}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${STATUS_COLORS[app.application_status]}15`,
                        color: STATUS_COLORS[app.application_status],
                      }}
                    >
                      {app.application_status}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                      {app.application_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
