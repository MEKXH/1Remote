import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import squirrelStartup from 'electron-squirrel-startup';
import { IpcClient } from './ipc-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendClient = new IpcClient('1Remote_IPC');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrelStartup) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden', // Better for custom titlebars
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Check if we are in development mode
  const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL;

  if (isDev) {
    // Load the URL of the development server
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    // Load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

// IPC Handlers
ipcMain.handle('backend:getServers', async () => {
  try {
    return await backendClient.send('getServers');
  } catch (error) {
    console.error('Failed to get servers from backend:', error);
    return [];
  }
});

ipcMain.handle('backend:getTags', async () => {
  try {
    return await backendClient.send('getTags');
  } catch (error) {
    console.error('Failed to get tags from backend:', error);
    return [];
  }
});

ipcMain.handle('backend:getLocalDataSourceStatus', async () => {
  try {
    return await backendClient.send('getLocalDataSourceStatus');
  } catch (error) {
    console.error('Failed to get local data source status:', error);
    return null;
  }
});

ipcMain.handle('backend:connect', async (_, serverId: string) => {
  try {
    return await backendClient.send('connect', serverId);
  } catch (error) {
    console.error(`Failed to connect to ${serverId}:`, error);
    return false;
  }
});

ipcMain.handle('backend:addServer', async (_, server: any) => {
  try {
    // If params is an object, IpcClient will serialize it as JSON object in 'params' field.
    // Backend receives it as JObject (if using Newtonsoft) and .ToString() converts it back to JSON string.
    return await backendClient.send('addServer', server);
  } catch (error) {
    console.error('Failed to add server:', error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('backend:deleteServer', async (_, serverId: string) => {
  try {
    return await backendClient.send('deleteServer', serverId);
  } catch (error) {
    console.error('Failed to delete server:', error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('backend:duplicateServer', async (_, serverId: string) => {
  try {
    return await backendClient.send('duplicateServer', serverId);
  } catch (error) {
    console.error('Failed to duplicate server:', error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('backend:getServer', async (_, serverId: string) => {
  try {
    return await backendClient.send('getServer', serverId);
  } catch (error) {
    console.error(`Failed to get server ${serverId}:`, error);
    return null;
  }
});

ipcMain.handle('backend:getDashboardStats', async () => {
  try {
    return await backendClient.send('getDashboardStats');
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return { ActiveSessions: 0, TotalServers: 0, Favorites: 0, Recent: 0 };
  }
});

ipcMain.handle('backend:reloadServers', async () => {
  try {
    return await backendClient.send('reloadServers');
  } catch (error) {
    console.error('Failed to reload servers:', error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('backend:getActiveSessions', async () => {
  try {
    return await backendClient.send('getActiveSessions');
  } catch (error) {
    console.error('Failed to get active sessions:', error);
    return [];
  }
});

ipcMain.handle('backend:closeSession', async (_, connectionId: string) => {
  try {
    return await backendClient.send('closeSession', connectionId);
  } catch (error) {
    console.error(`Failed to close session ${connectionId}:`, error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('backend:reconnectSession', async (_, connectionId: string) => {
  try {
    return await backendClient.send('reconnectSession', connectionId);
  } catch (error) {
    console.error(`Failed to reconnect session ${connectionId}:`, error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('backend:updateServer', async (_, serverId: string, server: any) => {
  try {
    return await backendClient.send('updateServer', { serverId, server });
  } catch (error) {
    console.error(`Failed to update server ${serverId}:`, error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('backend:getGeneralSettings', async () => {
  try {
    return await backendClient.send('getGeneralSettings');
  } catch (error) {
    console.error('Failed to get general settings:', error);
    return null;
  }
});

ipcMain.handle('backend:updateGeneralSettings', async (_, settings: any) => {
  try {
    return await backendClient.send('updateGeneralSettings', settings);
  } catch (error) {
    console.error('Failed to update general settings:', error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('backend:getThemeSettings', async () => {
  try {
    return await backendClient.send('getThemeSettings');
  } catch (error) {
    console.error('Failed to get theme settings:', error);
    return null;
  }
});

ipcMain.handle('backend:updateThemeSettings', async (_, settings: any) => {
  try {
    return await backendClient.send('updateThemeSettings', settings);
  } catch (error) {
    console.error('Failed to update theme settings:', error);
    return { IsSuccess: false, ErrorInfo: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('os:getNetworkInterfaces', () => {
  return os.networkInterfaces();
});

// Window Controls
ipcMain.on('window:minimize', () => {
  const win = BrowserWindow.getFocusedWindow();
  win?.minimize();
});

ipcMain.on('window:maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window:close', () => {
  const win = BrowserWindow.getFocusedWindow();
  win?.close();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  console.log('--------------------------------------------------');
  console.log('1Remote Electron UI is starting...');
  console.log('Build Time:', new Date().toLocaleString());
  console.log('--------------------------------------------------');
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
