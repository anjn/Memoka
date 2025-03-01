/**
 * @file Settings Dialog component
 * @AI-CONTEXT This file contains the settings dialog component for the application
 */

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
