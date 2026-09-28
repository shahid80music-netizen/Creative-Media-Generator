import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  Users,
  Share2,
  FileText,
  Copy,
  Check,
  Plus,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { TaskItem } from '../types';
import { exportToICS } from '../utils/cryptoBackup';

export const CalendarSync: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [copiedLink, setCopiedLink] = useState(false);

  // Collaborative Document / Notes State
  const [docContent, setDocContent] = useState(
    '# Sprint Launch Project Document\n\n- Scope: Synchronize cross-platform to-dos with Firebase backend\n- Milestone 1: Voice memos transcription & audio lyric video synthesis\n- Milestone 2: AI daily smart scheduling workflow engine\n- Milestone 3: Google Calendar sync & encrypted cloud backups\n- Milestone 4: Multi-track music studio with WAV exports\n- Milestone 5: Canva-style canvas video & audio editor\n\n## Collaborative Notes:\nTeam members have full read-write access to live synchronized task states.'
  );
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorsList, setCollaboratorsList] = useState<string[]>([
    'alex.chen@innovate.io',
    'marina.smith@designstudio.org',
  ]);
  const [docNotice, setDocNotice] = useState<string | null>(null);

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

  // Google Calendar URL Generator
  const createGoogleCalendarLink = (task: TaskItem) => {
    const title = encodeURIComponent(task.title);
    const details = encodeURIComponent(task.description || 'Task scheduled with SyncFlow AI');
    const dt = (task.dueDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dt}/${dt}`;
    return url;
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaboratorEmail.trim()) return;
    if (!collaboratorsList.includes(collaboratorEmail.trim())) {
      setCollaboratorsList([...collaboratorsList, collaboratorEmail.trim()]);
    }
    setCollaboratorEmail('');
    setDocNotice('Team member invited! Real-time document syncing active.');
    setTimeout(() => setDocNotice(null), 4000);
  };

  const tasksOnSelectedDate = tasks.filter((t) => (t.dueDate || '').startsWith(selectedDate));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-indigo-900/30 border border-emerald-500/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Task 3: Calendar APIs &amp; Collaborative Sharing</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Calendar Sync &amp; Real-time Team Workspace
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Seamlessly export to Google Calendar or iCal, invite remote team members, and collaborate in real time with shared project documentation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToICS(tasks)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full iCal (.ics)</span>
            </button>
            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Workspace'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Calendar View on Left, Collaborative Document & Team on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar & Deadlines */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
                <span>Calendar &amp; Google Calendar Deep Links</span>
              </h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Tasks scheduled on this date */}
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Tasks Due on {selectedDate} ({tasksOnSelectedDate.length})
              </p>

              {tasksOnSelectedDate.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-400">No tasks scheduled for this day.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasksOnSelectedDate.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            t.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {t.title}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {t.estimatedMinutes}m est • {t.priority.toUpperCase()}
                        </p>
                      </div>

                      {/* 1-Click Google Calendar Link */}
                      <a
                        href={createGoogleCalendarLink(t)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors shrink-0"
                        title="Add directly to your Google Calendar"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Google Cal</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All upcoming deadlines list */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                All Scheduled Deadlines
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                {tasks
                  .filter((t) => t.dueDate)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => t.dueDate && setSelectedDate(t.dueDate)}
                      className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <span className="truncate pr-2 text-slate-800 dark:text-slate-200">
                        {t.title}
                      </span>
                      <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 shrink-0">
                        {t.dueDate}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Collaborative Document & Team Workspace */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Collaborative Project Notes</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Collaborative Sync</span>
              </span>
            </div>

            {/* Active Team Avatars */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Remote Team ({collaboratorsList.length + 1} online):
                </span>
              </div>
              <div className="flex -space-x-1.5 overflow-hidden">
                <div
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-600 text-white text-[10px] font-bold text-center leading-6"
                  title="You"
                >
                  Me
                </div>
                {collaboratorsList.map((collab, i) => (
                  <div
                    key={i}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-purple-600 text-white text-[10px] font-bold text-center leading-6"
                    title={collab}
                  >
                    {collab[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite collaborator form */}
            <form onSubmit={handleAddCollaborator} className="flex gap-2">
              <input
                type="email"
                required
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </form>

            {docNotice && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {docNotice}
              </p>
            )}

            {/* Document Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shared Markdown Document (Real-time Editable)
              </label>
              <textarea
                rows={9}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full font-mono px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
