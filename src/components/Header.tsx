import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { NavView } from './Sidebar';

interface HeaderProps {
  currentView: NavView;
  onOpenMobileMenu: () => void;
  onOpenAddApplication: () => void;
  onSelectView: (view: NavView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileMenu,
  onOpenAddApplication,
  onSelectView,
}) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      // silent catch for header poll
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'applications':
        return 'Job Applications Pipeline';
      case 'resume':
        return 'AI Resume ATS Analyzer';
      case 'skill-gap':
        return 'Skill Gap & Job Diagnostics';
      case 'interview':
        return 'AI Interactive Interview Coach';
      case 'deadlines':
        return 'Deadlines & Reminders';
      case 'analytics':
        return 'Performance Analytics';
      case 'profile':
        return 'Candidate Profile & Settings';
      default:
        return 'AI CareerTrack';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-400 hidden sm:inline">AI CareerTrack</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
            {getBreadcrumbTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Quick Action, Notifications, User info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAddApplication}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Application</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet. Upcoming application deadlines will appear here.
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 text-xs flex gap-3 transition-colors ${
                        n.read ? 'bg-white opacity-70' : 'bg-blue-50/40'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'deadline' ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : n.type === 'interview' ? (
                          <Sparkles className="w-4 h-4 text-blue-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{n.title}</p>
                        <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                        {n.due_date && (
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">
                            Due: {n.due_date}
                          </p>
                        )}
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n._id)}
                          className="shrink-0 text-[10px] text-blue-600 hover:underline self-start"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectView('deadlines');
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  View all deadline alerts &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Candidate Avatar Pill */}
        <button
          onClick={() => onSelectView('profile')}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <span className="text-xs font-semibold text-slate-800 hidden md:inline truncate max-w-[120px]">
            {user?.full_name?.split(' ')[0] || 'User'}
          </span>
        </button>
      </div>
    </header>
  );
};
