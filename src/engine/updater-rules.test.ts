// Regole dell'auto-aggiornamento: confronto versioni e scelta del file.
// Il modulo vive in electron/ (JavaScript per il processo principale), quindi
// si carica qui con `require` invece di importarlo come modulo ES.
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const rules = require('../../electron/updater-rules.cjs') as {
  normalizeVersion: (value: unknown) => string | null
  compareVersions: (a: string, b: string) => number
  isNewerVersion: (candidate: string, current: string) => boolean
  pickAsset: (
    assets: { name: string; browser_download_url: string }[],
    platform: string,
    arch: string,
  ) => { name: string } | null
}

const asset = (name: string) => ({ name, browser_download_url: `https://example.test/${name}` })

describe('versioni', () => {
  it('normalizza prefisso e spazi', () => {
    expect(rules.normalizeVersion(' v1.2.0 ')).toBe('1.2.0')
    expect(rules.normalizeVersion('1.2')).toBe('1.2')
    expect(rules.normalizeVersion('versione')).toBeNull()
    expect(rules.normalizeVersion(undefined)).toBeNull()
  })

  it('confronta i numeri, non le stringhe', () => {
    expect(rules.compareVersions('1.2.10', '1.2.9')).toBe(1)
    expect(rules.compareVersions('1.10.0', '1.9.9')).toBe(1)
    expect(rules.compareVersions('1.2', '1.2.0')).toBe(0)
    expect(rules.compareVersions('2.0.0', '2.0.1')).toBe(-1)
  })

  it('considera una prerelease precedente alla versione stabile', () => {
    expect(rules.compareVersions('1.3.0-beta.1', '1.3.0')).toBe(-1)
    expect(rules.compareVersions('1.3.0', '1.3.0-beta.1')).toBe(1)
  })

  it('riconosce solo le versioni più recenti', () => {
    expect(rules.isNewerVersion('v1.3.0', '1.2.0')).toBe(true)
    expect(rules.isNewerVersion('1.2.0', '1.2.0')).toBe(false)
    expect(rules.isNewerVersion('1.1.9', '1.2.0')).toBe(false)
    expect(rules.isNewerVersion('non-una-versione', '1.2.0')).toBe(false)
  })
})

describe('scelta del file di installazione', () => {
  const release = [
    asset('semantica-in-gioco-1.3.0-mac-arm64.dmg'),
    asset('semantica-in-gioco-1.3.0-mac-arm64.zip'),
    asset('semantica-in-gioco-1.3.0-mac-x64.dmg'),
    asset('semantica-in-gioco-1.3.0-windows-x64-installer.exe'),
    asset('semantica-in-gioco-1.3.0-linux-amd64.AppImage'),
    asset('semantica-in-gioco-1.3.0-web.zip'),
  ]

  it('su Mac Apple Silicon prende il dmg arm64, non quello Intel', () => {
    const chosen = rules.pickAsset(release, 'darwin', 'arm64')
    expect(chosen?.name).toBe('semantica-in-gioco-1.3.0-mac-arm64.dmg')
  })

  it('su Mac Intel prende il dmg x64', () => {
    const chosen = rules.pickAsset(release, 'darwin', 'x64')
    expect(chosen?.name).toBe('semantica-in-gioco-1.3.0-mac-x64.dmg')
  })

  it('su Windows prende l’installer NSIS x64, non lo zip web', () => {
    const chosen = rules.pickAsset(release, 'win32', 'x64')
    expect(chosen?.name).toBe('semantica-in-gioco-1.3.0-windows-x64-installer.exe')
  })

  it('su Linux riconosce amd64 come x64', () => {
    const chosen = rules.pickAsset(release, 'linux', 'x64')
    expect(chosen?.name).toBe('semantica-in-gioco-1.3.0-linux-amd64.AppImage')
  })

  it('senza file adatto non scarica nulla', () => {
    expect(rules.pickAsset(release, 'darwin', 'ia32')).toBeNull()
    expect(rules.pickAsset([asset('semantica-in-gioco-1.3.0-web.zip')], 'win32', 'x64')).toBeNull()
    expect(rules.pickAsset([], 'linux', 'arm64')).toBeNull()
    expect(rules.pickAsset(undefined as never, 'linux', 'arm64')).toBeNull()
  })

  it('su Mac accetta lo zip se manca il dmg', () => {
    const chosen = rules.pickAsset([asset('semantica-in-gioco-1.3.0-mac-arm64.zip')], 'darwin', 'arm64')
    expect(chosen?.name).toBe('semantica-in-gioco-1.3.0-mac-arm64.zip')
  })
})
