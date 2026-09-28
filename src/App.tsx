/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TaskList } from './components/TaskList';
import { TaskVoiceSynthesizer } from './components/TaskVoiceSynthesizer';
import { SmartScheduleEngine } from './components/SmartScheduleEngine';
import { CalendarSync } from './components/CalendarSync';
import { MusicStudio } from './components/MusicStudio';
import { MediaEditor } from './components/MediaEditor';
import { PersonalizedDashboard } from './components/PersonalizedDashboard';
import { BiometricLockModal } from './components/BiometricLockModal';
import { testConnection } from './firebase/config';
import { TaskItem } from './types';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('tasks');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [selectedTaskForMedia, setSelectedTaskForMedia] = useState<TaskItem | null>(null);
  const { isLocked } = useAuth();
  const { isRTL } = useLanguage();

  // Test Firebase connection on initial boot
  useEffect(() => {
    testConnection();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSelectForVideo = (task: TaskItem) => {
    setSelectedTaskForMedia(task);
    setActiveTab('voice');
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      {/* Biometric / Passcode Lock Screen */}
      {isLocked && <BiometricLockModal />}

      {/* Main Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isOnline={isOnline} />

      {/* Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tasks' && <TaskList onSelectForVideo={handleSelectForVideo} />}
        {activeTab === 'voice' && (
          <TaskVoiceSynthesizer
            initialTask={selectedTaskForMedia}
            onTaskCreated={() => setActiveTab('tasks')}
          />
        )}
        {activeTab === 'schedule' && <SmartScheduleEngine />}
        {activeTab === 'calendar' && <CalendarSync />}
        {activeTab === 'music' && <MusicStudio />}
        {activeTab === 'media' && <MediaEditor />}
        {activeTab === 'dashboard' && <PersonalizedDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} SyncFlow AI — Collaborative To-Do &amp; Creative Media Suite</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Firebase Firestore Backend</span>
            <span>•</span>
            <span>AES-GCM Encrypted</span>
            <span>•</span>
            <span>Low-Memory WebAudio &amp; Canvas</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
