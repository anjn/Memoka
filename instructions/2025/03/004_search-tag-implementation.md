# M4: 検索・タグ機能実装の指示

## 背景

Memoka（メモカ）プロジェクトのマイルストーンM4「検索・タグ機能実装」を達成するための指示です。マイルストーンM3では、アプリケーションの中核となるエディタ機能を実装しました。M4では、ノートの検索と整理のための機能を実装します。

## 目標

ノートの検索と整理のための機能を実装します。具体的には以下の成果物を作成します：

1. 全文検索機能
2. タグ管理システム
3. フィルタリング機能
4. 検索結果のハイライト
5. 関連ノートの推奨

## 技術スタック

- **検索エンジン**: MiniSearch
- **UI/UX**: Material-UI (MUI)
- **状態管理**: Zustand
- **データベース**: SQLite (better-sqlite3)
- **テキスト処理**: 正規表現、テキスト解析ユーティリティ

## 手順

### 1. 全文検索機能

1. MiniSearchをインストールします。

```bash
npm install minisearch
```

2. 検索サービスを作成します。

```typescript
// src/renderer/services/SearchService.ts
import MiniSearch from 'minisearch';
import { Note } from '../types/models';

export class SearchService {
  private static miniSearch: MiniSearch<Note> | null = null;
  
  public static initialize(notes: Note[]): void {
    this.miniSearch = new MiniSearch({
      fields: ['title', 'content'],
      storeFields: ['id', 'title', 'content', 'tags', 'createdAt', 'updatedAt'],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true
      }
    });
    
    if (notes.length > 0) {
      this.miniSearch.addAll(notes);
    }
  }
  
  public static addNote(note: Note): void {
    if (!this.miniSearch) return;
    this.miniSearch.add(note);
  }
  
  public static updateNote(note: Note): void {
    if (!this.miniSearch) return;
    this.miniSearch.remove(note);
    this.miniSearch.add(note);
  }
  
  public static removeNote(note: Note): void {
    if (!this.miniSearch) return;
    this.miniSearch.remove(note);
  }
  
  public static search(query: string): Note[] {
    if (!this.miniSearch || !query.trim()) return [];
    return this.miniSearch.search(query) as Note[];
  }
}
```

3. 検索コンポーネントを作成します。

```typescript
// src/renderer/components/Search/SearchBar.tsx
import React, { useState } from 'react';
import { Box, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  
  const handleSearch = () => {
    onSearch(query);
  };
  
  const handleClear = () => {
    setQuery('');
    onSearch('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton onClick={handleClear} edge="end">
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Box>
  );
};

export default SearchBar;
```

4. 検索結果コンポーネントを作成します。

```typescript
// src/renderer/components/Search/SearchResults.tsx
import React from 'react';
import { List, ListItem, ListItemText, Typography, Box, Chip } from '@mui/material';
import { Note } from '../../types/models';
import { formatDate } from '../../utils/dateUtils';

interface SearchResultsProps {
  results: Note[];
  onSelectNote: (id: string) => void;
  searchQuery: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelectNote, searchQuery }) => {
  if (results.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          検索結果がありません
        </Typography>
      </Box>
    );
  }
  
  // 検索クエリに一致するテキストをハイライト
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };
  
  return (
    <List>
      {results.map((note) => (
        <ListItem
          key={note.id}
          button
          onClick={() => onSelectNote(note.id)}
          divider
          sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
        >
          <ListItemText
            primary={highlightText(note.title, searchQuery)}
            secondary={
              <>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(note.updatedAt)}
                </Typography>
                <Typography variant="body2" noWrap>
                  {highlightText(note.content.replace(/<[^>]*>/g, ' '), searchQuery)}
                </Typography>
              </>
            }
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {note.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default SearchResults;
```

5. 日付フォーマットユーティリティを作成します。

```typescript
// src/renderer/utils/dateUtils.ts
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### 2. タグ管理システム

1. タグ関連の型定義を追加します。

```typescript
// src/renderer/types/models.ts に追加
export interface Tag {
  id: string;
  name: string;
  color?: string;
}
```

2. タグストアを作成します。

```typescript
// src/renderer/store/tagStore.ts
import { create } from 'zustand';
import { Tag } from '../types/models';

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
}

interface TagActions {
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export type TagStore = TagState & TagActions;

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  isLoading: false,
  error: null,
  
  setTags: (tags) => set({ tags }),
  
  addTag: (tag) => set((state) => ({
    tags: [...state.tags, tag],
  })),
  
  updateTag: (id, updates) => set((state) => ({
    tags: state.tags.map((tag) =>
      tag.id === id ? { ...tag, ...updates } : tag
    ),
  })),
  
  deleteTag: (id) => set((state) => ({
    tags: state.tags.filter((tag) => tag.id !== id),
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
}));
```

3. タグサービスを作成します。

```typescript
// src/renderer/services/TagService.ts
import { Tag } from '../types/models';

export class TagService {
  public static async getAllTags(): Promise<Tag[]> {
    return window.ipcRenderer.invoke('tags:getAll');
  }
  
  public static async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    return window.ipcRenderer.invoke('tags:create', tag);
  }
  
  public static async updateTag(id: string, updates: Partial<Omit<Tag, 'id'>>): Promise<Tag | null> {
    return window.ipcRenderer.invoke('tags:update', id, updates);
  }
  
  public static async deleteTag(id: string): Promise<boolean> {
    return window.ipcRenderer.invoke('tags:delete', id);
  }
}
```

4. タグ管理コンポーネントを作成します。

```typescript
// src/renderer/components/Tags/TagManager.tsx
import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTagStore } from '../../store/tagStore';
import { TagService } from '../../services/TagService';
import { v4 as uuidv4 } from 'uuid';

const TagManager: React.FC = () => {
  const { tags, addTag, updateTag, deleteTag } = useTagStore();
  const [newTagName, setNewTagName] = useState('');
  const [editTag, setEditTag] = useState<{ id: string; name: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const tag = await TagService.createTag({ name: newTagName.trim() });
      addTag(tag);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };
  
  const handleUpdateTag = async () => {
    if (!editTag || !editTag.name.trim()) return;
    
    try {
      const updatedTag = await TagService.updateTag(editTag.id, { name: editTag.name.trim() });
      if (updatedTag) {
        updateTag(editTag.id, updatedTag);
      }
      setEditTag(null);
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };
  
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    
    try {
      const success = await TagService.deleteTag(tagToDelete);
      if (success) {
        deleteTag(tagToDelete);
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
    } finally {
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          size="small"
          label="新しいタグ"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          sx={{ flexGrow: 1, mr: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTag}
          disabled={!newTagName.trim()}
        >
          追加
        </Button>
      </Box>
      
      <List>
        {tags.map((tag) => (
          <ListItem
            key={tag.id}
            secondaryAction={
              <Box>
                <IconButton
                  edge="end"
                  onClick={() => setEditTag({ id: tag.id, name: tag.name })}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setTagToDelete(tag.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={<Chip label={tag.name} />}
            />
          </ListItem>
        ))}
      </List>
      
      {/* 編集ダイアログ */}
      <Dialog open={!!editTag} onClose={() => setEditTag(null)}>
        <DialogTitle>タグの編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="タグ名"
            fullWidth
            value={editTag?.name || ''}
            onChange={(e) => setEditTag(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTag(null)}>キャンセル</Button>
          <Button onClick={handleUpdateTag}>更新</Button>
        </DialogActions>
      </Dialog>
      
      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>タグの削除</DialogTitle>
        <DialogContent>
          このタグを削除してもよろしいですか？関連するノートからもタグが削除されます。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleDeleteTag} color="error">削除</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TagManager;
```

5. IPCハンドラーにタグ関連の処理を追加します。

```typescript
// src/main/ipc/ipcHandlers.ts に追加
import { TagRepository } from '../database/repositories/TagRepository';

const tagRepository = new TagRepository();

// タグ関連のハンドラー
ipcMain.handle('tags:getAll', async () => {
  try {
    return tagRepository.findAll();
  } catch (error) {
    console.error('Error getting all tags:', error);
    throw error;
  }
});

ipcMain.handle('tags:create', async (_, tag: Omit<Tag, 'id'>) => {
  try {
    return tagRepository.create(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
});

ipcMain.handle('tags:update', async (_, id: string, updates: Partial<Omit<Tag, 'id'>>) => {
  try {
    return tagRepository.update(id, updates);
  } catch (error) {
    console.error(`Error updating tag ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('tags:delete', async (_, id: string) => {
  try {
    return tagRepository.delete(id);
  } catch (error) {
    console.error(`Error deleting tag ${id}:`, error);
    throw error;
  }
});
```

6. タグリポジトリを作成します。

```typescript
// src/main/database/repositories/TagRepository.ts
import { Database } from '../Database';
import { Tag } from '../../../renderer/types/models';
import { v4 as uuidv4 } from 'uuid';

export class TagRepository {
  private db: Database;
  
  constructor() {
    this.db = Database.getInstance();
    this.initTable();
  }
  
  private initTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT
      )
    `);
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT,
        tag_id TEXT,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
  }
  
  public findAll(): Tag[] {
    return this.db.prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
  }
  
  public findById(id: string): Tag | null {
    return this.db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | null;
  }
  
  public create(tag: Omit<Tag, 'id'>): Tag {
    const id = uuidv4();
    const newTag: Tag = { id, ...tag };
    
    this.db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(
      newTag.id,
      newTag.name,
      newTag.color || null
    );
    
    return newTag;
  }
  
  public update(id: string, updates: Partial<Omit<Tag, 'id'>>): Tag | null {
    const tag = this.findById(id);
    if (!tag) return null;
    
    const updatedTag = { ...tag, ...updates };
    
    this.db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(
      updatedTag.name,
      updatedTag.color || null,
      id
    );
    
    return updatedTag;
  }
  
  public delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return result.changes > 0;
  }
  
  public findByNoteId(noteId: string): Tag[] {
    return this.db.prepare(`
      SELECT t.*
      FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
      ORDER BY t.name
    `).all(noteId) as Tag[];
  }
  
  public addTagToNote(noteId: string, tagId: string): void {
    this.db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)').run(
      noteId,
      tagId
    );
  }
  
  public removeTagFromNote(noteId: string, tagId: string): void {
    this.db.prepare('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?').run(
      noteId,
      tagId
    );
  }
}
```

### 3. フィルタリング機能

1. フィルタリングコンポーネントを作成します。

```typescript
// src/renderer/components/Search/FilterPanel.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { useTagStore } from '../../store/tagStore';

export interface FilterOptions {
  tags: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortDirection: 'asc' | 'desc';
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange }) => {
  const { tags } = useTagStore();
  
  const handleTagSelect = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(id => id !== tagId)
      : [...filters.tags, tagId];
    
    onFilterChange({ ...filters, tags: newTags });
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>フィルター</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              タグ
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  onClick={() => handleTagSelect(tag.id)}
                  color={filters.tags.includes(tag.id) ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </Box>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <DatePicker
                label="開始日"
                value={filters.dateFrom}
                onChange={(date) => onFilterChange({ ...filters, dateFrom: date })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <DatePicker
                label="終了日"
                value={filters.dateTo}
                onChange={(date) => onFilterChange({ ...filters, dateTo: date })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>並び替え</InputLabel>
              <Select
                value={filters.sortBy}
                label="並び替え"
                onChange={(e) => onFilterChange({
                  ...filters,
                  sortBy: e.target.value as FilterOptions['sortBy']
                })}
              >
                <MenuItem value="updatedAt">更新日</MenuItem>
                <MenuItem value="createdAt">作成日</MenuItem>
                <MenuItem value="title">タイトル</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" fullWidth>
              <InputLabel>順序</InputLabel>
              <Select
                value={filters.sortDirection}
                label="順序"
                onChange={(e) => onFilterChange({
                  ...filters,
                  sortDirection: e.target.value as FilterOptions['sortDirection']
                })}
              >
                <MenuItem value="desc">降順</MenuItem>
                <MenuItem value="asc">昇順</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default FilterPanel;
```

2. フィルタリングロジックを実装します。

```typescript
// src/renderer/utils/filterUtils.ts
import { Note } from '../types/models';
import { FilterOptions } from '../components/Search/FilterPanel';

export const filterNotes = (notes: Note[], filters: FilterOptions): Note[] => {
  return notes.filter(note => {
    // タグでフィルタリング
    if (filters.tags.length > 0) {
      const hasMatchingTag = note.tags.some(tag => filters.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    // 日付でフィルタリング
    if (filters.dateFrom) {
      const noteDate = new Date(note.updatedAt);
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (noteDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const noteDate = new Date(note.updatedAt);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (noteDate > toDate) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // 並び替え
    const aValue = filters.sortBy === 'title' ? a.title : new Date(a[filters.sortBy]).getTime();
    const bValue = filters.sortBy === 'title' ? b.title : new Date(b[filters.sortBy]).getTime();
    
    if (filters.sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};
```

### 4. 検索結果のハイライト

1. 検索結果ハイライトコンポーネントを作成します。

```typescript
// src/renderer/components/Search/HighlightedText.tsx
import React from 'react';
import { styled } from '@mui/material/styles';

const HighlightMark = styled('mark')(({ theme }) => ({
  backgroundColor: theme.palette.warning.light,
  color: theme.palette.warning.contrastText,
  padding: '0 2px',
  borderRadius: '2px',
}));

interface HighlightedTextProps {
  text: string;
  highlight: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <>{text}</>;
  }
  
  const regex = new RegExp(`(${highlight.trim()})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? <HighlightMark key={i}>{part}</HighlightMark> : part
      )}
    </>
  );
};

export default HighlightedText;
```

2. 検索結果コンポーネントを更新します。

```typescript
// src/renderer/components/Search/SearchResults.tsx を更新
import HighlightedText from './HighlightedText';

// highlightText関数を削除し、代わりにHighlightedTextコンポーネントを使用
<ListItemText
  primary={<HighlightedText text={note.title} highlight={searchQuery} />}
  secondary={
    <>
      <Typography variant="body2" color="text.secondary">
        {formatDate(note.updatedAt)}
      </Typography>
      <Typography variant="body2" noWrap>
        <HighlightedText 
          text={note.content.replace(/<[^>]*>/g, ' ')} 
          highlight={searchQuery} 
        />
      </Typography>
    </>
  }
  sx={{ mb: 1 }}
/>
```

### 5. 関連ノートの推奨

1. 関連ノート検索ユーティリティを作成します。

```typescript
// src/renderer/utils/relatedNotesUtils.ts
import { Note } from '../types/models';
import MiniSearch from 'minisearch';

export const findRelatedNotes = (
  currentNote: Note,
  allNotes: Note[],
  maxResults: number = 5
): Note[] => {
  // 現在のノートを除外
  const otherNotes = allNotes.filter(note => note.id !== currentNote.id);
  if (otherNotes.length === 0) return [];
  
  // 検索インデックスを作成
  const miniSearch = new MiniSearch({
    fields: ['title', 'content', 'tags'],
    storeFields: ['id', 'title'],
    searchOptions: {
      boost: { title: 2, tags: 1.5 },
      fuzzy: 0.2
    }
  });
  
  miniSearch.addAll(otherNotes);
  
  // 現在のノートのタイトルと内容から検索クエリを生成
  const searchTerms = extractKeywords(currentNote.title + ' ' + currentNote.content);
  
  // タグを検索クエリに追加
  const tagTerms = currentNote.tags.join(' ');
  
  // 検索を実行
  const searchResults = miniSearch.search(searchTerms + ' ' + tagTerms);
  
  // 上位の結果を返す
  return searchResults
    .slice(0, maxResults)
    .map(result => otherNotes.find(note => note.id === result.id)!)
    .filter(Boolean);
};

// テキストから重要なキーワードを抽出
const extractKeywords = (text: string): string => {
  // HTMLタグを削除
  const plainText = text.replace(/<[^>]*>/g, ' ');
  
  // 単語に
