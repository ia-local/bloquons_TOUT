// Fichier : main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { analyzeImageWithAI } = require('./visionai.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // <-- Ajout de cette ligne
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  win.loadURL('http://localhost:3000/index.html');

  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.on('analyze-image', async (event, imageUrl) => {
    try {
      const report = await analyzeImageWithAI(imageUrl);
      event.sender.send('image-analysis-result', report);
    } catch (error) {
      event.sender.send('image-analysis-error', `Échec de l'analyse de l'image: ${error.message}`);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});