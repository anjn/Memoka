/**
 * @file Database manager class
 * @AI-CONTEXT This file contains the database manager class for SQLite integration
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;

  private constructor() {
    try {
      console.log('DatabaseManager: Initializing database');
      const userDataPath = app.getPath('userData');
      console.log(`DatabaseManager: User data path: ${userDataPath}`);
      
      const dbPath = path.join(userDataPath, 'memoka.db');
      console.log(`DatabaseManager: Database path: ${dbPath}`);
      
      // Check if the directory exists
      if (!fs.existsSync(userDataPath)) {
        console.log(`DatabaseManager: Creating directory: ${userDataPath}`);
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      
      // Check if we have write permissions
      try {
        const testFile = path.join(userDataPath, 'test.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('DatabaseManager: Write permission check passed');
      } catch (error) {
        console.error('DatabaseManager: Write permission check failed:', error);
      }
      
      console.log('DatabaseManager: Creating database connection');
      this.db = new Database(dbPath, { verbose: console.log });
      console.log('DatabaseManager: Database connection created');
      
      this.init();
      console.log('DatabaseManager: Database initialized successfully');
    } catch (error) {
      console.error('DatabaseManager: Error initializing database:', error);
      throw error;
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      console.log('DatabaseManager: Creating new instance');
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private init(): void {
    try {
      console.log('DatabaseManager.init: Creating tables if they do not exist');
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Create tables
      console.log('DatabaseManager.init: Creating tables');
      
      // Use a single transaction for all table creation
      this.db.transaction(() => {
        // Create notes table
        console.log('DatabaseManager.init: Creating notes table');
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          )
        `);
        
        // Create tags table
        console.log('DatabaseManager.init: Creating tags table');
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
          )
        `);
        
        // Create note_tags table
        console.log('DatabaseManager.init: Creating note_tags table');
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS note_tags (
            note_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (note_id, tag_id),
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
          )
        `);
      })();
      
      console.log('DatabaseManager.init: Tables created successfully');
      
      // Insert a test note to verify database functionality
      try {
        const id = 'test-note-' + Date.now();
        const now = Date.now();
        
        console.log('DatabaseManager.init: Creating test note');
        this.db.prepare(`
          INSERT INTO notes (id, title, content, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, 'Test Note', 'This is a test note', now, now);
        
        console.log('DatabaseManager.init: Test note created successfully');
        
        // Verify the test note was created
        const testNote = this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
        console.log('DatabaseManager.init: Test note retrieved:', testNote);
      } catch (error) {
        console.error('Error creating test note:', error);
      }
      
      // Verify tables were created
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      console.log('DatabaseManager.init: Tables created:', tables.map(t => t.name).join(', '));
    } catch (error) {
      console.error('DatabaseManager.init: Error creating tables:', error);
      throw error;
    }
  }

  public getDb(): Database.Database {
    return this.db;
  }

  public close(): void {
    try {
      console.log('DatabaseManager: Closing database connection');
      this.db.close();
      console.log('DatabaseManager: Database connection closed');
    } catch (error) {
      console.error('DatabaseManager: Error closing database:', error);
    }
  }
}
