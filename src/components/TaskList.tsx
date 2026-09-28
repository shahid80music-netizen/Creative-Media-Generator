import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  Tag,
  Users,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  X,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TaskItem, Priority } from '../types';

interface TaskListProps {
  onSelectForVideo?: (task: TaskItem) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onSelectForVideo }) => {
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');

  // Detailed Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formCategory, setFormCategory] = useState('Work');
  const [formDueDate, setFormDueDate] = useState('');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState(30);
  const [formCollaborators, setFormCollaborators] = useState('');

  // Real-time synchronization
  useEffect(() => {
    if (!user) {
      // Local demo tasks if not signed in
      const local = localStorage.getItem('syncflow_demo_tasks');
      if (local) {
        try {
          setTasks(JSON.parse(local));
        } catch {
          setTasks(getSampleTasks());
        }
      } else {
        const samples = getSampleTasks();
        setTasks(samples);
        localStorage.setItem('syncflow_demo_tasks', JSON.stringify(samples));
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    // Strict isolation: only query tasks where userId == user.uid
    const tasksCollectionRef = collection(db, 'tasks');
    const q = query(
      tasksCollectionRef,
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
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
            voiceMemoUrl: data.voiceMemoUrl || '',
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
            updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
          });
        });
        setTasks(fetched);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'tasks');
      }
    );

    return () => unsubscribe();
  }, [user]);

  function getSampleTasks(): TaskItem[] {
    return [
      {
        id: 'demo-1',
        userId: 'demo',
        title: 'Synthesize voice memo into promotional product video',
        description: 'Record audio voice note, generate dynamic lyrics subtitles, and render 1080p canvas video.',
        completed: false,
        priority: 'urgent',
        category: 'Creative',
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        estimatedMinutes: 45,
        collaboratorEmails: 'alex@team.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'demo-2',
        userId: 'demo',
        title: 'Optimize daily schedule blocks with AI scheduling engine',
        description: 'Balance urgent project deadlines with restorative break intervals.',
        completed: false,
        priority: 'high',
        category: 'Planning',
        dueDate: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
        estimatedMinutes: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'demo-3',
        userId: 'demo',
        title: 'Compose custom Lo-Fi focus soundtrack in Music Studio',
        description: 'Multi-track sequencer with 808 kick, jazz chord progressions, and ambient reverb.',
        completed: true,
        priority: 'medium',
        category: 'Audio',
        dueDate: new Date().toISOString().slice(0, 10),
        estimatedMinutes: 30,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  // Handle Quick Add
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTaskData: Omit<TaskItem, 'id'> = {
      userId: user ? user.uid : 'demo',
      title: quickTitle.trim(),
      description: '',
      completed: false,
      priority: 'medium',
      category: 'General',
      dueDate: new Date().toISOString().slice(0, 10),
      estimatedMinutes: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (user) {
      try {
        await addDoc(collection(db, 'tasks'), newTaskData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'tasks');
      }
    } else {
      const created: TaskItem = { id: 'demo-' + Date.now(), ...newTaskData };
      const updated = [created, ...tasks];
      setTasks(updated);
      localStorage.setItem('syncflow_demo_tasks', JSON.stringify(updated));
    }

    setQuickTitle('');
  };

  // Handle Toggle Completed
  const handleToggleCompleted = async (task: TaskItem) => {
    const nextCompleted = !task.completed;

    if (nextCompleted) {
      // Fire confetti celebration!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981'],
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }

    if (user) {
      const taskRef = doc(db, 'tasks', task.id);
      try {
        await updateDoc(taskRef, {
          completed: nextCompleted,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
      }
    } else {
      const updated = tasks.map((t) =>
        t.id === task.id ? { ...t, completed: nextCompleted, updatedAt: new Date().toISOString() } : t
      );
      setTasks(updated);
      localStorage.setItem('syncflow_demo_tasks', JSON.stringify(updated));
    }
  };

  // Handle Delete
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task permanently?')) return;

    if (user) {
      const taskRef = doc(db, 'tasks', taskId);
      try {
        await deleteDoc(taskRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
      }
    } else {
      const updated = tasks.filter((t) => t.id !== taskId);
      setTasks(updated);
      localStorage.setItem('syncflow_demo_tasks', JSON.stringify(updated));
    }
  };

  // Open modal for add or edit
  const openEditModal = (task?: TaskItem) => {
    if (task) {
      setEditingTask(task);
      setFormTitle(task.title);
      setFormDescription(task.description || '');
      setFormPriority(task.priority);
      setFormCategory(task.category || 'General');
      setFormDueDate(task.dueDate || '');
      setFormEstimatedMinutes(task.estimatedMinutes || 30);
      setFormCollaborators(task.collaboratorEmails || '');
    } else {
      setEditingTask(null);
      setFormTitle('');
      setFormDescription('');
      setFormPriority('medium');
      setFormCategory('Work');
      setFormDueDate(new Date().toISOString().slice(0, 10));
      setFormEstimatedMinutes(30);
      setFormCollaborators('');
    }
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingTask) {
      // Update
      if (user) {
        const taskRef = doc(db, 'tasks', editingTask.id);
        try {
          await updateDoc(taskRef, {
            title: formTitle.trim(),
            description: formDescription.trim(),
            priority: formPriority,
            category: formCategory.trim(),
            dueDate: formDueDate,
            estimatedMinutes: Number(formEstimatedMinutes),
            collaboratorEmails: formCollaborators.trim(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `tasks/${editingTask.id}`);
        }
      } else {
        const updated = tasks.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: formTitle.trim(),
                description: formDescription.trim(),
                priority: formPriority,
                category: formCategory.trim(),
                dueDate: formDueDate,
                estimatedMinutes: Number(formEstimatedMinutes),
                collaboratorEmails: formCollaborators.trim(),
                updatedAt: new Date().toISOString(),
              }
            : t
        );
        setTasks(updated);
        localStorage.setItem('syncflow_demo_tasks', JSON.stringify(updated));
      }
    } else {
      // Create
      const newTaskData: Omit<TaskItem, 'id'> = {
        userId: user ? user.uid : 'demo',
        title: formTitle.trim(),
        description: formDescription.trim(),
        completed: false,
        priority: formPriority,
        category: formCategory.trim() || 'General',
        dueDate: formDueDate || new Date().toISOString().slice(0, 10),
        estimatedMinutes: Number(formEstimatedMinutes) || 30,
        collaboratorEmails: formCollaborators.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (user) {
        try {
          await addDoc(collection(db, 'tasks'), newTaskData);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'tasks');
        }
      } else {
        const created: TaskItem = { id: 'demo-' + Date.now(), ...newTaskData };
        const updated = [created, ...tasks];
        setTasks(updated);
        localStorage.setItem('syncflow_demo_tasks', JSON.stringify(updated));
      }
    }

    setIsModalOpen(false);
  };

  // Filter & Search logic
  const filteredTasks = tasks
    .filter((task) => {
      // Search filter
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(q) ||
        (task.description && task.description.toLowerCase().includes(q)) ||
        (task.category && task.category.toLowerCase().includes(q)) ||
        (task.collaboratorEmails && task.collaboratorEmails.toLowerCase().includes(q));

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !task.completed) ||
        (statusFilter === 'completed' && task.completed);

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      // Category filter
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'priority') {
        const order: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = order[b.priority] - order[a.priority];
      } else if (sortBy === 'dueDate') {
        comparison = (a.dueDate || '').localeCompare(b.dueDate || '');
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else {
        // createdAt
        comparison = (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const categories = Array.from(new Set(tasks.map((t) => t.category || 'General')));

  const priorityBadges: Record<Priority, { label: string; bg: string; text: string }> = {
    urgent: { label: t('priorityUrgent'), bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' },
    high: { label: t('priorityHigh'), bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
    medium: { label: t('priorityMedium'), bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
    low: { label: t('priorityLow'), bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
  };

  return (
    <div className="space-y-6">
      {/* Sign-in Callout if Demo Mode */}
      {!user && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Unlock Real-time Cross-Platform Cloud Sync
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sign in with Google to isolate and safely persist your personal tasks in Firebase Firestore.
              </p>
            </div>
          </div>
          <button
            onClick={() => signInWithGoogle()}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all shrink-0"
          >
            {t('signInWithGoogle')}
          </button>
        </div>
      )}

      {/* Quick Add Bar & New Task Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleQuickAdd} className="flex-1 relative">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Type a task and hit Enter, or click detailed add..."
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-opacity"
            title="Quick Add"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <button
          onClick={() => openEditModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addNewTask')}</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
            {(['all', 'active', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {s === 'all' ? t('filterAll') : s === 'active' ? t('filterActive') : t('filterCompleted')}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">{t('priorityUrgent')}</option>
              <option value="high">{t('priorityHigh')}</option>
              <option value="medium">{t('priorityMedium')}</option>
              <option value="low">{t('priorityLow')}</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="createdAt">Date Created</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs font-semibold"
              title="Toggle Sort Direction"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none text-xs">
            <span className="text-slate-400 text-[11px] shrink-0">Tags:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task List Items */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Synchronizing your isolated tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {searchQuery ? 'No matching tasks found' : 'All caught up!'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try changing your search terms or filters.'
              : 'Add a new task above or record a voice memo to synthesize automated tasks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const badge = priorityBadges[task.priority] || priorityBadges.medium;
            return (
              <div
                key={task.id}
                className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all duration-200 shadow-xs hover:shadow-md ${
                  task.completed
                    ? 'border-slate-200/60 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => handleToggleCompleted(task)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                    title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400" />
                    )}
                  </button>

                  {/* Task Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4
                        className={`text-sm font-semibold tracking-tight break-words ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Priority Tag */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>

                      {/* Category Tag */}
                      {task.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{task.category}</span>
                        </span>
                      )}
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 break-words">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata bar */}
                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          <span>{task.dueDate}</span>
                        </span>
                      )}

                      {task.estimatedMinutes && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{task.estimatedMinutes}m est</span>
                        </span>
                      )}

                      {task.collaboratorEmails && (
                        <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                          <Users className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{task.collaboratorEmails}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {onSelectForVideo && (
                      <button
                        onClick={() => onSelectForVideo(task)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 transition-colors"
                        title="Create Voice & Video from task"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                      title="Edit Task"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingTask ? 'Edit Task' : t('addNewTask')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Design responsive UI components"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Voice Transcript
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Additional context, sub-items, or memo details..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="low">{t('priorityLow')}</option>
                    <option value="medium">{t('priorityMedium')}</option>
                    <option value="high">{t('priorityHigh')}</option>
                    <option value="urgent">{t('priorityUrgent')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category / Tag
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Work, Creative, Personal..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={720}
                    step={5}
                    value={formEstimatedMinutes}
                    onChange={(e) => setFormEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Team Collaborators (Emails)
                </label>
                <div className="relative">
                  <Share2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={500}
                    value={formCollaborators}
                    onChange={(e) => setFormCollaborators(e.target.value)}
                    placeholder="e.g. sarah@team.com, david@company.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Shared members will be granted collaborative project visibility.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
