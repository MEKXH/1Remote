// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require('electron') as typeof import('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getServers: () => ipcRenderer.invoke('backend:getServers'),
    connect: (serverId: string) => ipcRenderer.invoke('backend:connect', serverId),
});