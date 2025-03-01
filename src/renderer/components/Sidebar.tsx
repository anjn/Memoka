/**
 * @file Sidebar component
 * @AI-CONTEXT This file contains the sidebar component for the application
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  CircularProgress,
} from '@mui/material';
import NoteIcon from '@mui/icons-material/Note';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import { useNoteStore } from '../store/noteStore';
import { NoteService } from '../services/NoteService';

interface SidebarProps {
  width: number;
}

const Sidebar: React.FC<SidebarProps> = ({ width }) => {
  const { notes, selectedNoteId, setNotes, addNote, selectNote, setLoading, isLoading } = useNoteStore();

  // Load notes when component mounts
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const allNotes = await NoteService.getAllNotes();
        setNotes(allNotes);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [setNotes, setLoading]);

  // Handle creating a new note
  const handleCreateNote = async () => {
    try {
      console.log('Sidebar: Creating new note');
      const newNote = await NoteService.createNote({
        title: '新しいノート',
        content: '',
        tags: [],
      });
      console.log('Sidebar: New note created:', newNote);
      addNote(newNote);
      console.log('Sidebar: Note added to store');
    } catch (error) {
      console.error('Failed to create note:', error);
      // Try to get more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Try creating a note with a simpler structure
      try {
        console.log('Sidebar: Trying to create a simpler note');
        const simpleNote = await NoteService.createNote({
          title: 'Simple Note',
          content: 'This is a simple note',
          tags: [],
        });
        console.log('Sidebar: Simple note created:', simpleNote);
        addNote(simpleNote);
      } catch (simpleError) {
        console.error('Failed to create simple note:', simpleError);
      }
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: width,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: width,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleCreateNote}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="新しいノート" />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              ノートがありません
            </Typography>
          </Box>
        ) : (
          <List>
            {notes.map((note) => (
              <ListItem key={note.id} disablePadding>
                <ListItemButton 
                  selected={selectedNoteId === note.id}
                  onClick={() => selectNote(note.id)}
                >
                  <ListItemIcon>
                    <NoteIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={note.title} 
                    primaryTypographyProps={{
                      noWrap: true,
                      title: note.title
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
