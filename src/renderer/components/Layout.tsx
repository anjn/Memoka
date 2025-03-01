/**
 * @file Layout component
 * @AI-CONTEXT This file contains the main layout component for the application
 */

import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import { ThemeProvider } from './ThemeProvider';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSettingsStore } from '../store/settingsStore';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const sidebarWidth = useSettingsStore((state) => state.sidebarWidth);

  return (
    <ThemeProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <Sidebar width={sidebarWidth} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              overflow: 'auto',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
