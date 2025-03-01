/**
 * @file Settings store
 * @AI-CONTEXT This file contains the Zustand store for application settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  fontSize: number;
  sidebarWidth: number;
  autoSave: boolean;
}

interface SettingsActions {
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: number) => void;
  setSidebarWidth: (width: number) => void;
  setAutoSave: (autoSave: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  theme: 'light',
  fontSize: 16,
  sidebarWidth: 240,
  autoSave: true,
};

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      setTheme: (theme) => set({ theme }),
      
      setFontSize: (fontSize) => set({ fontSize }),
      
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      
      setAutoSave: (autoSave) => set({ autoSave }),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'memoka-settings',
    }
  )
);
