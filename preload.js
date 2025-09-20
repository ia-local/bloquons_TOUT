// File: preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendAnalyzeImage: (url) => ipcRenderer.send('analyze-image', url),
  onImageAnalysisResult: (callback) => ipcRenderer.on('image-analysis-result', (event, report) => callback(report)),
  onImageAnalysisError: (callback) => ipcRenderer.on('image-analysis-error', (event, error) => callback(error))
});