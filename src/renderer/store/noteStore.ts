/**
 * @file Note store
 * @AI-CONTEXT This file contains the Zustand store for notes
 */

import { create } from 'zustand';
import { Note } from '../types/models';

interface NoteState {
  notes: Note[];
  selectedNoteId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface NoteActions {
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export type NoteStore = NoteState & NoteActions;

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  selectedNoteId: null,
  isLoading: false,
  error: null,
  
  setNotes: (notes) => set({ notes }),
  
  addNote: (note) => set((state) => ({
    notes: [...state.notes, note],
    selectedNoteId: note.id,
  })),
  
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((note) =>
      note.id === id ? { ...note, ...updates } : note
    ),
  })),
  
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((note) => note.id !== id),
    selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
  })),
  
  selectNote: (id) => set({ selectedNoteId: id }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
}));
