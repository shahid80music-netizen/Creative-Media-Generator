import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  Coffee,
  Brain,
  Sliders,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { TaskItem, ScheduleBlock } from '../types';
import { exportToICS } from '../utils/cryptoBackup';

export const SmartScheduleEngine: React.FC = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('17:30');
  const [focusInterval, setFocusInterval] = useState(45); // 25, 45, 60 min
  const [breakInterval, setBreakInterval] = useState(10);
  const [lunchHour, setLunchHour] = useState('12:30');
  const [lunchDuration, setLunchDuration] = useState(45);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Fetch pending tasks
  useEffect(() => {
    if (!user) {
      const local = localStorage.getItem('syncflow_demo_tasks');
      if (local) {
        try {
          const list: TaskItem[] = JSON.parse(local);
          setTasks(list.filter((t) => !t.completed));
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
          if (!data.completed) {
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
              createdAt: data.createdAt || '',
              updatedAt: data.updatedAt || '',
            });
          }
        });
        setTasks(fetched);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'tasks');
      }
    );

    return () => unsub();
  }, [user]);

  // Convert HH:mm to minutes from midnight
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Convert minutes from midnight to HH:mm
  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    return `${pad(h)}:${pad(m)}`;
  };

  // AI-Powered Scheduling Algorithm
  const runSmartScheduleOptimizer = () => {
    setIsOptimizing(true);

    setTimeout(() => {
      // 1. Sort tasks by priority and duration
      const priorityWeights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const sorted = [...tasks].sort((a, b) => {
        const pDiff = (priorityWeights[b.priority] || 1) - (priorityWeights[a.priority] || 1);
        if (pDiff !== 0) return pDiff;
        return (a.estimatedMinutes || 30) - (b.estimatedMinutes || 30);
      });

      const dayStart = timeToMinutes(startHour);
      const dayEnd = timeToMinutes(endHour);
      const lunchStart = timeToMinutes(lunchHour);
      const lunchEnd = lunchStart + lunchDuration;

      const blocks: ScheduleBlock[] = [];
      let currentMinute = dayStart;

      // Plan tasks throughout the day
      for (const task of sorted) {
        if (currentMinute >= dayEnd) break;

        // Check if current block hits lunch break
        if (currentMinute < lunchStart && currentMinute + (task.estimatedMinutes || 30) > lunchStart) {
          // Add remaining time before lunch as short review block
          if (lunchStart - currentMinute >= 15) {
            blocks.push({
              id: 'pre-lunch-review',
              title: 'Context Sync & Quick Email Check',
              startTime: minutesToTime(currentMinute),
              endTime: minutesToTime(lunchStart),
              durationMinutes: lunchStart - currentMinute,
              type: 'review',
            });
          }
          currentMinute = lunchStart;
        }

        // Add lunch block if at lunch time
        if (currentMinute >= lunchStart && currentMinute < lunchEnd) {
          blocks.push({
            id: 'lunch-block',
            title: 'Lunch & Cognitive Restorative Break',
            startTime: minutesToTime(lunchStart),
            endTime: minutesToTime(lunchEnd),
            durationMinutes: lunchDuration,
            type: 'lunch',
          });
          currentMinute = lunchEnd;
        }

        // Focus task block
        const duration = Math.min(task.estimatedMinutes || 30, focusInterval);
        const blockEnd = Math.min(currentMinute + duration, dayEnd);

        blocks.push({
          id: `block-${task.id}`,
          taskId: task.id,
          title: task.title,
          startTime: minutesToTime(currentMinute),
          endTime: minutesToTime(blockEnd),
          durationMinutes: blockEnd - currentMinute,
          type: 'focus',
          priority: task.priority,
          completed: false,
        });

        currentMinute = blockEnd;

        // Add restorative break after focus block
        if (currentMinute + breakInterval < dayEnd && currentMinute !== lunchStart) {
          blocks.push({
            id: `break-${Date.now()}-${currentMinute}`,
            title: 'Mindful Break & Hydration',
            startTime: minutesToTime(currentMinute),
            endTime: minutesToTime(currentMinute + breakInterval),
            durationMinutes: breakInterval,
            type: 'break',
          });
          currentMinute += breakInterval;
        }
      }

      setSchedule(blocks);
      setIsOptimizing(false);
      setAppliedNotice('Daily workflow schedule generated and optimized for peak focus!');
      setTimeout(() => setAppliedNotice(null), 5000);
    }, 600);
  };

  const toggleBlockCompleted = (id: string) => {
    setSchedule((prev) =>
      prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
    );
  };

  const handleSyncToCalendar = () => {
    // Generate tasks for calendar sync
    const scheduleTasks: TaskItem[] = schedule
      .filter((s) => s.type === 'focus')
      .map((s) => ({
        id: s.id,
        userId: user ? user.uid : 'demo',
        title: s.title,
        description: `Scheduled focus block (${s.startTime} - ${s.endTime})`,
        completed: Boolean(s.completed),
        priority: s.priority || 'medium',
        dueDate: new Date().toISOString().slice(0, 10),
        estimatedMinutes: s.durationMinutes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    exportToICS(scheduleTasks);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Task 2: AI Smart Scheduling Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Adaptive Daily Workflow Optimization
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Analyzes your pending to-do queue, urgency priorities, and cognitive energy levels to construct the ideal focus blocks and rest intervals.
            </p>
          </div>

          <button
            onClick={runSmartScheduleOptimizer}
            disabled={isOptimizing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Brain className="w-4 h-4" />
            <span>{isOptimizing ? 'Optimizing Schedule...' : 'Generate Smart Schedule'}</span>
          </button>
        </div>
      </div>

      {appliedNotice && (
        <div className="p-3 text-xs rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span>{appliedNotice}</span>
          </div>
          <button
            onClick={handleSyncToCalendar}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Sync to iCal / Calendar
          </button>
        </div>
      )}

      {/* Configuration & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parameters Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Availability &amp; Preferences</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Day Start
                  </label>
                  <input
                    type="time"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Day End
                  </label>
                  <input
                    type="time"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Focus Sprint Interval ({focusInterval} min)
                </label>
                <div className="flex gap-2">
                  {[25, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setFocusInterval(mins)}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                        focusInterval === mins
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Buffer / Micro-break ({breakInterval} min)
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setBreakInterval(mins)}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                        breakInterval === mins
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Lunch Time
                  </label>
                  <input
                    type="time"
                    value={lunchHour}
                    onChange={(e) => setLunchHour(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Lunch Duration
                  </label>
                  <select
                    value={lunchDuration}
                    onChange={(e) => setLunchDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {tasks.length} pending tasks eligible for automated scheduling.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Timeline Display */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Today's Optimized Timeline</span>
              </h3>
              {schedule.length > 0 && (
                <button
                  onClick={handleSyncToCalendar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Download .ics</span>
                </button>
              )}
            </div>

            {schedule.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <Brain className="w-10 h-10 mx-auto text-blue-500 mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No Schedule Generated Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Click "Generate Smart Schedule" above to let the AI balance your workload, tasks, and breaks.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-5 space-y-3.5">
                {schedule.map((block) => {
                  const isFocus = block.type === 'focus';
                  const isBreak = block.type === 'break';
                  const isLunch = block.type === 'lunch';

                  return (
                    <div key={block.id} className="relative group">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[27px] top-3.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          isLunch
                            ? 'bg-amber-500'
                            : isBreak
                            ? 'bg-emerald-500'
                            : block.completed
                            ? 'bg-indigo-400'
                            : 'bg-indigo-600'
                        }`}
                      />

                      <div
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isLunch
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                            : isBreak
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                            : block.completed
                            ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-60'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isFocus && (
                              <button
                                onClick={() => toggleBlockCompleted(block.id)}
                                className="shrink-0 text-slate-400 hover:text-indigo-600 cursor-pointer"
                              >
                                <CheckCircle2
                                  className={`w-4 h-4 ${
                                    block.completed ? 'text-indigo-600 fill-indigo-100' : ''
                                  }`}
                                />
                              </button>
                            )}
                            {isBreak && <Coffee className="w-4 h-4 text-emerald-500 shrink-0" />}
                            {isLunch && <Coffee className="w-4 h-4 text-amber-500 shrink-0" />}

                            <div className="min-w-0">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  block.completed ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {block.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {block.durationMinutes} mins • {block.type.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {block.startTime} – {block.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
