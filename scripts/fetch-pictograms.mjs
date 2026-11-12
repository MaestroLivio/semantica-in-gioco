// Scarica i pittogrammi ARASAAC per l'inventario lessicale.
//
// Licenza: i pittogrammi sono di Sergio Palao per ARASAAC (Governo di Aragona),
// distribuiti con licenza CC BY-NC-SA 4.0 — https://arasaac.org/terms-of-use
// L'applicazione li usa in contesto educativo non commerciale, con attribuzione
// visibile nella schermata "Informazioni e licenze" e nei documenti del progetto.
//
// Uso: node scripts/fetch-pictograms.mjs [--force]
import { KEYWORDS } from './lexicon-keywords.mjs'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const OUT = 'public/pictograms'
const MAP = 'src/data/stimuli.json'
const force = process.argv.includes('--force')
mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function search(rawTerm) {
  // Un prefisso di lingua (es. "es:") permette di cercare un concetto assente
  // nelle traduzioni italiane di ARASAAC, mantenendo l'etichetta italiana nel lessico.
  let locale = 'it'
  let term = rawTerm
  const match = /^([a-z]{2}):(.+)$/.exec(rawTerm)
  if (match) {
    locale = match[1]
    term = match[2]
  }
  const url = `https://api.arasaac.org/api/pictograms/${locale}/search/${encodeURIComponent(term)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json = await res.json()
  if (!Array.isArray(json)) return []
  return json.filter((p) => p && typeof p._id === 'number')
}

// I pittogrammi sono salvati in WebP: l'app li serve così, e il formato riduce
// il peso dell'archivio di circa venti volte rispetto ai PNG originali.
// Richiede `cwebp` (Homebrew: `brew install webp`).
function encodeWebp(file, pngBuffer) {
  execFileSync('cwebp', ['-quiet', '-q', '78', '-m', '6', '-o', file, '--', '-'], { input: pngBuffer })
}

async function download(id) {
  const file = join(OUT, `${id}.webp`)
  if (existsSync(file) && !force) return true
  const res = await fetch(`https://static.arasaac.org/pictograms/${id}/${id}_300.png`)
  if (!res.ok) return false
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 800) return false
  try {
    encodeWebp(file, buf)
  } catch {
    problems.push(`${id}: conversione WebP non riuscita (cwebp installato?)`)
    return false
  }
  return true
}

const map = {}
const problems = []
const ids = Object.keys(KEYWORDS)
let done = 0

for (const id of ids) {
  const terms = KEYWORDS[id]
  let chosen = []
  for (const term of terms) {
    try {
      const results = await search(term)
      if (results.length) {
        // Prima rappresentazione: il risultato migliore. Rappresentazioni alternative:
        // risultati con stile diverso (schematico/non schematico) per la generalizzazione.
        const primary = results[0]
        const alt = results.find((r) => r._id !== primary._id && r.schematic !== primary.schematic && !r.violence)
        chosen = [primary._id]
        if (alt) chosen.push(alt._id)
        break
      }
    } catch (e) {
      problems.push(`${id}: errore rete su "${term}" (${e.message})`)
    }
    await sleep(120)
  }
  if (!chosen.length) {
    problems.push(`${id}: nessun risultato`)
    continue
  }
  let ok = false
  for (const pid of chosen) {
    if (await download(pid)) {
      if (!ok) map[id] = { pictogram: pid, alts: [] }
      else map[id].alts.push(pid)
      ok = true
    }
    await sleep(60)
  }
  if (!ok) problems.push(`${id}: download fallito`)
  done++
  if (done % 20 === 0) console.log(`... ${done}/${ids.length}`)
  await sleep(80)
}

// unione con eventuali voci già presenti (contenuti personalizzati non toccati)
let existing = {}
if (existsSync(MAP)) {
  try {
    existing = JSON.parse((await import('node:fs')).readFileSync(MAP, 'utf8'))
  } catch {}
}
writeFileSync(MAP, JSON.stringify({ ...existing, ...map }, null, 2) + '\n')

console.log(`\nConcetti risolti: ${Object.keys(map).length}/${ids.length}`)
if (problems.length) {
  console.log('Problemi:')
  for (const p of problems) console.log(' - ' + p)
}
writeFileSync('scripts/stimuli-problems.txt', problems.join('\n') + '\n')
