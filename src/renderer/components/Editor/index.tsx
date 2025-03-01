/**
 * @file Editor component
 * @AI-CONTEXT This file contains the main editor component that integrates TipTap, toolbar, and markdown features
 */

import React, { useState, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import TipTapEditor from './TipTapEditor';
import Toolbar from './Toolbar';
import MarkdownToolbar from './MarkdownToolbar';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { CodeBlockExtension } from './extensions/CodeBlockExtension';
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
      StarterKit.configure({
        codeBlock: false, // Disable default code block to avoid conflicts
      }),
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
      <MarkdownToolbar />
      <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Toolbar editor={editor} />
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Box sx={{ p: 2, height: '100%' }}>
            {editor && (
              <EditorContent
                editor={editor}
                style={{
                  minHeight: '100%',
                  padding: '0.5rem',
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Editor;
