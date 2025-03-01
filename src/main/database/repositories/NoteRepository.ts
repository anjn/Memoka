/**
 * @file Note repository class
 * @AI-CONTEXT This file contains the repository class for note operations
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../Database';
import { Note } from '../../../renderer/types/models';

export class NoteRepository {
  private db = DatabaseManager.getInstance().getDb();

  public findAll(): Note[] {
    try {
      console.log('NoteRepository.findAll: Preparing SQL statement');
      const stmt = this.db.prepare(`
        SELECT id, title, content, created_at as createdAt, updated_at as updatedAt
        FROM notes
        ORDER BY updated_at DESC
      `);
      
      console.log('NoteRepository.findAll: Executing SQL statement');
      const notes = stmt.all() as Omit<Note, 'tags'>[];
      console.log(`NoteRepository.findAll: Found ${notes.length} notes`);
      
      // タグを取得
      console.log('NoteRepository.findAll: Getting tags for notes');
      const notesWithTags = notes.map(note => {
        const tags = this.getTagsForNote(note.id);
        return { ...note, tags };
      });
      
      console.log('NoteRepository.findAll: Returning notes with tags');
      return notesWithTags;
    } catch (error) {
      console.error('Error in NoteRepository.findAll:', error);
      throw error;
    }
  }

  public findById(id: string): Note | null {
    const stmt = this.db.prepare(`
      SELECT id, title, content, created_at as createdAt, updated_at as updatedAt
      FROM notes
      WHERE id = ?
    `);
    
    const note = stmt.get(id) as Omit<Note, 'tags'> | undefined;
    
    if (!note) return null;
    
    const tags = this.getTagsForNote(id);
    return { ...note, tags };
  }

  public create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
    try {
      console.log('NoteRepository.create: Starting note creation');
      const id = uuidv4();
      const now = Date.now();
      
      console.log('NoteRepository.create: Preparing SQL statement');
      const stmt = this.db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      console.log('NoteRepository.create: Executing SQL statement with params:', {
        id,
        title: note.title,
        contentLength: note.content?.length || 0,
        now
      });
      
      stmt.run(id, note.title, note.content || '', now, now);
      
      // タグを保存
      console.log('NoteRepository.create: Saving tags');
      this.saveTags(id, note.tags);
      
      console.log('NoteRepository.create: Note created successfully');
      return {
        id,
        title: note.title,
        content: note.content || '',
        createdAt: new Date(now),
        updatedAt: new Date(now),
        tags: note.tags
      };
    } catch (error) {
      console.error('Error in NoteRepository.create:', error);
      throw error;
    }
  }

  public update(id: string, note: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Note | null {
    const existingNote = this.findById(id);
    if (!existingNote) return null;
    
    const now = Date.now();
    const updatedNote = {
      ...existingNote,
      ...note,
      updatedAt: new Date(now)
    };
    
    const stmt = this.db.prepare(`
      UPDATE notes
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(updatedNote.title, updatedNote.content, now, id);
    
    // タグを更新
    if (note.tags) {
      this.saveTags(id, note.tags);
    }
    
    return updatedNote;
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private getTagsForNote(noteId: string): string[] {
    const stmt = this.db.prepare(`
      SELECT t.name
      FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `);
    
    const tags = stmt.all(noteId) as { name: string }[];
    return tags.map(tag => tag.name);
  }

  private saveTags(noteId: string, tags: string[]): void {
    try {
      console.log(`NoteRepository.saveTags: Starting to save tags for note ${noteId}`);
      console.log(`NoteRepository.saveTags: Tags to save: ${JSON.stringify(tags)}`);
      
      console.log('NoteRepository.saveTags: Deleting existing note-tag relationships');
      const deleteStmt = this.db.prepare('DELETE FROM note_tags WHERE note_id = ?');
      deleteStmt.run(noteId);
      
      if (tags.length === 0) {
        console.log('NoteRepository.saveTags: No tags to save, returning');
        return;
      }
      
      console.log('NoteRepository.saveTags: Preparing SQL statements for tag insertion');
      const insertTagStmt = this.db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
      const insertNoteTagStmt = this.db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)');
      
      console.log('NoteRepository.saveTags: Creating transaction for tag insertion');
      const transaction = this.db.transaction((tagsToSave: string[]) => {
        console.log(`NoteRepository.saveTags: Processing ${tagsToSave.length} tags in transaction`);
        for (const tag of tagsToSave) {
          const tagId = uuidv4();
          console.log(`NoteRepository.saveTags: Inserting tag "${tag}" with ID ${tagId}`);
          insertTagStmt.run(tagId, tag);
          
          // タグIDを取得（既存のタグの場合は既存のIDを取得）
          console.log(`NoteRepository.saveTags: Getting tag ID for "${tag}"`);
          const getTagIdStmt = this.db.prepare('SELECT id FROM tags WHERE name = ?');
          const result = getTagIdStmt.get(tag) as { id: string };
          
          if (!result) {
            console.error(`NoteRepository.saveTags: Failed to get tag ID for "${tag}"`);
            throw new Error(`Failed to get tag ID for "${tag}"`);
          }
          
          console.log(`NoteRepository.saveTags: Linking note ${noteId} with tag ${result.id}`);
          insertNoteTagStmt.run(noteId, result.id);
        }
        console.log('NoteRepository.saveTags: Transaction completed successfully');
      });
      
      console.log('NoteRepository.saveTags: Executing transaction');
      transaction(tags);
      console.log('NoteRepository.saveTags: Tags saved successfully');
    } catch (error) {
      console.error('Error in NoteRepository.saveTags:', error);
      throw error;
    }
  }
}
