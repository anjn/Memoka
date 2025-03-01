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

- **リッチテキストエディタ**: Slate.js
- **マークダウン変換**: remark
- **シンタックスハイライト**: Prism.js
- **画像管理**: Electron APIとファイルシステム
- **自動保存**: Zustand + Electron IPC

## 手順

### 1. リッチテキストエディタの統合

1. Slate.jsとその関連パッケージをインストールします。

```bash
npm install slate slate-react slate-history
```

2. 基本的なエディタコンポーネントを作成します。

```typescript
// src/renderer/components/Editor/SlateEditor.tsx
import React, { useMemo, useCallback } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { Box } from '@mui/material';

interface SlateEditorProps {
  initialValue: Descendant[];
  onChange: (value: Descendant[]) => void;
  readOnly?: boolean;
}

const SlateEditor: React.FC<SlateEditorProps> = ({
  initialValue,
  onChange,
  readOnly = false,
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const renderElement = useCallback(({ attributes, children, element }) => {
    switch (element.type) {
      case 'paragraph':
        return <p {...attributes}>{children}</p>;
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>;
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>;
      case 'heading-three':
        return <h3 {...attributes}>{children}</h3>;
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>;
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>;
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    let el = <>{children}</>;
    
    if (leaf.bold) {
      el = <strong>{el}</strong>;
    }
    
    if (leaf.italic) {
      el = <em>{el}</em>;
    }
    
    if (leaf.underline) {
      el = <u>{el}</u>;
    }
    
    if (leaf.code) {
      el = <code>{el}</code>;
    }
    
    return <span {...attributes}>{el}</span>;
  }, []);

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <Slate editor={editor} value={initialValue} onChange={onChange}>
        <Editable
          readOnly={readOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="ノートを入力してください..."
          style={{
            minHeight: '100%',
            padding: '0.5rem',
          }}
        />
      </Slate>
    </Box>
  );
};

export default SlateEditor;
```

3. エディタのツールバーを作成します。

```typescript
// src/renderer/components/Editor/Toolbar.tsx
import React from 'react';
import { useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
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

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });
  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = ['numbered-list', 'bulleted-list'].includes(format);

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      ['numbered-list', 'bulleted-list'].includes(n.type),
    split: true,
  });

  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  };
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const Toolbar: React.FC = () => {
  const editor = useSlate();

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', p: 0.5, borderBottom: 1, borderColor: 'divider' }}>
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="bold"
          selected={isMarkActive(editor, 'bold')}
          onClick={() => toggleMark(editor, 'bold')}
        >
          <Tooltip title="太字">
            <FormatBoldIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="italic"
          selected={isMarkActive(editor, 'italic')}
          onClick={() => toggleMark(editor, 'italic')}
        >
          <Tooltip title="斜体">
            <FormatItalicIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="underline"
          selected={isMarkActive(editor, 'underline')}
          onClick={() => toggleMark(editor, 'underline')}
        >
          <Tooltip title="下線">
            <FormatUnderlinedIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="code"
          selected={isMarkActive(editor, 'code')}
          onClick={() => toggleMark(editor, 'code')}
        >
          <Tooltip title="コード">
            <CodeIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <ToggleButtonGroup size="small">
        <ToggleButton
          value="heading-one"
          selected={isBlockActive(editor, 'heading-one')}
          onClick={() => toggleBlock(editor, 'heading-one')}
        >
          <Tooltip title="見出し1">
            <LooksOneIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="heading-two"
          selected={isBlockActive(editor, 'heading-two')}
          onClick={() => toggleBlock(editor, 'heading-two')}
        >
          <Tooltip title="見出し2">
            <LooksTwoIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="heading-three"
          selected={isBlockActive(editor, 'heading-three')}
          onClick={() => toggleBlock(editor, 'heading-three')}
        >
          <Tooltip title="見出し3">
            <Looks3Icon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <ToggleButtonGroup size="small">
        <ToggleButton
          value="block-quote"
          selected={isBlockActive(editor, 'block-quote')}
          onClick={() => toggleBlock(editor, 'block-quote')}
        >
          <Tooltip title="引用">
            <FormatQuoteIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="bulleted-list"
          selected={isBlockActive(editor, 'bulleted-list')}
          onClick={() => toggleBlock(editor, 'bulleted-list')}
        >
          <Tooltip title="箇条書き">
            <FormatListBulletedIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="numbered-list"
          selected={isBlockActive(editor, 'numbered-list')}
          onClick={() => toggleBlock(editor, 'numbered-list')}
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
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import { createEditor, Descendant } from 'slate';
import { Slate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import SlateEditor from './SlateEditor';
import Toolbar from './Toolbar';
import { useNoteStore } from '../../store/noteStore';
import { NoteService } from '../../services/NoteService';
import { useSettingsStore } from '../../store/settingsStore';

// 初期値
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

const Editor: React.FC = () => {
  const { selectedNoteId, notes, updateNote } = useNoteStore();
  const { autoSave } = useSettingsStore();
  const [value, setValue] = useState<Descendant[]>(initialValue);
  const [lastSavedValue, setLastSavedValue] = useState<string>('');

  // 選択されたノートが変更されたときにエディタの内容を更新
  useEffect(() => {
    if (selectedNoteId) {
      const selectedNote = notes.find(note => note.id === selectedNoteId);
      if (selectedNote) {
        try {
          // ノートの内容がJSON形式の場合はパース
          const content = selectedNote.content ? JSON.parse(selectedNote.content) : initialValue;
          setValue(content);
          setLastSavedValue(JSON.stringify(content));
        } catch (e) {
          // パースに失敗した場合はテキストとして扱う
          setValue([
            {
              type: 'paragraph',
              children: [{ text: selectedNote.content || '' }],
            },
          ]);
          setLastSavedValue(selectedNote.content || '');
        }
      }
    } else {
      setValue(initialValue);
      setLastSavedValue('');
    }
  }, [selectedNoteId, notes]);

  // 自動保存
  useEffect(() => {
    if (!autoSave || !selectedNoteId) return;

    const currentValueString = JSON.stringify(value);
    if (currentValueString !== lastSavedValue) {
      const timeoutId = setTimeout(() => {
        saveNote(value);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [value, lastSavedValue, selectedNoteId, autoSave]);

  // ノートを保存
  const saveNote = async (noteValue: Descendant[]) => {
    if (!selectedNoteId) return;

    const noteContent = JSON.stringify(noteValue);
    
    try {
      const updatedNote = await NoteService.updateNote(selectedNoteId, {
        content: noteContent,
      });
      
      if (updatedNote) {
        updateNote(selectedNoteId, updatedNote);
        setLastSavedValue(noteContent);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  // エディタの内容が変更されたときに呼ばれる
  const handleChange = (newValue: Descendant[]) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Slate editor={createEditor()} value={value} onChange={handleChange}>
          <Toolbar />
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <SlateEditor
              initialValue={value}
              onChange={handleChange}
              readOnly={!selectedNoteId}
            />
          </Box>
        </Slate>
      </Paper>
    </Box>
  );
};

export default Editor;
```

### 2. マークダウンサポート

1. マークダウン変換のためのパッケージをインストールします。

```bash
npm install remark remark-parse remark-slate unified
```

2. マークダウン変換ユーティリティを作成します。

```typescript
// src/renderer/utils/markdownUtils.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkSlate from 'remark-slate';
import { Descendant } from 'slate';

export const markdownToSlate = async (markdown: string): Promise<Descendant[]> => {
  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkSlate)
      .process(markdown);
    
    return result.result as Descendant[];
  } catch (error) {
    console.error('Error converting markdown to slate:', error);
    return [
      {
        type: 'paragraph',
        children: [{ text: markdown }],
      },
    ];
  }
};

export const slateToMarkdown = (nodes: Descendant[]): string => {
  let markdown = '';
  
  const processNode = (node: any) => {
    if (node.text) {
      let text = node.text;
      if (node.bold) text = `**${text}**`;
      if (node.italic) text = `*${text}*`;
      if (node.code) text = `\`${text}\``;
      return text;
    }
    
    const children = node.children.map(processNode).join('');
    
    switch (node.type) {
      case 'paragraph':
        return `${children}\n\n`;
      case 'heading-one':
        return `# ${children}\n\n`;
      case 'heading-two':
        return `## ${children}\n\n`;
      case 'heading-three':
        return `### ${children}\n\n`;
      case 'block-quote':
        return `> ${children}\n\n`;
      case 'bulleted-list':
        return children;
      case 'numbered-list':
        return children;
      case 'list-item':
        return `- ${children}\n`;
      default:
        return children;
    }
  };
  
  nodes.forEach(node => {
    markdown += processNode(node);
  });
  
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
import { markdownToSlate, slateToMarkdown } from '../../utils/markdownUtils';

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
      let content: any;
      try {
        content = JSON.parse(selectedNote.content);
      } catch (e) {
        content = [
          {
            type: 'paragraph',
            children: [{ text: selectedNote.content || '' }],
          },
        ];
      }
      
      const markdown = slateToMarkdown(content);
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
      
      const note = noteRepository.create({
        title: fileName,
        content,
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
npm install prismjs
npm install -D @types/prismjs
```

2. シンタックスハイライト用のコンポーネントを作成します。

```typescript
// src/renderer/components/Editor/CodeBlock.tsx
import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
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
import { Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface CodeBlockProps {
  attributes: any;
  children: React.ReactNode;
  element: any;
  editor: any;
}

const LANGUAGES = [
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

const CodeBlock: React.FC<CodeBlockProps> = ({ attributes, children, element, editor }) => {
  const codeRef = useRef<HTMLPreElement>(null);
  
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [element.language, element.children]);
  
  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(
      editor,
      { language: event.target.value as string },
      { at: path }
    );
  };
  
  return (
    <Box sx={{ my: 2, position: 'relative' }}>
      <FormControl variant="outlined" size="small" sx={{ position: 'absolute', top: 0, right: 0, width: 150, zIndex: 1 }}>
        <InputLabel id="language-select-label">言語</InputLabel>
        <Select
          labelId="language-select-label"
          value={element.language || 'javascript'}
          onChange={handleLanguageChange}
          label="言語"
        >
          {LANGUAGES.map((lang) => (
            <MenuItem key={lang.value} value={lang.value}>
              {lang.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <pre
        {...attributes}
        ref={codeRef}
        className={`language-${element.language || 'javascript'}`}
        style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        <code>{children}</code>
      </pre>
    </Box>
  );
};

export default CodeBlock;
```

3. エディタにコードブロック機能を追加します。

```typescript
// src/renderer/components/Editor/SlateEditor.tsx を更新
// renderElement関数に以下を追加
case 'code-block':
  return (
    <CodeBlock
      attributes={attributes}
      element={element}
      editor={editor}
    >
      {children}
    </CodeBlock>
  );
```

4. ツールバーにコードブロックボタンを追加します。

```typescript
// src/renderer/components/Editor/Toolbar.tsx に追加
import CodeBlockIcon from '@mui/icons-material/Code';

// ToggleButtonGroupに追加
<ToggleButton
  value="code-block"
  selected={isBlockActive(editor, 'code-block')}
  onClick={() => toggleBlock(editor, 'code-block')}
>
  <Tooltip title="コードブロック">
    <CodeBlockIcon fontSize="small" />
  </Tooltip>
</ToggleButton>
```

### 4. 画像の挿入と管理

1. 画像挿入用のコンポーネントを作成します。

```typescript
// src/renderer/components/Editor/ImageElement.tsx
import React from 'react';
import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Transforms } from 'slate';
import { ReactEditor } from 'slate-react';

interface ImageElementProps {
  attributes: any;
  children: React.ReactNode;
  element: any;
  editor: any;
}

const ImageElement: React.FC<ImageElementProps> = ({ attributes, children, element, editor }) => {
  const handleDelete = () => {
    const path = ReactEditor.findPath(editor, element);
    Transforms.removeNodes(editor, { at: path });
  };
  
  return (
    <Box
      {...attributes}
      contentEditable={false}
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        my: 2,
        '&:hover .image-actions': {
          opacity: 1,
        },
      }}
    >
      <Box
        className="image-actions"
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          opacity: 0,
          transition: 'opacity 0.2s',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '4px',
        }}
      >
        <IconButton size="small" onClick={handleDelete} sx={{ color: 'white' }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      <img
        src={element.url}
        alt={element.alt || ''}
        style={{
          maxWidth: '100%',
          maxHeight: '500px',
          objectFit: 'contain',
        }}
      />
      {children}
    </Box>
  );
};

export default ImageElement;
```

2. 画像挿入機能をエディタに追加します。

```typescript
// src/renderer/components/Editor/SlateEditor.tsx を更新
// renderElement関数に以下を追加
case 'image':
  return (
    <ImageElement
      attributes={attributes}
      element={element}
      editor={editor}
    >
      {children}
    </ImageElement>
  );
```

3. 画像挿入ボタンをツールバーに追加します。

```typescript
// src/renderer/components/Editor/Toolbar.tsx に追加
import ImageIcon from '@mui/icons-material/Image';
import { ReactEditor } from 'slate-react';

// 画像挿入関数
const insertImage = (editor, url, alt = '') => {
  const image = {
    type: 'image',
    url,
    alt,
    children: [{ text: '' }],
  };
  Transforms.insertNodes(editor, image);
};

// ファイル選択ハンドラー
const handleImageUpload = async (editor) => {
  try {
    const result = await window.ipcRenderer.invoke('notes:uploadImage');
    if (result && result.filePath) {
      insertImage(editor, result.filePath, result.fileName);
    }
  } catch (error) {
    console.error('Failed to upload image:', error);
  }
};

// ツールバーに追加
<IconButton onClick={() => handleImageUpload(editor)}>
  <Tooltip title="画像を挿入">
    <ImageIcon fontSize="small" />
  </Tooltip>
</IconButton>
```

4. IPCハンドラーに画像アップロード機能を追加します。

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
- **重要**: 以下の2種類の記録を必ず `history/YYYY/MM/連番_概要.md` 形式でhistoryディレクトリに残してください：
  1. 実装内容と結果の記録
  2. ユーザーからの指示内容の記録
  これらの記録は次の生成AIが文脈を理解するために不可欠です
- 作業完了時には、historyファイルに次のマイルストーンの指示ファイルへのパスを記載してください
- 次のマイルストーンの指示ファイルには、historyへの記録の重要性を必ず記載してください

## 完了報告

タスクが完了したら、以下の情報を含む完了報告を作成し、`instructions/2025/03/004_search-tag-implementation.md`ファイルに次のマイルストーンの指示を記載してください：

1. 実装した機能の概要
2. 直面した課題と解決策
3. 次のマイルストーンに向けた提案
4. スクリーンショットまたはデモ（可能であれば）
