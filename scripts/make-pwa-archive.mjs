// Crea release/semantica-in-gioco-pwa.zip con la build statica.
// Serve per l'installazione come PWA (ChromeOS, Chrome/Edge) da un hosting HTTPS.
import { mkdir, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
const outDir = path.join(root, 'release')
const out = path.join(outDir, 'semantica-in-gioco-pwa.zip')

try {
  const info = await stat(path.join(dist, 'index.html'))
  if (!info.isFile()) throw new Error('index.html non è un file')
} catch {
  console.error('Build non trovata: esegui prima "npm run build".')
  process.exit(1)
}

await mkdir(outDir, { recursive: true })

const zip = spawnSync('zip', ['-r', '-q', '-X', out, '.'], { cwd: dist, stdio: 'inherit' })
if (zip.error) {
  console.error('Comando "zip" non disponibile. Su Windows usa: Compress-Archive -Path dist\\* -DestinationPath release\\semantica-in-gioco-pwa.zip')
  process.exit(1)
}
if (zip.status !== 0) {
  console.error(`Creazione archivio non riuscita (codice ${zip.status}).`)
  process.exit(zip.status ?? 1)
}

console.log(`Archivio PWA creato: ${path.relative(root, out)}`)
