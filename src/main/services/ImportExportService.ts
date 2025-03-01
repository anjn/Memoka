/**
 * @file Import/Export service
 * @AI-CONTEXT This file contains the service for importing and exporting notes
 */

import { FileUtils } from '../utils/FileUtils';
import { NoteRepository } from '../database/repositories/NoteRepository';
import { Note } from '../../renderer/types/models';
import path from 'path';

export class ImportExportService {
  private noteRepository = new NoteRepository();
  
  public async exportNotes(exportPath: string): Promise<void> {
    const notes = this.noteRepository.findAll();
    const exportData = JSON.stringify(notes, null, 2);
    await FileUtils.writeFile(exportPath, exportData);
  }
  
  public async importNotes(importPath: string): Promise<Note[]> {
    const importData = await FileUtils.readFile(importPath);
    const notes = JSON.parse(importData) as Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[];
    
    const importedNotes: Note[] = [];
    for (const note of notes) {
      const importedNote = this.noteRepository.create(note);
      importedNotes.push(importedNote);
    }
    
    return importedNotes;
  }
  
  public async exportNoteAsMarkdown(note: Note, exportPath: string): Promise<void> {
    const markdown = this.convertNoteToMarkdown(note);
    await FileUtils.writeFile(exportPath, markdown);
  }
  
  private convertNoteToMarkdown(note: Note): string {
    const header = `# ${note.title}\n\n`;
    const tags = note.tags.length > 0 ? `Tags: ${note.tags.join(', ')}\n\n` : '';
    const content = note.content;
    
    return `${header}${tags}${content}`;
  }
}
