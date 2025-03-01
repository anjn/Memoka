import { defineConfig } from 'vite';
import path from 'path';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: [
        'src/main/main.ts',
        'src/preload/preload.ts'
      ]
    }),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@components': path.resolve(__dirname, './src/renderer/components'),
      '@hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@store': path.resolve(__dirname, './src/renderer/store'),
      '@styles': path.resolve(__dirname, './src/renderer/styles'),
      '@types': path.resolve(__dirname, './src/renderer/types'),
      '@utils': path.resolve(__dirname, './src/renderer/utils')
    }
  }
});
