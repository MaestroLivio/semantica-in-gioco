/// <reference types="vitest" />
import { cpSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const PIPER_DIST = join(process.cwd(), 'node_modules', 'piper-tts-web', 'dist')
const PIPER_DIRS = ['onnx', 'piper', 'worker']
const ASSET_TYPES: Record<string, string> = {
  '.wasm': 'application/wasm',
  '.js': 'text/javascript; charset=utf-8',
  '.data': 'application/octet-stream',
  '.json': 'application/json; charset=utf-8',
}

/**
 * Il motore neurale carica WebAssembly e worker da percorsi relativi
 * (onnx/, piper/, worker/). In sviluppo li serve da node_modules, in build li
 * copia in dist. Nessun asset generato viene versionato nel repository.
 * Con SEMANTICA_SKIP_TTS_ASSETS=1 la copia viene saltata (build senza voce
 * neurale, per chi vuole un pacchetto leggero).
 */
function piperAssets(): Plugin {
  return {
    name: 'semantica-piper-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = (request.url ?? '').split('?')[0]
        if (!/^\/(onnx|piper|worker)\//.test(pathname)) {
          next()
          return
        }
        const filePath = join(PIPER_DIST, decodeURIComponent(pathname))
        if (!existsSync(filePath) || !statSync(filePath).isFile()) {
          next()
          return
        }
        response.setHeader('Content-Type', ASSET_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream')
        createReadStream(filePath).pipe(response)
      })
    },
    closeBundle() {
      if (process.env.SEMANTICA_SKIP_TTS_ASSETS === '1') return
      for (const dir of PIPER_DIRS) {
        const from = join(PIPER_DIST, dir)
        if (!existsSync(from)) continue
        const to = join(process.cwd(), 'dist', dir)
        mkdirSync(dirname(to), { recursive: true })
        cpSync(from, to, { recursive: true })
      }
    },
  }
}

// Su volumi ExFAT macOS crea file `._*` (resource fork) accanto a quelli
// copiati: non sono asset pubblici e alcuni host rifiutano l'upload. Vengono
// rimossi da dist a fine build, così il pacchetto resta pulito e riproducibile.
function stripAppleDouble(): Plugin {
  return {
    name: 'semantica-strip-appledouble',
    closeBundle() {
      const root = join(process.cwd(), 'dist')
      if (!existsSync(root)) return
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) walk(full)
          else if (entry.startsWith('._') || entry === '.DS_Store') unlinkSync(full)
        }
      }
      walk(root)
    },
  }
}

// Build web (Sites/PWA leggera): la voce neurale è sostituita da una variante
// che dichiara il limite, così non viene emesso il chunk WebAssembly da ~45 MB.
const WEB_BUILD = process.env.SEMANTICA_WEB === '1'

export default defineConfig({
  plugins: [react(), piperAssets(), stripAppleDouble()],
  base: './',
  resolve: WEB_BUILD
    ? {
        alias: [
          {
            find: /^\.\/tts\/neural$/,
            replacement: resolve(process.cwd(), 'src/state/tts/neural-unavailable.ts'),
          },
        ],
      }
    : undefined,
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // I file `._*` sono resource fork di macOS creati copiando la cartella:
    // non sono test e facevano fallire la raccolta di Vitest.
    exclude: ['**/node_modules/**', '**/dist/**', '**/._*'],
    globals: false,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
