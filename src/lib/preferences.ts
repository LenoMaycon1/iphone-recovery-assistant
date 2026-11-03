import type { ConnectionMode } from '@/lib/usb';

const STORAGE_KEY = 'iphone-recovery-assistant:preferences';

export interface LastDevice {
  label: string;
  mode: ConnectionMode;
  serialNumber: string | null;
  seenAt: string;
}

export interface Preferences {
  autoRefresh: boolean;
  refreshSeconds: number;
  technicianName: string;
  lastDevice: LastDevice | null;
}

export const DEFAULT_PREFERENCES: Preferences = {
  autoRefresh: true,
  refreshSeconds: 5,
  technicianName: '',
  lastDevice: null,
};

export function loadPreferences(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
