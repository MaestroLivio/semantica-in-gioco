'use strict'
// Ponte fra il processo principale e l'interfaccia. Il renderer non ha accesso
// a Node: vede solo queste funzioni, tutte legate all'aggiornamento.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('semantica', {
  platform: process.platform,
  arch: process.arch,
  updates: {
    status: () => ipcRenderer.invoke('updates:status'),
    check: () => ipcRenderer.invoke('updates:check'),
    install: () => ipcRenderer.invoke('updates:install'),
    settings: () => ipcRenderer.invoke('updates:settings'),
    setSettings: (patch) => ipcRenderer.invoke('updates:settings:set', patch),
    openRelease: (url) => ipcRenderer.send('updates:open-release', url),
    setBusy: (value) => ipcRenderer.send('updates:busy', Boolean(value)),
    onChange: (listener) => {
      const handler = (_event, next) => listener(next)
      ipcRenderer.on('updates:status', handler)
      return () => ipcRenderer.removeListener('updates:status', handler)
    },
  },
})
