/**
 * @file Store type definitions
 * @AI-CONTEXT This file contains type definitions for the Zustand store
 */

import { Note } from './models';

/**
 * Application state interface
 */
export interface AppState {
  notes: Note[];
  selectedNoteId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Application actions interface
 */
export interface AppActions {
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Complete app store type
 */
export type AppStore = AppState & AppActions;
