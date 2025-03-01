# M3: エディタ機能実装の指示

## 背景

Memoka（メモカ）プロジェクトのマイルストーンM3「エディタ機能実装」を達成するための指示です。マイルストーンM2では、アプリケーションの基本アーキテクチャを実装し、データ管理の基盤を構築しました。M3では、アプリケーションの中核となるエディタ機能を実装します。

## 目標

リッチテキストエディタを統合し、マークダウンサポートやシンタックスハイライトなどの機能を実装します。具体的には以下の成果物を作成します：

1. リッチテキストエディタの統合
2. マークダウンサポート
3. シンタックスハイライト
4. 画像の挿入と管理
5. 自動保存機能

## 技術スタック

- **リッチテキストエディタ**: TipTap（ProseMirror ベース）
- **マークダウン変換**: markdown-it
- **シンタックスハイライト**: Prism.js
- **画像管理**: Electron APIとファイルシステム
- **自動保存**: Zustand + Electron IPC

## 手順

### 1. リッチテキストエディタの統合

1. TipTapとその関連パッケージをインストールします。

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-image @tiptap/extension-link @tiptap/extension-code-block-lowlight
```

2. 基本的なエディタコンポーネントを作成します。

```typescript
// src/renderer/components/Editor/TipTapEditor.tsx
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Box } from '@mui/material';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  readOnly = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'ノートを入力してください...',
      }),
      Image,
      Link.configure({
        openOnClick: true,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <EditorContent
        editor={editor}
        style={{
          minHeight: '100%',
          padding: '0.5rem',
        }}
      />
    </Box>
  );
};

export default TipTapEditor;
```

3. エディタのツールバーを作成します。

```typescript
// src/renderer/components/Editor/Toolbar.tsx
import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Box,
  Divider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import CodeIcon from '@mui/icons-material/Code';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', p: 0.5, borderBottom: 1, borderColor: 'divider' }}>
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="bold"
          selected={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Tooltip title="太字">
            <FormatBoldIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="italic"
          selected={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Tooltip title="斜体">
            <FormatItalicIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="underline"
          selected={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Tooltip title="下線">
            <FormatUnderlinedIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="code"
          selected={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Tooltip title="コード">
            <CodeIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <ToggleButtonGroup size="small">
        <ToggleButton
          value="heading-1"
          selected={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Tooltip title="見出し1">
            <LooksOneIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="heading-2"
          selected={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Tooltip title="見出し2">
            <LooksTwoIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="heading-3"
          selected={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Tooltip title="見出し3">
            <Looks3Icon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <ToggleButtonGroup size="small">
        <ToggleButton
          value="blockquote"
          selected={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Tooltip title="引用">
            <FormatQuoteIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="bulletList"
          selected={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Tooltip title="箇条書き">
            <FormatListBulletedIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="orderedList"
          selected={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Tooltip title="番号付きリスト">
            <FormatListNumberedIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default Toolbar;
```

4. エディタコンポーネントを統合します。

```typescript
// src/renderer/components/Editor/index.tsx
import React, { useState, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import TipTapEditor from './TipTapEditor';
import Toolbar from './Toolbar';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useNoteStore } from '../../store/noteStore';
import { NoteService } from '../../services/NoteService';
import { useSettingsStore } from '../../store/settingsStore';

const Editor: React.FC = () => {
  const { selectedNoteId, notes, updateNote } = useNoteStore();
  const { autoSave } = useSettingsStore();
  const [content, setContent] = useState<string>('');
  const [lastSavedContent, setLastSavedContent] = useState<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'ノートを入力してください...',
      }),
      Image,
      Link.configure({
        openOnClick: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  // 選択されたノートが変更されたときにエディタの内容を更新
  useEffect(() => {
    if (selectedNoteId) {
      const selectedNote = notes.find(note => note.id === selectedNoteId);
      if (selectedNote) {
        setContent(selectedNote.content || '');
        setLastSavedContent(selectedNote.content || '');
        if (editor) {
          editor.commands.setContent(selectedNote.content || '');
        }
      }
    } else {
      setContent('');
      setLastSavedContent('');
      if (editor) {
        editor.commands.setContent('');
      }
    }
  }, [selectedNoteId, notes, editor]);

  // 自動保存
  useEffect(() => {
    if (!autoSave || !selectedNoteId) return;

    if (content !== lastSavedContent) {
      const timeoutId = setTimeout(() => {
        saveNote(content);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [content, lastSavedContent, selectedNoteId, autoSave]);

  // ノートを保存
  const saveNote = async (noteContent: string) => {
    if (!selectedNoteId) return;
    
    try {
      const updatedNote = await NoteService.updateNote(selectedNoteId, {
        content: noteContent,
      });
      
      if (updatedNote) {
        updateNote(selectedNoteId, updatedNote);
        setLastSavedContent(noteContent);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Toolbar editor={editor} />
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <TipTapEditor
            content={content}
            onChange={setContent}
            readOnly={!selectedNoteId}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default Editor;
```

### 2. マークダウンサポート

1. マークダウン変換のためのパッケージをインストールします。

```bash
npm install markdown-it @tiptap/extension-markdown
```

2. マークダウン変換ユーティリティを作成します。

```typescript
// src/renderer/utils/markdownUtils.ts
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

export const markdownToHtml = (markdown: string): string => {
  return md.render(markdown);
};

export const htmlToMarkdown = (html: string): string => {
  // 基本的なHTML→Markdown変換
  // 実際のプロジェクトでは、より高度な変換ライブラリを使用することを検討してください
  let markdown = html;
  
  // 見出し
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n');
  
  // 段落
  markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
  
  // 強調
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
  
  // リスト
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, (match, p1) => {
    return p1.replace(/<li>(.*?)<\/li>/g, '- $1\n');
  });
  
  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gs, (match, p1) => {
    let index = 1;
    return p1.replace(/<li>(.*?)<\/li>/g, () => {
      return `${index++}. $1\n`;
    });
  });
  
  // 引用
  markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gs, '> $1\n\n');
  
  // コード
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
  
  // リンク
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
  
  // 画像
  markdown = markdown.replace(/<img src="(.*?)" alt="(.*?)">/g, '![$2]($1)');
  
  // 余分なスペースを削除
  markdown = markdown.replace(/\n\n\n+/g, '\n\n');
  
  return markdown.trim();
};
```

3. マークダウンインポート/エクスポート機能を追加します。

```typescript
// src/renderer/components/Editor/MarkdownToolbar.tsx
import React from 'react';
import { Box, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { useNoteStore } from '../../store/noteStore';
import { NoteService } from '../../services/NoteService';
import { markdownToHtml, htmlToMarkdown } from '../../utils/markdownUtils';

const MarkdownToolbar: React.FC = () => {
  const { selectedNoteId, notes, updateNote } = useNoteStore();
  
  const handleImportMarkdown = async () => {
    try {
      const importedNotes = await NoteService.importMarkdown();
      if (importedNotes && importedNotes.length > 0) {
        // 最後にインポートしたノートを選択
        const lastImportedNote = importedNotes[importedNotes.length - 1];
        updateNote(lastImportedNote.id, lastImportedNote);
      }
    } catch (error) {
      console.error('Failed to import markdown:', error);
    }
  };
  
  const handleExportMarkdown = async () => {
    if (!selectedNoteId) return;
    
    const selectedNote = notes.find(note => note.id === selectedNoteId);
    if (!selectedNote) return;
    
    try {
      const markdown = htmlToMarkdown(selectedNote.content || '');
      await NoteService.exportNoteAsMarkdown({
        ...selectedNote,
        content: markdown,
      });
    } catch (error) {
      console.error('Failed to export markdown:', error);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
      <Button
        size="small"
        startIcon={<UploadFileIcon />}
        onClick={handleImportMarkdown}
      >
        Markdownインポート
      </Button>
      <Button
        size="small"
        startIcon={<DownloadIcon />}
        onClick={handleExportMarkdown}
        disabled={!selectedNoteId}
      >
        Markdownエクスポート
      </Button>
    </Box>
  );
};

export default MarkdownToolbar;
```

4. IPCハンドラーにマークダウンインポート機能を追加します。

```typescript
// src/main/ipc/ipcHandlers.ts に追加
ipcMain.handle('notes:importMarkdown', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import Markdown',
      filters: [{ name: 'Markdown Files', extensions: ['md'] }],
      properties: ['openFile', 'multiSelections'],
    });
    
    if (filePaths.length === 0) return [];
    
    const importedNotes: Note[] = [];
    
    for (const filePath of filePaths) {
      const content = await FileUtils.readFile(filePath);
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
```

### 3. シンタックスハイライト

1. Prism.jsをインストールします。

```bash
npm install prismjs lowlight @tiptap/extension-code-block-lowlight
npm install -D @types/prismjs
```

2. シンタックスハイライト用の拡張を作成します。

```typescript
// src/renderer/components/Editor/extensions/CodeBlockExtension.ts
import { Extension } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';

export const CodeBlockExtension = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: 'javascript',
});

// 言語選択用のユーティリティ
export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'css', label: 'CSS' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
];
```

3. エディタにコードブロック機能を追加します。

```typescript
// src/renderer/components/Editor/TipTapEditor.tsx を更新
// importに以下を追加
import { CodeBlockExtension } from './extensions/CodeBlockExtension';

// extensionsに以下を追加
CodeBlockExtension,
```

4. ツールバーにコードブロックボタンを追加します。

```typescript
// src/renderer/components/Editor/Toolbar.tsx に追加
import CodeBlockIcon from '@mui/icons-material/Code';
import { LANGUAGES } from './extensions/CodeBlockExtension';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

// ToggleButtonGroupに追加
<ToggleButton
  value="codeBlock"
  selected={editor.isActive('codeBlock')}
  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
>
  <Tooltip title="コードブロック">
    <CodeBlockIcon fontSize="small" />
  </Tooltip>
</ToggleButton>

// 言語選択コンポーネント（エディタがコードブロックの中にいる場合のみ表示）
{editor.isActive('codeBlock') && (
  <FormControl variant="outlined" size="small" sx={{ ml: 2, minWidth: 120 }}>
    <InputLabel id="language-select-label">言語</InputLabel>
    <Select
      labelId="language-select-label"
      value={editor.getAttributes('codeBlock').language || 'javascript'}
      onChange={(e) => {
        editor
          .chain()
          .focus()
          .updateAttributes('codeBlock', { language: e.target.value })
          .run();
      }}
      label="言語"
    >
      {LANGUAGES.map((lang) => (
        <MenuItem key={lang.value} value={lang.value}>
          {lang.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
)}
```

### 4. 画像の挿入と管理

1. 画像挿入用のボタンをツールバーに追加します。

```typescript
// src/renderer/components/Editor/Toolbar.tsx に追加
import ImageIcon from '@mui/icons-material/Image';

// ファイル選択ハンドラー
const handleImageUpload = async () => {
  try {
    const result = await window.ipcRenderer.invoke('notes:uploadImage');
    if (result && result.filePath) {
      editor.chain().focus().setImage({ src: result.filePath, alt: result.fileName }).run();
    }
  } catch (error) {
    console.error('Failed to upload image:', error);
  }
};

// ツールバーに追加
<IconButton onClick={handleImageUpload}>
  <Tooltip title="画像を挿入">
    <ImageIcon fontSize="small" />
  </Tooltip>
</IconButton>
```

2. IPCハンドラーに画像アップロード機能を追加します。

```typescript
// src/main/ipc/ipcHandlers.ts に追加
ipcMain.handle('notes:uploadImage', async () => {
  try {
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
    await fs.mkdir(imagesDir, { recursive: true });
    
    const destPath = path.join(imagesDir, fileName);
    await fs.copyFile(filePath, destPath);
    
    return {
      filePath: `file://${destPath}`,
      fileName,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
});
```

### 5. 自動保存機能

1. 自動保存機能を実装します（既にエディタコンポーネントに組み込み済み）。

2. 設定画面に自動保存オプションを追加します。

```typescript
// src/renderer/components/SettingsDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useSettingsStore } from '../store/settingsStore';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const {
    theme,
    fontSize,
    sidebarWidth,
    autoSave,
    setTheme,
    setFontSize,
    setSidebarWidth,
    setAutoSave,
    resetSettings,
  } = useSettingsStore();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>設定</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>テーマ</Typography>
          <ToggleButtonGroup
            value={theme}
            exclusive
            onChange={(_, newTheme) => newTheme && setTheme(newTheme)}
            aria-label="theme"
          >
            <ToggleButton value="light" aria-label="light theme">
              <LightModeIcon sx={{ mr: 1 }} />
              ライト
            </ToggleButton>
            <ToggleButton value="dark" aria-label="dark theme">
              <DarkModeIcon sx={{ mr: 1 }} />
              ダーク
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>フォントサイズ: {fontSize}px</Typography>
          <Slider
            value={fontSize}
            onChange={(_, newValue) => setFontSize(newValue as number)}
            min={12}
            max={24}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>サイドバー幅: {sidebarWidth}px</Typography>
          <Slider
            value={sidebarWidth}
            onChange={(_, newValue) => setSidebarWidth(newValue as number)}
            min={180}
            max={400}
            step={10}
            marks
            valueLabelDisplay="auto"
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
          }
          label="自動保存"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={resetSettings} color="secondary">
          デフォルトに戻す
        </Button>
        <Button onClick={onClose} color="primary">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
```

3. ヘッダーに設定ダイアログを開くボタンを追加します。

```typescript
// src/renderer/components/Header.tsx を更新
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsDialog from './SettingsDialog';

const Header: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Memoka
          </Typography>
          <IconButton
            color="inherit"
            aria-label="settings"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default Header;
```

## 評価基準

実装が完了したら、以下の評価基準を満たしているか確認してください：

1. リッチテキストエディタが正常に動作し、テキストの書式設定ができる
2. マークダウンのインポート/エクスポートが正常に動作する
3. コードブロックでシンタックスハイライトが適用される
4. 画像の挿入と表示が正常に動作する
5. 自動保存機能が正常に動作する

## 次のステップ

このマイルストーンが完了したら、次のマイルストーンM4「検索・タグ機能実装」に進みます。M4では以下を実装します：

1. 全文検索機能
2. タグ管理システム
3. フィルタリング機能
4. 検索結果のハイライト
5. 関連ノートの推奨

## 注意事項

- エディタの実装は複雑になりがちなので、コンポーネントを適切に分割してください
- パフォーマンスを考慮し、大きなノートでも快適に編集できるようにしてください
- ユーザーエクスペリエンスを重視し、直感的な操作ができるようにしてください
- **重要**: 作業を開始する前に、必ずプロジェクトの技術選定ドキュメント（`docs/technology.md`）や開発マイルストーンドキュメント（`docs/development-milestones.md`）を読み、正しい技術スタックと実装方針を理解してください。これにより、誤った技術選択や実装の不整合を防ぐことができます。
- **重要**: 以下の2種類の記録を必ず `history/YYYY/MM/連番_概要.md` 形式でhistoryディレクトリに残してください：
  1. 実装内容と結果の記録
  2. ユーザーからの指示内容の記録
  これらの記録は次の生成AIが文脈を理解するために不可欠です。記録がないと、次の生成AIが前の作業内容を理解できず、誤った判断をする可能性があります。
- 作業完了時には、historyファイルに次のマイルストーンの指示ファイルへのパスを記載してください
- 次のマイルストーンの指示ファイルには、historyへの記録の重要性を必ず記載してください

## 完了報告

タスクが完了したら、以下の情報を含む完了報告を作成し、`instructions/2025/03/004_search-tag-implementation.md`ファイルに次のマイルストーンの指示を記載してください：

1. 実装した機能の概要
2. 直面した課題と解決策
3. 次のマイルストーンに向けた提案
4. スクリーンショットまたはデモ（可能であれば）
