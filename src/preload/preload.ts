/**
 * @file Preload script
 * @AI-CONTEXT This file contains the preload script for the Electron app
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => listener(...args));
    return () => ipcRenderer.removeListener(channel, listener);
  },
  once: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (event, ...args) => listener(...args));
  },
});
