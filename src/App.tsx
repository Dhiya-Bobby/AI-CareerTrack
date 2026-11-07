/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavView } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ApplicationModal } from './components/ApplicationModal';
import { DashboardView } from './views/DashboardView';
import { ApplicationsView } from './views/ApplicationsView';
import { ResumeAnalyzerView } from './views/ResumeAnalyzerView';
import { SkillGapView } from './views/SkillGapView';
import { InterviewCoachView } from './views/InterviewCoachView';
import { DeadlinesView } from './views/DeadlinesView';
import { AnalyticsView } from './views/AnalyticsView';
import { ProfileView } from './views/ProfileView';
import { JobApplication } from './types';
import { api } from './services/api';
import { GraduationCap } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);

  // Loading state while auth initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg mb-4 animate-bounce">
          <GraduationCap className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-white tracking-wide">
          Initializing AI CareerTrack...
        </p>
        <p className="text-xs text-slate-400 mt-1">Verifying encrypted candidate session</p>
      </div>
    );
  }

  // Unauthenticated screen
  if (!user) {
    return <AuthModal />;
  }

  const handleSaveNewApplication = async (data: Partial<JobApplication>) => {
    await api.createApplication(data);
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onSelectView={setCurrentView}
            onOpenAddApplication={() => setIsAddAppModalOpen(true)}
            onSelectApplication={() => setCurrentView('applications')}
          />
        );
      case 'applications':
        return (
          <ApplicationsView onOpenAddModal={() => setIsAddAppModalOpen(true)} />
        );
      case 'resume':
        return <ResumeAnalyzerView />;
      case 'skill-gap':
        return <SkillGapView />;
      case 'interview':
        return <InterviewCoachView />;
      case 'deadlines':
        return (
          <DeadlinesView
            onSelectApplication={() => setCurrentView('applications')}
          />
        );
      case 'analytics':
        return <AnalyticsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return (
          <DashboardView
            onSelectView={setCurrentView}
            onOpenAddApplication={() => setIsAddAppModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          currentView={currentView}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddApplication={() => setIsAddAppModalOpen(true)}
          onSelectView={setCurrentView}
        />

        <main className="flex-1 pb-16">{renderActiveView()}</main>
      </div>

      {/* Global Add Application Modal */}
      <ApplicationModal
        isOpen={isAddAppModalOpen}
        onClose={() => setIsAddAppModalOpen(false)}
        onSave={handleSaveNewApplication}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
