/**
 * @file Theme provider component
 * @AI-CONTEXT This file contains the theme provider component for Material UI
 */

import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from '../styles/theme';
import { useSettingsStore } from '../store/settingsStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useSettingsStore((state) => state.theme);
  const muiTheme = React.useMemo(() => getTheme(theme), [theme]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
