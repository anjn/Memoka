/**
 * @file TipTap Editor component
 * @AI-CONTEXT This file contains the TipTap editor component for rich text editing
 */

import React from 'react';
import { Editor, EditorContent } from '@tiptap/react';
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
  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <div
        style={{
          minHeight: '100%',
          padding: '0.5rem',
        }}
      >
        {/* The editor is now managed in the parent component */}
      </div>
    </Box>
  );
};

export default TipTapEditor;
