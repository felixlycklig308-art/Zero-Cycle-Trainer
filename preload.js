const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('zeroUpdates', Object.freeze({
 check: () => ipcRenderer.invoke('updates:check'),
 install: () => ipcRenderer.send('updates:install'),
 onStatus: callback => ipcRenderer.on('update-status', (_event, data) => callback(data))
}));
