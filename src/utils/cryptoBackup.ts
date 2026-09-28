import { TaskItem, EncryptedBackupData } from '../types';

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM key from user passphrase using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptUserData(tasks: TaskItem[], passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const rawData = JSON.stringify({
    tasks,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  });

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(rawData)
  );

  const payload: EncryptedBackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertextBuffer),
  };

  return JSON.stringify(payload, null, 2);
}

export async function decryptUserData(backupJson: string, passphrase: string): Promise<TaskItem[]> {
  const payload: EncryptedBackupData = JSON.parse(backupJson);
  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const parsed = JSON.parse(dec.decode(decryptedBuffer));
  return parsed.tasks || [];
}

export function exportToCSV(tasks: TaskItem[]) {
  const headers = ['ID', 'Title', 'Completed', 'Priority', 'Category', 'Due Date', 'Estimated Minutes', 'Collaborators', 'Created At'];
  const rows = tasks.map((t) => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.completed ? 'Yes' : 'No',
    t.priority,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.dueDate || '',
    t.estimatedMinutes || '',
    `"${(t.collaboratorEmails || '').replace(/"/g, '""')}"`,
    t.createdAt,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `syncflow_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToICS(tasks: TaskItem[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SyncFlow AI//To-Do Calendar Sync//EN',
    'CALSCALE:GREGORIAN',
  ];

  tasks.forEach((t) => {
    const dt = t.dueDate ? t.dueDate.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${t.id}@syncflow.ai`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`);
    lines.push(`DTSTART;VALUE=DATE:${dt}`);
    lines.push(`SUMMARY:${t.title}`);
    lines.push(`DESCRIPTION:${(t.description || 'SyncFlow task').replace(/\n/g, '\\n')}`);
    lines.push(`STATUS:${t.completed ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `syncflow_calendar_${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
