/**
 * @file Note service
 * @AI-CONTEXT This file contains the service for note operations in the renderer process
 */

import { Note } from '../types/models';

export class NoteService {
  public static async getAllNotes(): Promise<Note[]> {
    return window.ipcRenderer.invoke('notes:getAll');
  }
  
  public static async getNoteById(id: string): Promise<Note | null> {
    return window.ipcRenderer.invoke('notes:getById', id);
  }
  
  public static async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    return window.ipcRenderer.invoke('notes:create', note);
  }
  
  public static async updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Note | null> {
    return window.ipcRenderer.invoke('notes:update', id, updates);
  }
  
  public static async deleteNote(id: string): Promise<boolean> {
    return window.ipcRenderer.invoke('notes:delete', id);
  }
  
  public static async exportNotes(): Promise<boolean> {
    return window.ipcRenderer.invoke('notes:export');
  }
  
  public static async importNotes(): Promise<Note[]> {
    return window.ipcRenderer.invoke('notes:import');
  }
  
  public static async exportNoteAsMarkdown(note: Note): Promise<boolean> {
    return window.ipcRenderer.invoke('notes:exportAsMarkdown', note);
  }
  
  public static async importMarkdown(): Promise<Note[]> {
    return window.ipcRenderer.invoke('notes:importMarkdown');
  }
}
