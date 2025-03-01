/**
 * @file TipTap Editor component
 * @AI-CONTEXT This file contains the TipTap editor component for rich text editing
 */

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { CodeBlockExtension } from './extensions/CodeBlockExtension';
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
      CodeBlockExtension,
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
