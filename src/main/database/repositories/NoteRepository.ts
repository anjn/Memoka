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
    const stmt = this.db.prepare(`
      SELECT id, title, content, created_at as createdAt, updated_at as updatedAt
      FROM notes
      ORDER BY updated_at DESC
    `);
    
    const notes = stmt.all() as Omit<Note, 'tags'>[];
    
    // タグを取得
    return notes.map(note => {
      const tags = this.getTagsForNote(note.id);
      return { ...note, tags };
    });
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
    const id = uuidv4();
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO notes (id, title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, note.title, note.content, now, now);
    
    // タグを保存
    this.saveTags(id, note.tags);
    
    return {
      id,
      title: note.title,
      content: note.content,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      tags: note.tags
    };
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
    const deleteStmt = this.db.prepare('DELETE FROM note_tags WHERE note_id = ?');
    deleteStmt.run(noteId);
    
    if (tags.length === 0) return;
    
    const insertTagStmt = this.db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
    const insertNoteTagStmt = this.db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)');
    
    const transaction = this.db.transaction((tags: string[]) => {
      for (const tag of tags) {
        const tagId = uuidv4();
        insertTagStmt.run(tagId, tag);
        
        // タグIDを取得（既存のタグの場合は既存のIDを取得）
        const getTagIdStmt = this.db.prepare('SELECT id FROM tags WHERE name = ?');
        const result = getTagIdStmt.get(tag) as { id: string };
        
        insertNoteTagStmt.run(noteId, result.id);
      }
    });
    
    transaction(tags);
  }
}
