'use strict'
// Aggiornamento automatico tramite le release GitHub pubbliche.
//
// Flusso: all'avvio si interroga l'API delle release, si confronta il tag con
// la versione installata, si scarica **solo** il file adatto a questo sistema
// (dmg per macOS, installer NSIS per Windows, AppImage per Linux), quindi si
// chiude l'app e si apre l'installer scaricato.
//
// Scelte esplicite:
// - nessun aggiornamento silenzioso: il file viene aperto dal sistema, la
//   sostituzione la fa l'installer (l'app non modifica il proprio bundle);
// - se è in corso una sessione (`busy`) non si chiude nulla: si aspetta che
//   l'adulto confermi, perché interrompere un esercizio perderebbe il lavoro;
// - senza rete o senza file adatto si resta sulla versione installata e lo si
//   dichiara, senza messaggi di errore invasivi per il bambino.
const { app, shell } = require('electron')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const https = require('node:https')
const { spawn } = require('node:child_process')
const { pickAsset, isNewerVersion, normalizeVersion } = require('./updater-rules.cjs')

const REPO = 'MaestroLivio/semantica-in-gioco'
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`
const USER_AGENT = 'SemanticaInGioco-Updater'
const ALLOWED_RELEASE_PREFIX = 'https://github.com/'

let state = {
  status: 'idle',
  currentVersion: '',
  version: null,
  assetName: null,
  progress: 0,
  notesUrl: null,
  error: null,
  platform: process.platform,
  arch: process.arch,
  canInstall: false,
}

const listeners = new Set()
let settings = { autoCheck: true, autoInstall: true }
let busy = true
let pendingFile = null
let checking = false

function emit(patch) {
  state = { ...state, ...patch, currentVersion: app.getVersion() }
  for (const listener of listeners) {
    try {
      listener(state)
    } catch {
      // Un listener guasto (finestra chiusa) non deve fermare l'aggiornamento.
    }
  }
  return state
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'aggiornamenti.json')
}

function loadSettings() {
  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'))
    settings = { autoCheck: raw.autoCheck !== false, autoInstall: raw.autoInstall !== false }
  } catch {
    settings = { autoCheck: true, autoInstall: true }
  }
  return { ...settings }
}

function saveSettings(patch) {
  settings = {
    autoCheck: patch?.autoCheck === undefined ? settings.autoCheck : patch.autoCheck !== false,
    autoInstall: patch?.autoInstall === undefined ? settings.autoInstall : patch.autoInstall !== false,
  }
  try {
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true })
    fs.writeFileSync(settingsPath(), `${JSON.stringify(settings, null, 2)}\n`)
  } catch {
    // Le preferenze restano valide per la sessione corrente.
  }
  return { ...settings }
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function getJson(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { headers: { 'user-agent': USER_AGENT, accept: 'application/vnd.github+json' } },
      (response) => {
        const status = response.statusCode ?? 0
        if (status >= 300 && status < 400 && response.headers.location && redirects < 5) {
          response.resume()
          const next = new URL(response.headers.location, url).toString()
          resolve(getJson(next, redirects + 1))
          return
        }
        if (status !== 200) {
          response.resume()
          reject(new Error(`GitHub ha risposto ${status}`))
          return
        }
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch {
            reject(new Error('Risposta della release non leggibile'))
          }
        })
        response.on('error', reject)
      },
    )
    request.on('error', reject)
    request.setTimeout(20000, () => request.destroy(new Error('Richiesta scaduta')))
  })
}

function download(asset) {
  const folder = path.join(app.getPath('temp'), 'semantica-in-gioco-aggiornamenti')
  const destination = path.join(folder, path.basename(asset.name))
  return fsp
    .mkdir(folder, { recursive: true })
    .then(() => fsp.rm(destination, { force: true }))
    .then(
      () =>
        new Promise((resolve, reject) => {
          const follow = (url, redirects) => {
            const request = https.get(url, { headers: { 'user-agent': USER_AGENT } }, (response) => {
              const status = response.statusCode ?? 0
              if (status >= 300 && status < 400 && response.headers.location && redirects < 5) {
                response.resume()
                follow(new URL(response.headers.location, url).toString(), redirects + 1)
                return
              }
              if (status !== 200) {
                response.resume()
                reject(new Error(`Download non riuscito (${status})`))
                return
              }
              const total = Number(response.headers['content-length'] ?? asset.size ?? 0)
              let received = 0
              const output = fs.createWriteStream(destination)
              response.on('data', (chunk) => {
                received += chunk.length
                if (total > 0) {
                  emit({ status: 'downloading', progress: Math.min(99, Math.round((received / total) * 100)) })
                }
              })
              response.pipe(output)
              output.on('finish', () => resolve(destination))
              output.on('error', reject)
              response.on('error', reject)
            })
            request.on('error', reject)
            request.setTimeout(60000, () => request.destroy(new Error('Download scaduto')))
          }
          emit({ status: 'downloading', progress: 0 })
          follow(asset.browser_download_url, 0)
        }),
    )
}

/** Scarica l'ultima release, se più recente di quella installata. */
async function check({ autoInstallAfter = true } = {}) {
  if (checking) return state
  if (!app.isPackaged) {
    return emit({ status: 'idle', error: null, version: null, canInstall: false })
  }
  checking = true
  emit({ status: 'checking', error: null, progress: 0, canInstall: false })
  try {
    const release = await withTimeout(getJson(RELEASES_API), 20000, 'GitHub non risponde')
    const tag = normalizeVersion(release?.tag_name)
    if (!tag) throw new Error('La release non ha una versione leggibile')
    const notesUrl = typeof release?.html_url === 'string' ? release.html_url : null
    if (!isNewerVersion(tag, app.getVersion())) {
      return emit({ status: 'up-to-date', version: tag, notesUrl, progress: 0 })
    }
    const asset = pickAsset(release.assets, process.platform, process.arch)
    if (!asset) {
      return emit({
        status: 'unsupported',
        version: tag,
        notesUrl,
        error: `Nessun file per ${process.platform} ${process.arch}`,
      })
    }
    emit({ status: 'available', version: tag, assetName: asset.name, notesUrl, progress: 0 })
    pendingFile = await download(asset)
    emit({ status: 'ready', progress: 100, canInstall: true })
    // Chiusura automatica solo se l'adulto non sta lavorando e l'ha consentito.
    if (autoInstallAfter && settings.autoInstall) {
      setTimeout(() => {
        if (!busy) installNow()
      }, 4000)
    }
    return state
  } catch (error) {
    return emit({ status: 'error', error: String(error?.message ?? error), canInstall: false })
  } finally {
    checking = false
  }
}

/** Chiude l'app e apre l'installer già scaricato. */
function installNow() {
  if (!pendingFile) return { ok: false, error: 'Nessun aggiornamento scaricato' }
  if (busy) return { ok: false, error: 'Sessione in corso' }
  const file = pendingFile
  emit({ status: 'installing' })
  setTimeout(() => {
    try {
      if (process.platform === 'darwin') {
        // Apre il .dmg: l'adulto trascina l'app in Applicazioni.
        void shell.openPath(file)
      } else {
        if (process.platform !== 'win32') fs.chmodSync(file, 0o755)
        spawn(file, [], { detached: true, stdio: 'ignore' }).unref()
      }
    } catch (error) {
      emit({ status: 'error', error: String(error?.message ?? error) })
      return
    }
    app.quit()
  }, 300)
  return { ok: true }
}

function setBusy(value) {
  busy = Boolean(value)
  return busy
}

function subscribe(listener) {
  listeners.add(listener)
  listener(state)
  return () => listeners.delete(listener)
}

function openRelease(url) {
  if (typeof url === 'string' && url.startsWith(ALLOWED_RELEASE_PREFIX)) void shell.openExternal(url)
}

module.exports = {
  REPO,
  check,
  installNow,
  setBusy,
  subscribe,
  loadSettings,
  saveSettings,
  openRelease,
  getSettings: () => ({ ...settings }),
  getState: () => ({ ...state, currentVersion: app.getVersion() }),
}
