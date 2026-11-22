const { contextBridge, ipcRenderer } = require('electron');

const IN = ['settings', 'media', 'art', 'lyrics', 'live-pos', 'live-box', 'audio-frame'];
const OUT = ['layout', 'live-pos', 'live-box', 'prefs', 'ignore', 'edit-done', 'audio-frame', 'audio-retry'];

contextBridge.exposeInMainWorld('halo', {
  on: (channel, cb) => {
    if (IN.includes(channel)) ipcRenderer.on(channel, (_e, data) => cb(data));
  },
  send: (channel, data) => {
    if (OUT.includes(channel)) ipcRenderer.send(channel, data);
  },
});
