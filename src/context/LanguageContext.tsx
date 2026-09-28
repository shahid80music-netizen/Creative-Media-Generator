import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';

interface Translations {
  [key: string]: {
    [K in SupportedLanguage]: string;
  };
}

export const translations: Translations = {
  appTitle: {
    en: 'SyncFlow AI',
    es: 'SyncFlow IA',
    fr: 'SyncFlow IA',
    de: 'SyncFlow KI',
    ja: 'SyncFlow AI',
    zh: 'SyncFlow 智能协同',
    ar: 'سينك فلو للذكاء الاصطناعي',
  },
  tagline: {
    en: 'Collaborative To-Do, AI Scheduling & Media Studio',
    es: 'Tareas colaborativas, programación con IA y estudio multimedia',
    fr: 'Tâches collaboratives, planification IA et studio multimédia',
    de: 'Kollaborative To-Dos, KI-Planung & Medienstudio',
    ja: 'コラボレーションTo-Do・AIスケジュール・メディアスタジオ',
    zh: '协同待办、AI智能日程规划与媒体创作工作台',
    ar: 'قائمة مهام تعاونية، جدولة بالذكاء الاصطناعي واستوديو وسائط',
  },
  signInWithGoogle: {
    en: 'Sign in with Google',
    es: 'Iniciar sesión con Google',
    fr: 'Se connecter avec Google',
    de: 'Mit Google anmelden',
    ja: 'Googleでサインイン',
    zh: '使用 Google 登录',
    ar: 'تسجيل الدخول عبر جوجل',
  },
  signOut: {
    en: 'Sign Out',
    es: 'Cerrar sesión',
    fr: 'Se déconnecter',
    de: 'Abmelden',
    ja: 'サインアウト',
    zh: '退出登录',
    ar: 'تسجيل الخروج',
  },
  tasksTab: {
    en: 'Tasks',
    es: 'Tareas',
    fr: 'Tâches',
    de: 'Aufgaben',
    ja: 'タスク',
    zh: '任务管理',
    ar: 'المهام',
  },
  voiceSynthesisTab: {
    en: 'Voice & Video AI',
    es: 'Voz y Video IA',
    fr: 'Voix et Vidéo IA',
    de: 'Sprache & Video KI',
    ja: '音声＆動画AI',
    zh: '语音与视频合成',
    ar: 'الصوت والفيديو الذكي',
  },
  scheduleTab: {
    en: 'Smart Schedule',
    es: 'Horario Inteligente',
    fr: 'Planning Intelligent',
    de: 'Smarter Zeitplan',
    ja: 'スマートスケジュール',
    zh: '智能日程优化',
    ar: 'الجدولة الذكية',
  },
  calendarTab: {
    en: 'Calendar & Teams',
    es: 'Calendario y Equipos',
    fr: 'Calendrier & Équipes',
    de: 'Kalender & Teams',
    ja: 'カレンダー＆共有',
    zh: '日历与协同',
    ar: 'التقويم والفرق',
  },
  musicStudioTab: {
    en: 'Music Studio',
    es: 'Estudio de Música',
    fr: 'Studio de Musique',
    de: 'Musikstudio',
    ja: '音楽スタジオ',
    zh: '音乐合成编曲',
    ar: 'استوديو الموسيقى',
  },
  mediaEditorTab: {
    en: 'Canva Media Editor',
    es: 'Editor Multimedia',
    fr: 'Éditeur Multimédia',
    de: 'Medien-Editor',
    ja: 'メディアエディター',
    zh: '画布媒体编辑',
    ar: 'محرر الوسائط',
  },
  dashboardTab: {
    en: 'Dashboard & Security',
    es: 'Panel y Seguridad',
    fr: 'Tableau de bord',
    de: 'Dashboard & Sicherheit',
    ja: 'ダッシュボード',
    zh: '仪表盘与安全',
    ar: 'لوحة التحكم والأمان',
  },
  addNewTask: {
    en: 'Add New Task',
    es: 'Añadir nueva tarea',
    fr: 'Ajouter une tâche',
    de: 'Neue Aufgabe hinzufügen',
    ja: '新しいタスクを追加',
    zh: '添加新任务',
    ar: 'إضافة مهمة جديدة',
  },
  searchPlaceholder: {
    en: 'Search tasks, tags, or notes...',
    es: 'Buscar tareas, etiquetas o notas...',
    fr: 'Rechercher des tâches, tags ou notes...',
    de: 'Aufgaben, Tags oder Notizen suchen...',
    ja: 'タスク、タグ、メモを検索...',
    zh: '搜索任务、标签或备忘...',
    ar: 'البحث في المهام والعلامات والملاحظات...',
  },
  filterAll: {
    en: 'All',
    es: 'Todas',
    fr: 'Toutes',
    de: 'Alle',
    ja: 'すべて',
    zh: '全部',
    ar: 'الكل',
  },
  filterActive: {
    en: 'Active',
    es: 'Activas',
    fr: 'Actives',
    de: 'Aktiv',
    ja: '進行中',
    zh: '未完成',
    ar: 'النشطة',
  },
  filterCompleted: {
    en: 'Completed',
    es: 'Completadas',
    fr: 'Terminées',
    de: 'Erledigt',
    ja: '完了済み',
    zh: '已完成',
    ar: 'المكتملة',
  },
  priorityLow: {
    en: 'Low',
    es: 'Baja',
    fr: 'Basse',
    de: 'Niedrig',
    ja: '低',
    zh: '低',
    ar: 'منخفضة',
  },
  priorityMedium: {
    en: 'Medium',
    es: 'Media',
    fr: 'Moyenne',
    de: 'Mittel',
    ja: '中',
    zh: '中',
    ar: 'متوسطة',
  },
  priorityHigh: {
    en: 'High',
    es: 'Alta',
    fr: 'Haute',
    de: 'Hoch',
    ja: '高',
    zh: '高',
    ar: 'عالية',
  },
  priorityUrgent: {
    en: 'Urgent',
    es: 'Urgente',
    fr: 'Urgent',
    de: 'Dringend',
    ja: '緊急',
    zh: '紧急',
    ar: 'عاجلة',
  },
  exportCSV: {
    en: 'Export CSV',
    es: 'Exportar CSV',
    fr: 'Exporter CSV',
    de: 'CSV exportieren',
    ja: 'CSVエクスポート',
    zh: '导出 CSV',
    ar: 'تصدير CSV',
  },
  exportPDF: {
    en: 'Export PDF / Print',
    es: 'Exportar PDF / Imprimir',
    fr: 'Exporter PDF / Imprimer',
    de: 'PDF exportieren / Drucken',
    ja: 'PDF出力・印刷',
    zh: '导出 PDF / 打印',
    ar: 'تصدير PDF / طباعة',
  },
  backupEncrypted: {
    en: 'Encrypted Cloud Backup',
    es: 'Copia de seguridad cifrada',
    fr: 'Sauvegarde chiffrée',
    de: 'Verschlüsseltes Backup',
    ja: 'エンドツーエンド暗号化バックアップ',
    zh: '端到端加密备份',
    ar: 'نسخ احتياطي مشفر بالكامل',
  },
  realtimeConnected: {
    en: 'Real-time Synced',
    es: 'Sincronizado en tiempo real',
    fr: 'Synchronisé en direct',
    de: 'Echtzeit-Synchronisiert',
    ja: 'リアルタイム同期中',
    zh: '已实时同步',
    ar: 'مزامنة فورية',
  },
  offlineMode: {
    en: 'Offline Cache Active',
    es: 'Caché sin conexión activo',
    fr: 'Cache hors-ligne actif',
    de: 'Offline-Cache aktiv',
    ja: 'オフラインキャッシュ稼働中',
    zh: '离线存储就绪',
    ar: 'الوضع دون اتصال نشط',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof typeof translations) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations[key]?.en || String(key),
  isRTL: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('syncflow_lang') as SupportedLanguage;
    if (saved && ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar'].includes(saved)) {
      return saved;
    }
    const nav = navigator.language.slice(0, 2);
    if (['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar'].includes(nav)) {
      return nav as SupportedLanguage;
    }
    return 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('syncflow_lang', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const t = (key: keyof typeof translations): string => {
    const item = translations[key];
    if (!item) return String(key);
    return item[language] || item.en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
