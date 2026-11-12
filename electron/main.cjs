// Processo principale dell'app desktop. La build statica di Vite viene servita
// da un protocollo interno (app://bundle) e non da file://: i moduli ES e i
// worker, da file://, verrebbero bloccati dalle regole CORS del browser.
const { app, BrowserWindow, Menu, shell, dialog, protocol } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

const APP_NAME = 'Semantica in Gioco'
const APP_ORIGIN = 'app://bundle'
const isMac = process.platform === 'darwin'
const DIST = path.join(__dirname, '..', 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  // Motore vocale neurale: WebAssembly e dati del phonemizer.
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.onnx': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

// Deve essere chiamato prima di app.whenReady().
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
])

// Un solo processo alla volta: due istanze sullo stesso profilo IndexedDB
// potrebbero sovrascriversi i salvataggi.
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

let mainWindow = null

function serveBuild() {
  protocol.handle('app', async (request) => {
    try {
      const { pathname } = new URL(request.url)
      const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname)
      const filePath = path.normalize(path.join(DIST, relative))
      if (filePath !== DIST && !filePath.startsWith(DIST + path.sep)) {
        return new Response('Accesso non consentito', { status: 403 })
      }
      const data = await fs.readFile(filePath)
      const type = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
      return new Response(data, { headers: { 'content-type': type } })
    } catch {
      return new Response('Risorsa non trovata', { status: 404 })
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#f6f2e9',
    title: APP_NAME,
    show: false,
    autoHideMenuBar: !isMac,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Il contenuto è locale: i link esterni si aprono nel browser di sistema.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_ORIGIN)) {
      event.preventDefault()
      if (url.startsWith('http:') || url.startsWith('https:')) void shell.openExternal(url)
    }
  })

  mainWindow.loadURL(`${APP_ORIGIN}/index.html`).catch((error) => {
    dialog.showErrorBox(
      'Impossibile avviare Semantica in Gioco',
      `La build dell'app non è stata trovata o non è leggibile.\n\n${DIST}\n\n${String(error)}`,
    )
    app.quit()
  })
}

function buildMenu() {
  const template = [
    ...(isMac
      ? [
          {
            label: APP_NAME,
            submenu: [
              { role: 'about', label: `Informazioni su ${APP_NAME}` },
              { type: 'separator' },
              { role: 'hide', label: 'Nascondi' },
              { role: 'hideOthers', label: 'Nascondi gli altri' },
              { role: 'unhide', label: 'Mostra tutti' },
              { type: 'separator' },
              { role: 'quit', label: 'Esci da Semantica in Gioco' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Stampa / PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.print({}),
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Chiudi finestra' } : { role: 'quit', label: 'Esci' },
      ],
    },
    {
      label: 'Modifica',
      submenu: [
        { role: 'undo', label: 'Annulla' },
        { role: 'redo', label: 'Ripeti' },
        { type: 'separator' },
        { role: 'cut', label: 'Taglia' },
        { role: 'copy', label: 'Copia' },
        { role: 'paste', label: 'Incolla' },
        { role: 'selectAll', label: 'Seleziona tutto' },
      ],
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload', label: 'Ricarica' },
        { role: 'resetZoom', label: 'Dimensione normale' },
        { role: 'zoomIn', label: 'Ingrandisci' },
        { role: 'zoomOut', label: 'Riduci' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Schermo intero' },
        { role: 'toggleDevTools', label: 'Strumenti di sviluppo' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.whenReady().then(() => {
  app.setName(APP_NAME)
  serveBuild()
  buildMenu()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})

// Nessuna navigazione verso contenuti remoti: l'app è interamente locale.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault())
})
