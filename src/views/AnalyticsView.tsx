import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  PieChart as PieIcon,
  Briefcase,
  Users,
  Target,
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
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DashboardAnalytics } from '../types';
import { api } from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboardAnalytics();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading analytics...</div>;
  }

  const { metrics, statusDistribution, monthlyTrends, companyStats } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Recruitment Pipeline Analytics & Funnel
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive conversion telemetry, company application distribution, and placement velocity.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Interview Rate</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {metrics.interviewConversionRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Applications converting to interviews
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Offer / Selection Rate</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-2">
            {metrics.successRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {metrics.selected} offers received out of {metrics.total}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Pipeline</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {metrics.inProgress}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Currently pending response or in interview
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Closure / Rejection</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {metrics.rejectionRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {metrics.rejected} applications closed
          </p>
        </div>
      </div>

      {/* Recruitment Funnel Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          Candidate Placement Conversion Funnel
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Track drop-offs across application screening, online assessments, interviews, and final offers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
              1. Applied
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {metrics.total}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">100% baseline</span>
          </div>

          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
            <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider">
              2. Assessment
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {metrics.assessment + metrics.interview + metrics.selected}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {metrics.total > 0
                ? Math.round(
                    ((metrics.assessment + metrics.interview + metrics.selected) / metrics.total) *
                      100
                  )
                : 0}
              % screening pass
            </span>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              3. Interview Round
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {metrics.interview + metrics.selected}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {metrics.interviewConversionRate}% interview rate
            </span>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              4. Offers Received
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              {metrics.selected}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {metrics.successRate}% conversion
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area / Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Application Trajectory Over Time
          </h3>
          <p className="text-xs text-slate-500 mb-4">Volume of applications submitted per month</p>

          <div className="h-64">
            {monthlyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
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
                  <Legend />
                  <Bar dataKey="applications" name="Applications" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interviews" name="Interviews" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Company Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Company Application Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Top companies targeted in your pipeline</p>

          <div className="h-64">
            {companyStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No company data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Applications" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
