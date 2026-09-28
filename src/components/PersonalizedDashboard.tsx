import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Lock,
  Unlock,
  Bell,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Flame,
  Key,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TaskItem } from '../types';
import { encryptUserData, decryptUserData, exportToCSV } from '../utils/cryptoBackup';

export const PersonalizedDashboard: React.FC = () => {
  const { user, profile, toggleBiometrics } = useAuth();
  const { t } = useLanguage();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  // Backup state
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [restoreFileContent, setRestoreFileContent] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  // Notifications state
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Fetch tasks
  useEffect(() => {
    if (!user) {
      const local = localStorage.getItem('syncflow_demo_tasks');
      if (local) {
        try {
          setTasks(JSON.parse(local));
        } catch {
          setTasks([]);
        }
      }
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetched: TaskItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          fetched.push({
            id: d.id,
            userId: data.userId,
            title: data.title || '',
            description: data.description || '',
            completed: Boolean(data.completed),
            priority: data.priority || 'medium',
            category: data.category || 'General',
            dueDate: data.dueDate || '',
            estimatedMinutes: data.estimatedMinutes || 30,
            collaboratorEmails: data.collaboratorEmails || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          });
        });
        setTasks(fetched);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'tasks');
      }
    );

    return () => unsub();
  }, [user]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: number | null = null;
    if (pomodoroRunning && pomodoroSeconds > 0) {
      interval = window.setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0 && pomodoroRunning) {
      setPomodoroRunning(false);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('SyncFlow Focus Complete! 🎉', {
          body: 'Great job! Time for a well-deserved restorative break.',
        });
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroRunning, pomodoroSeconds]);

  // Request Push Notifications
  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Push notifications not supported on this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      new Notification('SyncFlow AI Connected', {
        body: 'Real-time task synchronization & focus updates enabled.',
      });
    }
  };

  // Metric computations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && !t.completed).length;
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Encrypted Backup Handler
  const handleCreateEncryptedBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupPassphrase) {
      alert('Please enter an encryption password');
      return;
    }

    try {
      const encryptedJson = await encryptUserData(tasks, backupPassphrase);
      const blob = new Blob([encryptedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `syncflow_encrypted_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setBackupStatus('End-to-end encrypted backup generated and downloaded!');
      setBackupPassphrase('');
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err) {
      alert('Encryption error: ' + String(err));
    }
  };

  // Restore Encrypted Backup Handler
  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restorePassphrase || !restoreFileContent) {
      alert('Please select backup file and input password');
      return;
    }

    try {
      const decryptedTasks = await decryptUserData(restoreFileContent, restorePassphrase);
      setBackupStatus(`Successfully decrypted ${decryptedTasks.length} tasks!`);
      // Update local storage or state
      if (!user) {
        localStorage.setItem('syncflow_demo_tasks', JSON.stringify(decryptedTasks));
        setTasks(decryptedTasks);
      } else {
        alert(`Decrypted ${decryptedTasks.length} tasks from backup. Reviewing entries...`);
      }
      setRestorePassphrase('');
      setRestoreFileContent('');
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err) {
      alert('Decryption failed: Incorrect password or invalid file.');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const formatPomodoro = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-purple-900/30 border border-violet-500/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Dashboard &amp; End-to-End Security</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Metrics, Biometrics &amp; Encrypted Backups
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Track project velocity widgets, protect data with client-side AES-GCM password encryption, and export comprehensive CSV and PDF reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCSV(tasks)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/10 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t('exportCSV')}</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('exportPDF')}</span>
            </button>
          </div>
        </div>
      </div>

      {backupStatus && (
        <div className="p-3 text-xs rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{backupStatus}</span>
        </div>
      )}

      {/* Customizable Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Completion Velocity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Productivity Score</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {completionRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({completedTasks}/{totalTasks} done)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Widget 2: Urgent Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Urgent Deadlines</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {urgentTasks}
            </span>
            <span className="text-xs text-slate-400">high attention</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {urgentTasks > 0 ? 'Prioritized in today’s smart schedule' : 'No urgent bottlenecks'}
          </p>
        </div>

        {/* Widget 3: Total Estimated Workload */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Estimated Workload</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {totalHours}h
            </span>
            <span className="text-xs text-slate-400">across {totalTasks} items</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Optimally partitioned with buffer intervals
          </p>
        </div>

        {/* Widget 4: Quick Pomodoro Focus Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Focus Sprint</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatPomodoro(pomodoroSeconds)}
            </span>
            <button
              onClick={() => setPomodoroRunning(!pomodoroRunning)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg text-white transition-colors ${
                pomodoroRunning ? 'bg-amber-600' : 'bg-indigo-600'
              }`}
            >
              {pomodoroRunning ? 'Pause' : 'Start'}
            </button>
          </div>
          <button
            onClick={() => {
              setPomodoroRunning(false);
              setPomodoroSeconds(25 * 60);
            }}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Reset to 25 mins
          </button>
        </div>
      </div>

      {/* Two Column Grid: Biometrics & Push on Left, Encrypted Backups on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Biometrics & Push Notifications */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Biometric Authentication &amp; Screen Lock</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enhance privacy by requiring biometric confirmation (fingerprint / Face ID / PIN) before opening your personalized dashboard.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Biometric &amp; Passcode Guard
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {profile?.biometricsEnabled ? 'Lock protection is ACTIVE' : 'Currently inactive'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleBiometrics(!profile?.biometricsEnabled)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  profile?.biometricsEnabled
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {profile?.biometricsEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {/* Push Notifications Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-500" />
                <span>Real-Time Push Notifications</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Receive instant team updates, urgent deadline reminders, and pomodoro alerts across devices.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  Status: {notificationStatus}
                </span>
                <button
                  onClick={requestNotificationPermission}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  Test / Enable Notifications
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: End-to-End Encrypted Cloud Backups */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" />
              <span>End-to-End Encrypted Data Backup (AES-GCM)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your tasks are encrypted client-side using 256-bit AES-GCM and PBKDF2 key derivation. The backup cannot be read without your private password.
            </p>

            {/* Create Encrypted Backup */}
            <form onSubmit={handleCreateEncryptedBackup} className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                1. Export Encrypted Backup
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  placeholder="Set encryption passphrase..."
                  value={backupPassphrase}
                  onChange={(e) => setBackupPassphrase(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </form>

            {/* Restore Encrypted Backup */}
            <form onSubmit={handleRestoreBackup} className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                2. Restore from Encrypted Backup
              </label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setRestoreFileContent(event.target?.result as string);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
              />
              <div className="flex gap-2 pt-1">
                <input
                  type="password"
                  required
                  placeholder="Decryption passphrase..."
                  value={restorePassphrase}
                  onChange={(e) => setRestorePassphrase(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 inline-flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Decrypt &amp; Restore</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
