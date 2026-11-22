const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hs', {
  init: () => ipcRenderer.invoke('hs-init'),
  onState: (cb) => ipcRenderer.on('state', (_e, d) => cb(d)),
  onMeta: (cb) => ipcRenderer.on('meta', (_e, d) => cb(d)),
  set: (patch) => ipcRenderer.send('hs-set', patch),
  act: (name) => ipcRenderer.send('hs-act', name),
});
