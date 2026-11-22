'use strict'
// Hook di electron-builder (`afterExtract` e `afterPack`).
//
// Sui volumi ExFAT (questo progetto vive su /Volumes/Livio) macOS crea un file
// AppleDouble `._nome` accanto a ogni file copiato. Dentro il bundle Electron
// finisce così un `._app.asar` da 4 KB che electron-builder tenta di leggere
// come archivio asar e fa fallire la build con:
//   RangeError: The value of "offset" is out of range ... readAsarHeader
// Qui si eliminano quei file (e i .DS_Store) subito dopo l'estrazione e di
// nuovo prima di creare il pacchetto, così non entrano nel DMG o nell'EXE.
const fs = require('node:fs')
const path = require('node:path')

function isJunk(name) {
  return name.startsWith('._') || name === '.DS_Store'
}

function strip(dir) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return 0
  }
  let removed = 0
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (isJunk(entry.name)) {
      try {
        fs.rmSync(full, { recursive: true, force: true })
        removed += 1
      } catch {
        // Un file bloccato non deve fermare la pacchettizzazione.
      }
      continue
    }
    if (entry.isDirectory()) removed += strip(full)
  }
  return removed
}

async function hook(context) {
  const removed = strip(context.appOutDir)
  if (removed > 0) {
    console.log(`  • rimossi ${removed} file AppleDouble da ${context.appOutDir}`)
  }
}

module.exports = hook
module.exports.default = hook
