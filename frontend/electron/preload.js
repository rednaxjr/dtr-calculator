const { contextBridge, ipcRenderer } = require('electron');

const configArg = process.argv.find(arg => arg.startsWith('--config='));
const config = configArg ? JSON.parse(configArg.replace('--config=', '')) : {};

contextBridge.exposeInMainWorld('electronAPI', {
  listPdfs: (folderPath, signatureDir) => ipcRenderer.invoke('list-pdfs', folderPath, signatureDir),
  readPdf: (filePath) => ipcRenderer.invoke('read-pdf', filePath),
  deletePdf: (filePath) => ipcRenderer.invoke('delete-pdf', filePath),
  saveSignature: (signatureDir, stem, base64Data) => ipcRenderer.invoke('save-signature', signatureDir, stem, base64Data),
  deleteSignature: (signatureDir, stem) => ipcRenderer.invoke('delete-signature', signatureDir, stem),
  onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (_event, newConfig) => callback(newConfig)),
  config: config,
});