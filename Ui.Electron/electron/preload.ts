// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require('electron') as typeof import('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    getServers: () => ipcRenderer.invoke('backend:getServers'),

    getTags: () => ipcRenderer.invoke('backend:getTags'),

    getServer: (serverId: string) => ipcRenderer.invoke('backend:getServer', serverId),

    getDashboardStats: () => ipcRenderer.invoke('backend:getDashboardStats'),

    connect: (serverId: string) => ipcRenderer.invoke('backend:connect', serverId),

    addServer: (server: any) => ipcRenderer.invoke('backend:addServer', server),

    deleteServer: (serverId: string) => ipcRenderer.invoke('backend:deleteServer', serverId),

    duplicateServer: (serverId: string) => ipcRenderer.invoke('backend:duplicateServer', serverId),

    updateServer: (serverId: string, server: any) => ipcRenderer.invoke('backend:updateServer', serverId, server),

    getGeneralSettings: () => ipcRenderer.invoke('backend:getGeneralSettings'),

    updateGeneralSettings: (settings: any) => ipcRenderer.invoke('backend:updateGeneralSettings', settings),

    getThemeSettings: () => ipcRenderer.invoke('backend:getThemeSettings'),

    updateThemeSettings: (settings: any) => ipcRenderer.invoke('backend:updateThemeSettings', settings),

    getNetworkInterfaces: () => ipcRenderer.invoke('os:getNetworkInterfaces'),

    minimize: () => ipcRenderer.send('window:minimize'),

    maximize: () => ipcRenderer.send('window:maximize'),

    close: () => ipcRenderer.send('window:close'),

});
