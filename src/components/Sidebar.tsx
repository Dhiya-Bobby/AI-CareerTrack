import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Target,
  Sparkles,
  Calendar,
  BarChart3,
  UserCheck,
  LogOut,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavView =
  | 'dashboard'
  | 'applications'
  | 'resume'
  | 'skill-gap'
  | 'interview'
  | 'deadlines'
  | 'analytics'
  | 'profile';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  unreadCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  unreadCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Pipeline summary & KPIs',
    },
    {
      id: 'applications' as NavView,
      label: 'Applications Tracker',
      icon: Briefcase,
      description: 'Active recruitment pipeline',
    },
    {
      id: 'resume' as NavView,
      label: 'AI Resume Analyzer',
      icon: FileText,
      description: 'ATS diagnostics & score',
    },
    {
      id: 'skill-gap' as NavView,
      label: 'Skill Gap Diagnostics',
      icon: Target,
      description: 'Job description alignment',
    },
    {
      id: 'interview' as NavView,
      label: 'AI Interview Coach',
      icon: Sparkles,
      description: 'Mock Q&A & evaluations',
    },
    {
      id: 'deadlines' as NavView,
      label: 'Deadlines & Alerts',
      icon: Calendar,
      badge: unreadCount > 0 ? unreadCount : undefined,
      description: 'Upcoming milestones',
    },
    {
      id: 'analytics' as NavView,
      label: 'Analytics & Insights',
      icon: BarChart3,
      description: 'Conversion rates & trends',
    },
    {
      id: 'profile' as NavView,
      label: 'Candidate Profile',
      icon: UserCheck,
      description: 'Target roles & settings',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-white text-base">
                AI CareerTrack
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">
                Early Career Platform
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="truncate">
                    <span className="truncate block">{item.label}</span>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-blue-600 text-white font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Candidate Profile footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 mb-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.full_name || 'Candidate User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.target_role || 'Job Seeker'}
                </p>
              </div>
              <button
                onClick={() => {
                  onSelectView('profile');
                  if (onCloseMobile) onCloseMobile();
                }}
                title="View Profile Settings"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
