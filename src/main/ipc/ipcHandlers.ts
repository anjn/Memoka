/**
 * @file IPC handlers
 * @AI-CONTEXT This file contains the IPC handlers for communication between main and renderer processes
 */

import { ipcMain, dialog } from 'electron';
import { NoteRepository } from '../database/repositories/NoteRepository';
import { ImportExportService } from '../services/ImportExportService';
import { Note } from '../../renderer/types/models';

const noteRepository = new NoteRepository();
const importExportService = new ImportExportService();

export function setupIpcHandlers(): void {
  // ノート関連のハンドラー
  ipcMain.handle('notes:getAll', async () => {
    try {
      return noteRepository.findAll();
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  });
  
  ipcMain.handle('notes:getById', async (_, id: string) => {
    try {
      return noteRepository.findById(id);
    } catch (error) {
      console.error(`Error getting note by id ${id}:`, error);
      throw error;
    }
  });
  
  ipcMain.handle('notes:create', async (_, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      return noteRepository.create(note);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  });
  
  ipcMain.handle('notes:update', async (_, id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      return noteRepository.update(id, updates);
    } catch (error) {
      console.error(`Error updating note ${id}:`, error);
      throw error;
    }
  });
  
  ipcMain.handle('notes:delete', async (_, id: string) => {
    try {
      return noteRepository.delete(id);
    } catch (error) {
      console.error(`Error deleting note ${id}:`, error);
      throw error;
    }
  });
  
  // インポート/エクスポート関連のハンドラー
  ipcMain.handle('notes:export', async () => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Notes',
        defaultPath: 'memoka-notes.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });
      
      if (!filePath) return false;
      
      await importExportService.exportNotes(filePath);
      return true;
    } catch (error) {
      console.error('Error exporting notes:', error);
      throw error;
    }
  });
  
  ipcMain.handle('notes:import', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: 'Import Notes',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
      });
      
      if (filePaths.length === 0) return [];
      
      const importedNotes = await importExportService.importNotes(filePaths[0]);
      return importedNotes;
    } catch (error) {
      console.error('Error importing notes:', error);
      throw error;
    }
  });
  
  ipcMain.handle('notes:exportAsMarkdown', async (_, note: Note) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Note as Markdown',
        defaultPath: `${note.title}.md`,
        filters: [{ name: 'Markdown Files', extensions: ['md'] }],
      });
      
      if (!filePath) return false;
      
      await importExportService.exportNoteAsMarkdown(note, filePath);
      return true;
    } catch (error) {
      console.error('Error exporting note as markdown:', error);
      throw error;
    }
  });
}
