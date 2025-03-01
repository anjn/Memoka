/**
 * @file Editor Toolbar component
 * @AI-CONTEXT This file contains the toolbar component for the rich text editor
 */

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Box,
  Divider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
import ImageIcon from '@mui/icons-material/Image';
import CodeBlockIcon from '@mui/icons-material/Code';
import { LANGUAGES } from './extensions/CodeBlockExtension';

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

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

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <ToggleButtonGroup size="small">
        <ToggleButton
          value="codeBlock"
          selected={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Tooltip title="コードブロック">
            <CodeBlockIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

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

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />

      <IconButton onClick={handleImageUpload}>
        <Tooltip title="画像を挿入">
          <ImageIcon fontSize="small" />
        </Tooltip>
      </IconButton>
    </Box>
  );
};

export default Toolbar;
