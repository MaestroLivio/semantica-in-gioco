'use strict'
// Hook `afterSign` di electron-builder.
//
// macOS rifiuta con "danneggiato" un bundle arm64 con la sola firma del linker
// (`Sealed Resources=none`). Con `identity: null` electron-builder non firma,
// quindi applichiamo una firma ad-hoc **dopo** la creazione e la verifica
// dell'archivio asar: firmare in `afterPack` può creare file AppleDouble
// `._app.asar` che electron-builder confonde con un archivio da leggere.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

function adhocSign(context) {
  if (process.platform !== 'darwin') return
  const product = context.packager?.appInfo?.productFilename
  if (!product) return
  const appPath = path.join(context.appOutDir, `${product}.app`)
  if (!fs.existsSync(appPath)) return
  try {
    execFileSync('xattr', ['-cr', appPath], { stdio: 'ignore' })
  } catch {
    // Nessun attributo da rimuovere.
  }
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' })
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' })
  console.log(`  • firma ad-hoc applicata a ${appPath}`)
}

module.exports = adhocSign
module.exports.default = adhocSign
