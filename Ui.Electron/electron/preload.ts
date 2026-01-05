// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Example: send a message to the main process
    // sendMessage: (message: string) => ipcRenderer.send('message-channel', message),
    // Example: receive a message from the main process
    // onReceiveMessage: (callback: (message: string) => void) => ipcRenderer.on('message-channel', (_event, value) => callback(value))
});
