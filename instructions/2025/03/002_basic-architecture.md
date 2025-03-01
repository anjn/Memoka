# M2: 基本アーキテクチャ実装の指示

## 背景

Memoka（メモカ）プロジェクトのマイルストーンM2「基本アーキテクチャ実装」を達成するための指示です。マイルストーンM1では、プロジェクトの基本構造を確立し、開発環境を整備しました。M2では、アプリケーションの基本的な機能を実装し、データ管理の基盤を構築します。

## 目標

アプリケーションの基本アーキテクチャを実装し、データ管理の基盤を構築します。具体的には以下の成果物を作成します：

1. SQLiteデータベースの統合
2. 基本的なファイル操作機能
3. アプリケーションの状態管理の拡張
4. コンポーネント間の通信システム
5. 基本的なUIフレームワークの統合

## 技術スタック

- **データベース**: SQLite（better-sqlite3）
- **ファイル操作**: Node.js fs/promises API
- **状態管理**: Zustand（既に導入済み）
- **UI**: Material UI（既に導入済み）
- **プロセス間通信**: Electron IPC

## 手順

### 1. SQLiteデータベースの統合

1. better-sqlite3パッケージをインストールします。

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

2. データベース接続を管理するクラスを作成します。

```typescript
// src/main/database/Database.ts
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;

  private constructor() {
    const dbPath = path.join(app.getPath('userData'), 'memoka.db');
    this.db = new Database(dbPath);
    this.init();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private init(): void {
    // テーブルの作成
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `);
  }

  public getDb(): Database.Database {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }
}
```

3. リポジトリクラスを作成して、データアクセスを抽象化します。

```typescript
// src/main/database/repositories/NoteRepository.ts
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../Database';
import { Note } from '@/renderer/types/models';

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
```

### 2. 基本的なファイル操作機能

1. ファイル操作を行うユーティリティクラスを作成します。

```typescript
// src/main/utils/FileUtils.ts
import { promises as fs } from 'fs';
import path from 'path';
import { app } from 'electron';

export class FileUtils {
  private static userDataPath = app.getPath('userData');
  
  public static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }
  
  public static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // ディレクトリが存在しない場合は作成
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }
  
  public static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
  
  public static async listFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
  
  public static getAppDataPath(subPath: string = ''): string {
    return path.join(FileUtils.userDataPath, subPath);
  }
}
```

2. ファイルのインポート/エクスポート機能を実装します。

```typescript
// src/main/services/ImportExportService.ts
import { FileUtils } from '../utils/FileUtils';
import { NoteRepository } from '../database/repositories/NoteRepository';
import { Note } from '@/renderer/types/models';
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
```

### 3. アプリケーションの状態管理の拡張

1. Zustandストアを拡張して、ノートの管理機能を追加します。

```typescript
// src/renderer/store/noteStore.ts
import { create } from 'zustand';
import { Note } from '@/renderer/types/models';

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
```

2. アプリケーション設定を管理するストアを作成します。

```typescript
// src/renderer/store/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  fontSize: number;
  sidebarWidth: number;
  autoSave: boolean;
}

interface SettingsActions {
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: number) => void;
  setSidebarWidth: (width: number) => void;
  setAutoSave: (autoSave: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  theme: 'light',
  fontSize: 16,
  sidebarWidth: 240,
  autoSave: true,
};

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      setTheme: (theme) => set({ theme }),
      
      setFontSize: (fontSize) => set({ fontSize }),
      
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      
      setAutoSave: (autoSave) => set({ autoSave }),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'memoka-settings',
    }
  )
);
```

### 4. コンポーネント間の通信システム

1. Electron IPCを使用して、メインプロセスとレンダラープロセス間の通信を実装します。

```typescript
// src/main/ipc/ipcHandlers.ts
import { ipcMain, dialog } from 'electron';
import { NoteRepository } from '../database/repositories/NoteRepository';
import { ImportExportService } from '../services/ImportExportService';
import { Note } from '@/renderer/types/models';

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
```

2. レンダラープロセス側でIPCを使用するためのサービスを作成します。

```typescript
// src/renderer/services/NoteService.ts
import { Note } from '@/renderer/types/models';

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
}
```

3. preload.tsファイルを更新して、IPCを公開します。

```typescript
// src/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => listener(...args));
    return () => ipcRenderer.removeListener(channel, listener);
  },
  once: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (event, ...args) => listener(...args));
  },
});
```

### 5. 基本的なUIフレームワークの統合

1. Material UIのテーマを設定します。

```typescript
// src/renderer/styles/theme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';

export const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
};

export const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
};

export const getTheme = (mode: 'light' | 'dark') => {
  return createTheme(mode === 'light' ? lightTheme : darkTheme);
};
```

2. テーマプロバイダーを作成します。

```typescript
// src/renderer/components/ThemeProvider.tsx
import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from '@/renderer/styles/theme';
import { useSettingsStore } from '@/renderer/store/settingsStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useSettingsStore((state) => state.theme);
  const muiTheme = React.useMemo(() => getTheme(theme), [theme]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
```

3. アプリケーションのレイアウトを更新します。

```typescript
// src/renderer/components/Layout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { ThemeProvider } from './ThemeProvider';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const sidebarWidth = useSettingsStore((state) => state.sidebarWidth);

  return (
    <ThemeProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <Sidebar width={sidebarWidth} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              overflow: 'auto',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
```

## 評価基準

実装が完了したら、以下の評価基準を満たしているか確認してください：

1. SQLiteデータベースが正常に動作し、ノートの保存と取得ができる
2. ファイルのインポート/エクスポート機能が正常に動作する
3. Zustandを使用した状態管理が適切に実装されている
4. Electron IPCを使用したプロセス間通信が正常に動作する
5. Material UIのテーマが適切に設定され、ライト/ダークモードの切り替えができる

## 次のステップ

このマイルストーンが完了したら、次のマイルストーンM3「エディタ機能実装」に進みます。M3では以下を実装します：

1. リッチテキストエディタの統合
2. マークダウンサポート
3. シンタックスハイライト
4. 画像の挿入と管理
5. 自動保存機能

## 注意事項

- データベースの設計は将来の拡張性を考慮して行ってください
- ファイル操作は非同期で行い、UIをブロックしないようにしてください
- エラーハンドリングを適切に実装し、ユーザーに分かりやすいエラーメッセージを表示してください
- **重要**: 以下の2種類の記録を必ず `history/YYYY/MM/連番_概要.md` 形式でhistoryディレクトリに残してください：
  1. 実装内容と結果の記録
  2. ユーザーからの指示内容の記録
  これらの記録は次の生成AIが文脈を理解するために不可欠です
- 作業完了時には、historyファイルに次のマイルストーンの指示ファイルへのパスを記載してください
- 次のマイルストーンの指示ファイルには、historyへの記録の重要性を必ず記載してください

## 完了報告

タスクが完了したら、以下の情報を含む完了報告を作成し、`instructions/2025/03/003_editor-implementation.md`ファイルに次のマイルストーンの指示を記載してください：

1. 実装した機能の概要
2. 直面した課題と解決策
3. 次のマイルストーンに向けた提案
4. スクリーンショットまたはデモ（可能であれば）
