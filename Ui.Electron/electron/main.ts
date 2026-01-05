import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
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

ipcMain.handle('backend:connect', async (_, serverId: string) => {
  try {
    return await backendClient.send('connect', serverId);
  } catch (error) {
    console.error(`Failed to connect to ${serverId}:`, error);
    return false;
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

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
