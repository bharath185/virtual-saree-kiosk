const { app, BrowserWindow, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    minWidth: 540,
    minHeight: 960,
    resizable: true,
    fullscreenable: true,
    autoHideMenuBar: true,
    frame: false, // borderless kiosk window
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // allow local file/webcam access in kiosk
      backgroundThrottling: false // Keep WebGL active at 60fps in kiosk
    },
    backgroundColor: '#050508'
  });

  // Automatically approve camera & media permissions for kiosk mode
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'camera' || permission === 'videoCapture') {
      callback(true);
      return;
    }
    callback(false);
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (isDev) {
    mainWindow.loadURL(devUrl);
    // Open DevTools with F12 shortcut if needed
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        mainWindow.webContents.toggleDevTools();
      }
      if (input.key === 'F11') {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
