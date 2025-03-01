/**
 * @file Note service
 * @AI-CONTEXT This file contains the service for note operations in the renderer process
 */

import { Note } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

// Check if running in Electron environment
const isElectron = () => {
  return window && window.ipcRenderer !== undefined;
};

// Mock data for browser environment
const mockNotes: Note[] = [
  {
    id: 'test-note-1',
    title: 'テストノート1',
    content: '<p>これはテストノートです。</p>',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['テスト'],
  },
  {
    id: 'test-note-2',
    title: 'テストノート2',
    content: '<p>これは2つ目のテストノートです。</p>',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['テスト', 'サンプル'],
  },
];

export class NoteService {
  public static async getAllNotes(): Promise<Note[]> {
    try {
      console.log('NoteService: Getting all notes');
      
      if (isElectron()) {
        // Electron environment
        const notes = await window.ipcRenderer.invoke('notes:getAll');
        console.log('NoteService: Got notes from Electron:', notes);
        return notes;
      } else {
        // Browser environment - return mock data
        console.log('NoteService: Running in browser, returning mock notes');
        return mockNotes;
      }
    } catch (error) {
      console.error('NoteService: Error getting all notes:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Return mock data in case of error
      console.log('NoteService: Returning mock notes due to error');
      return mockNotes;
    }
  }
  
  public static async getNoteById(id: string): Promise<Note | null> {
    try {
      console.log(`NoteService: Getting note by id ${id}`);
      
      if (isElectron()) {
        // Electron environment
        const note = await window.ipcRenderer.invoke('notes:getById', id);
        console.log('NoteService: Got note from Electron:', note);
        return note;
      } else {
        // Browser environment - return mock data
        console.log('NoteService: Running in browser, returning mock note');
        const note = mockNotes.find(n => n.id === id) || null;
        return note;
      }
    } catch (error) {
      console.error(`NoteService: Error getting note by id ${id}:`, error);
      
      // Return mock data in case of error
      const note = mockNotes.find(n => n.id === id) || null;
      return note;
    }
  }
  
  public static async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    try {
      console.log('NoteService: Creating note:', note);
      
      if (isElectron()) {
        // Electron environment
        const createdNote = await window.ipcRenderer.invoke('notes:create', note);
        console.log('NoteService: Note created in Electron:', createdNote);
        return createdNote;
      } else {
        // Browser environment - create mock note
        console.log('NoteService: Running in browser, creating mock note');
        const now = new Date();
        const newNote: Note = {
          id: uuidv4(),
          title: note.title,
          content: note.content || '',
          createdAt: now,
          updatedAt: now,
          tags: note.tags || [],
        };
        
        mockNotes.push(newNote);
        return newNote;
      }
    } catch (error) {
      console.error('NoteService: Error creating note:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Create mock note in case of error
      console.log('NoteService: Creating mock note due to error');
      const now = new Date();
      const newNote: Note = {
        id: uuidv4(),
        title: note.title,
        content: note.content || '',
        createdAt: now,
        updatedAt: now,
        tags: note.tags || [],
      };
      
      mockNotes.push(newNote);
      return newNote;
    }
  }
  
  public static async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Note | null> {
    try {
      console.log(`NoteService: Updating note ${id}:`, updates);
      
      if (isElectron()) {
        // Electron environment
        const updatedNote = await window.ipcRenderer.invoke('notes:update', id, updates);
        console.log('NoteService: Note updated in Electron:', updatedNote);
        return updatedNote;
      } else {
        // Browser environment - update mock note
        console.log('NoteService: Running in browser, updating mock note');
        const noteIndex = mockNotes.findIndex(n => n.id === id);
        if (noteIndex === -1) return null;
        
        const updatedNote: Note = {
          ...mockNotes[noteIndex],
          ...updates,
          updatedAt: new Date(),
        };
        
        mockNotes[noteIndex] = updatedNote;
        return updatedNote;
      }
    } catch (error) {
      console.error(`NoteService: Error updating note ${id}:`, error);
      return null;
    }
  }
  
  public static async deleteNote(id: string): Promise<boolean> {
    try {
      console.log(`NoteService: Deleting note ${id}`);
      
      if (isElectron()) {
        // Electron environment
        const result = await window.ipcRenderer.invoke('notes:delete', id);
        console.log(`NoteService: Note deleted in Electron: ${result}`);
        return result;
      } else {
        // Browser environment - delete mock note
        console.log('NoteService: Running in browser, deleting mock note');
        const noteIndex = mockNotes.findIndex(n => n.id === id);
        if (noteIndex === -1) return false;
        
        mockNotes.splice(noteIndex, 1);
        return true;
      }
    } catch (error) {
      console.error(`NoteService: Error deleting note ${id}:`, error);
      return false;
    }
  }
  
  public static async exportNotes(): Promise<boolean> {
    try {
      console.log('NoteService: Exporting notes');
      
      if (isElectron()) {
        // Electron environment
        const result = await window.ipcRenderer.invoke('notes:export');
        console.log(`NoteService: Notes exported in Electron: ${result}`);
        return result;
      } else {
        // Browser environment - mock export
        console.log('NoteService: Running in browser, mocking export');
        console.log('Mock export data:', JSON.stringify(mockNotes, null, 2));
        return true;
      }
    } catch (error) {
      console.error('NoteService: Error exporting notes:', error);
      return false;
    }
  }
  
  public static async importNotes(): Promise<Note[]> {
    try {
      console.log('NoteService: Importing notes');
      
      if (isElectron()) {
        // Electron environment
        const notes = await window.ipcRenderer.invoke('notes:import');
        console.log('NoteService: Notes imported in Electron:', notes);
        return notes;
      } else {
        // Browser environment - mock import
        console.log('NoteService: Running in browser, mocking import');
        return mockNotes;
      }
    } catch (error) {
      console.error('NoteService: Error importing notes:', error);
      return [];
    }
  }
  
  public static async exportNoteAsMarkdown(note: Note): Promise<boolean> {
    try {
      console.log('NoteService: Exporting note as markdown:', note);
      
      if (isElectron()) {
        // Electron environment
        const result = await window.ipcRenderer.invoke('notes:exportAsMarkdown', note);
        console.log(`NoteService: Note exported as markdown in Electron: ${result}`);
        return result;
      } else {
        // Browser environment - mock export
        console.log('NoteService: Running in browser, mocking markdown export');
        console.log('Mock markdown export:', note.content);
        return true;
      }
    } catch (error) {
      console.error('NoteService: Error exporting note as markdown:', error);
      return false;
    }
  }
  
  public static async importMarkdown(): Promise<Note[]> {
    try {
      console.log('NoteService: Importing markdown');
      
      if (isElectron()) {
        // Electron environment
        const notes = await window.ipcRenderer.invoke('notes:importMarkdown');
        console.log('NoteService: Markdown imported in Electron:', notes);
        return notes;
      } else {
        // Browser environment - mock import
        console.log('NoteService: Running in browser, mocking markdown import');
        return mockNotes;
      }
    } catch (error) {
      console.error('NoteService: Error importing markdown:', error);
      return [];
    }
  }
}
