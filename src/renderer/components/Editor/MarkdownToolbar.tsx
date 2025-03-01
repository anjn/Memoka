/**
 * @file Markdown Toolbar component
 * @AI-CONTEXT This file contains the toolbar component for markdown import/export
 */

import React from 'react';
import { Box, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { useNoteStore } from '../../store/noteStore';
import { NoteService } from '../../services/NoteService';
import { htmlToMarkdown } from '../../utils/markdownUtils';

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
