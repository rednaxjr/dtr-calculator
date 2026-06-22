const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

function loadConfig(configPath) {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[Config] Failed to read config.json:', e.message);
    return {};
  }
}

function createWindow() {
  const configPath = path.join(process.resourcesPath, 'config.json');
  let config = loadConfig(configPath);
  console.log('[Config] Loaded at startup:', config);

  const win = new BrowserWindow({
    width: 1920,
    height: 1280,
    icon: path.join(__dirname, '../src/assets/icon.ico'),
    title: 'Digital Signature',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      additionalArguments: [`--config=${JSON.stringify(config)}`]
    }
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, '../dist/frontend/browser/index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  win.webContents.on('before-input-event', (event, input) => {
    if ((input.key === 'r' && input.control) || input.key === 'F5') {
      event.preventDefault();
    }
  });

  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }

  let debounceTimer = null;
  fs.watch(configPath, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const newConfig = loadConfig(configPath);
      console.log('[Config] Change detected in config.json:', newConfig);
      win.webContents.send('config-updated', newConfig);
    }, 300);
  });

  ipcMain.handle('list-pdfs', async (_event, folderPath, signatureDir) => {
    if (!folderPath || !fs.existsSync(folderPath)) return [];
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
      .map(e => {
        const fullPath = path.join(folderPath, e.name);
        const stats = fs.statSync(fullPath);
        const stem = e.name.replace(/\.pdf$/i, '');
        const sigPath = signatureDir ? path.join(signatureDir, stem, stem + '.png') : null;
        const hasSignature = sigPath && fs.existsSync(sigPath);
        return {
          name: e.name,
          path: fullPath,
          url: 'file:///' + fullPath.replace(/\\/g, '/'),
          size: stats.size,
          modified: stats.mtime,
          signatureCount: hasSignature ? 1 : 0,
          signatures: hasSignature ? [{ url: 'file:///' + sigPath.replace(/\\/g, '/') }] : [],
        };
      });
  });

  ipcMain.handle('read-pdf', async (_event, filePath) => {
    const data = fs.readFileSync(filePath);
    return data.toString('base64');
  });

  ipcMain.handle('delete-pdf', async (_event, filePath) => {
    fs.unlinkSync(filePath);
  });

  ipcMain.handle('save-signature', async (_event, signatureDir, stem, base64Data) => {
    const folder = path.join(signatureDir, stem);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, stem + '.png'), Buffer.from(base64Data, 'base64'));
  });

  ipcMain.handle('delete-signature', async (_event, signatureDir, stem) => {
    const folder = path.join(signatureDir, stem);
    if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});