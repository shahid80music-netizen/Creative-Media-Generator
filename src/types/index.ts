export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category?: string;
  dueDate?: string; // YYYY-MM-DD or ISO
  estimatedMinutes?: number;
  collaboratorEmails?: string;
  voiceMemoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  email?: string;
  theme?: 'dark' | 'light' | 'system';
  language?: string;
  biometricsEnabled?: boolean;
  updatedAt: string;
}

export interface ScheduleBlock {
  id: string;
  taskId?: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  type: 'focus' | 'break' | 'review' | 'lunch';
  priority?: Priority;
  completed?: boolean;
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ar';

export interface MediaTrackItem {
  id: string;
  type: 'text' | 'subtitles' | 'audio' | 'effect' | 'badge';
  content: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  filter?: string;
}

export interface EncryptedBackupData {
  version: string;
  exportedAt: string;
  iv: string; // Base64
  salt: string; // Base64
  ciphertext: string; // Base64
}
