/**
 * @file Editor component
 * @AI-CONTEXT This file contains the editor component for the application
 */

import React from 'react';
import { Box, Paper, TextField, Typography } from '@mui/material';

const Editor: React.FC = () => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h6" color="text.secondary">
        Editor
      </Typography>
      <TextField
        label="Title"
        variant="outlined"
        fullWidth
        placeholder="Enter note title"
      />
      <TextField
        label="Content"
        variant="outlined"
        multiline
        rows={15}
        fullWidth
        placeholder="Enter note content"
        sx={{ flexGrow: 1 }}
      />
    </Paper>
  );
};

export default Editor;
