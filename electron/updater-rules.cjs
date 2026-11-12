'use strict'
// Regole pure dell'aggiornamento: confronto delle versioni e scelta del file
// adatto al sistema operativo. Stanno qui, separate da Electron, per poter
// essere verificate dai test senza avviare l'app.

/** Toglie il prefisso `v` e valida la forma della versione. */
function normalizeVersion(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/^v/i, '')
  return /^\d+(\.\d+){0,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(trimmed) ? trimmed : null
}

function versionParts(value) {
  const normalized = normalizeVersion(value)
  if (!normalized) return null
  const dash = normalized.indexOf('-')
  const core = dash === -1 ? normalized.split('+')[0] : normalized.slice(0, dash)
  const pre = dash === -1 ? '' : normalized.slice(dash + 1)
  return { numbers: core.split('.').map((part) => Number.parseInt(part, 10) || 0), pre }
}

/**
 * Confronta due versioni: -1 se `a` precede `b`, 0 se sono uguali, 1 se segue.
 * Una versione con suffisso (`1.2.0-beta`) precede la stessa senza suffisso.
 */
function compareVersions(a, b) {
  const left = versionParts(a)
  const right = versionParts(b)
  if (!left || !right) throw new Error(`Versione non valida: ${!left ? a : b}`)
  const length = Math.max(left.numbers.length, right.numbers.length)
  for (let index = 0; index < length; index += 1) {
    const x = left.numbers[index] ?? 0
    const y = right.numbers[index] ?? 0
    if (x !== y) return x < y ? -1 : 1
  }
  if (left.pre === right.pre) return 0
  if (!left.pre) return 1
  if (!right.pre) return -1
  return left.pre < right.pre ? -1 : 1
}

function isNewerVersion(candidate, current) {
  try {
    return compareVersions(candidate, current) > 0
  } catch {
    return false
  }
}

// I nomi dei file sono quelli generati da electron-builder:
// semantica-in-gioco-1.2.0-mac-arm64.dmg
// semantica-in-gioco-1.2.0-windows-x64-installer.exe
// semantica-in-gioco-1.2.0-linux-amd64.AppImage
const LINUX_ARCH = { x64: ['amd64', 'x86_64'], arm64: ['arm64', 'aarch64'] }

function nameOf(asset) {
  return typeof asset?.name === 'string' ? asset.name.toLowerCase() : ''
}

function usableAssets(assets) {
  if (!Array.isArray(assets)) return []
  return assets.filter(
    (asset) => asset && typeof asset.name === 'string' && typeof asset.browser_download_url === 'string',
  )
}

/**
 * Sceglie il file d'installazione per la piattaforma e l'architettura correnti.
 * Restituisce `null` se la release non contiene un file adatto: meglio dirlo
 * che scaricare il pacchetto sbagliato.
 */
function pickAsset(assets, platform, arch) {
  const list = usableAssets(assets)
  if (platform === 'darwin') {
    const wanted = `mac-${arch}`
    const dmg = list.find((asset) => nameOf(asset).endsWith('.dmg') && nameOf(asset).includes(wanted))
    if (dmg) return dmg
    const zip = list.find((asset) => nameOf(asset).endsWith('.zip') && nameOf(asset).includes(wanted))
    return zip ?? null
  }
  if (platform === 'win32') {
    const installer = list.find(
      (asset) => nameOf(asset).endsWith(`windows-${arch}-installer.exe`) && nameOf(asset).includes('semantica'),
    )
    if (installer) return installer
    return (
      list.find(
        (asset) =>
          nameOf(asset).endsWith('.exe') &&
          nameOf(asset).includes(`windows-${arch}`) &&
          nameOf(asset).includes('semantica'),
      ) ?? null
    )
  }
  if (platform === 'linux') {
    const names = LINUX_ARCH[arch] ?? [arch]
    return (
      list.find((asset) => {
        const name = nameOf(asset)
        return name.endsWith('.appimage') && names.some((alias) => name.includes(alias))
      }) ?? null
    )
  }
  return null
}

module.exports = { normalizeVersion, compareVersions, isNewerVersion, pickAsset }
