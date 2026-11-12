// Verifica di fumo dell'app desktop pacchettizzata.
// Modalità 1 (CDP): l'app è già avviata con --remote-debugging-port=9333
//   node scripts/verify-desktop.mjs http://127.0.0.1:9333
// Modalità 2 (avvio diretto): Playwright avvia l'eseguibile
//   node scripts/verify-desktop.mjs "/percorso/Semantica in Gioco"
// Modalità 3 (sorgente): avvia Electron dalla cartella del progetto
//   node scripts/verify-desktop.mjs source
import { _electron as electron, chromium } from '@playwright/test'

const target = process.argv[2]
if (!target) {
  console.error('Uso: node scripts/verify-desktop.mjs <http://host:porta | eseguibile>')
  process.exit(2)
}

async function inspect(page) {
  // La schermata .boot è transitoria: attendiamo l'interfaccia reale.
  await page.waitForSelector('main#main', { timeout: 30000 })
  const data = await page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('h1')?.textContent?.trim() ?? '',
    boot: Boolean(document.querySelector('.boot')),
    main: Boolean(document.querySelector('main#main')),
    images: document.querySelectorAll('img').length,
    brokenImages: [...document.querySelectorAll('img')].filter((img) => img.complete && img.naturalWidth === 0).length,
  }))
  console.log(JSON.stringify(data))
  if (data.boot || !data.main || !data.heading.toLowerCase().includes('semantica')) {
    throw new Error('Interfaccia non caricata correttamente.')
  }
  return data
}

let browser = null
let app = null
try {
  if (/^https?:\/\//.test(target)) {
    browser = await chromium.connectOverCDP(target)
    const page = browser.contexts().flatMap((context) => context.pages())[0]
    if (!page) throw new Error('Nessuna pagina esposta dal processo Electron.')
    await inspect(page)
  } else if (target === 'source') {
    app = await electron.launch({ args: ['.'], timeout: 45000 })
    const page = await app.firstWindow({ timeout: 30000 })
    await inspect(page)
  } else {
    app = await electron.launch({ executablePath: target, timeout: 45000 })
    const page = await app.firstWindow({ timeout: 30000 })
    await inspect(page)
  }
  console.log('DESKTOP_SMOKE=ok')
} finally {
  if (browser) await browser.close()
  if (app) await app.close()
}
