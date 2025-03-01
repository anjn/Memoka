/**
 * @file Application store implementation
 * @AI-CONTEXT This file contains the Zustand store implementation for the application
 */

import { create } from 'zustand';
import { AppStore, AppState } from '../types/store';
import { Note } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initial state for the application
 */
const initialState: AppState = {
  notes: [],
  selectedNoteId: null,
  isLoading: false,
  error: null,
};

/**
 * Create the application store
 */
export const useAppStore = create<AppStore>((set) => ({
  ...initialState,

  // Actions
  addNote: (note) => {
    const now = new Date();
    const newNote: Note = {
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      ...note,
    };

    set((state) => ({
      notes: [...state.notes, newNote],
      selectedNoteId: newNote.id,
    }));
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ),
    }));
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    }));
  },

  selectNote: (id) => {
    set({ selectedNoteId: id });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },
}));
