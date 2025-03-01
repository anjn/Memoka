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
      console.log('ipcHandlers: Getting all notes');
      const notes = noteRepository.findAll();
      console.log('ipcHandlers: Got notes:', notes);
      return notes;
    } catch (error) {
      console.error('Error getting all notes:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  });
  
  ipcMain.handle('notes:getById', async (_, id: string) => {
    try {
      console.log(`ipcHandlers: Getting note by id ${id}`);
      const note = noteRepository.findById(id);
      console.log('ipcHandlers: Got note:', note);
      return note;
    } catch (error) {
      console.error(`Error getting note by id ${id}:`, error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  });
  
  ipcMain.handle('notes:create', async (_, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('ipcHandlers: Creating note:', note);
      
      // Validate note object
      if (!note) {
        throw new Error('Note object is undefined or null');
      }
      
      if (!note.title) {
        throw new Error('Note title is required');
      }
      
      if (note.content === undefined) {
        note.content = '';
      }
      
      if (!note.tags) {
        note.tags = [];
      }
      
      console.log('ipcHandlers: Validated note:', note);
      
      const createdNote = noteRepository.create(note);
      console.log('ipcHandlers: Note created:', createdNote);
      return createdNote;
    } catch (error) {
      console.error('Error creating note:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
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
  
  ipcMain.handle('notes:importMarkdown', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: 'Import Markdown',
        filters: [{ name: 'Markdown Files', extensions: ['md'] }],
        properties: ['openFile', 'multiSelections'],
      });
      
      if (filePaths.length === 0) return [];
      
      const importedNotes: Note[] = [];
      const fs = require('fs');
      const path = require('path');
      const { markdownToHtml } = require('../../renderer/utils/markdownUtils');
      
      for (const filePath of filePaths) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath, '.md');
        
        // Markdownをリッチテキストに変換
        const htmlContent = markdownToHtml(content);
        
        const note = noteRepository.create({
          title: fileName,
          content: htmlContent,
          tags: ['imported'],
        });
        
        importedNotes.push(note);
      }
      
      return importedNotes;
    } catch (error) {
      console.error('Error importing markdown:', error);
      throw error;
    }
  });
  
  ipcMain.handle('notes:uploadImage', async () => {
    try {
      const { app } = require('electron');
      const fs = require('fs');
      const path = require('path');
      
      const { filePaths } = await dialog.showOpenDialog({
        title: 'Upload Image',
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg'] }],
        properties: ['openFile'],
      });
      
      if (filePaths.length === 0) return null;
      
      const filePath = filePaths[0];
      const fileName = path.basename(filePath);
      
      // アプリケーションのデータディレクトリに画像をコピー
      const imagesDir = path.join(app.getPath('userData'), 'images');
      await fs.promises.mkdir(imagesDir, { recursive: true });
      
      const destPath = path.join(imagesDir, fileName);
      await fs.promises.copyFile(filePath, destPath);
      
      return {
        filePath: `file://${destPath}`,
        fileName,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  });
}
