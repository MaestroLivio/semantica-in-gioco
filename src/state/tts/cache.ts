// Cache persistente dell'audio sintetizzato.
// Usa un database IndexedDB separato da quello dei dati del bambino: aggiornare
// o svuotare la cache vocale non deve mai toccare profili, tentativi o note.

const DB_NAME = 'semantica-tts-cache'
const DB_VERSION = 1
const STORE = 'audio'

/** Oltre questa soglia la cache elimina le voci usate meno di recente. */
export const DEFAULT_CACHE_LIMIT_BYTES = 220 * 1024 * 1024

export interface CachedAudio {
  key: string
  blob: Blob
  bytes: number
  voiceId: string
  modelVersion: string
  createdAt: number
  lastUsedAt: number
}

export function cacheAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

function fnv1a(value: string): string {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Chiave deterministica: testo normalizzato, voce, versione del modello e
 * velocità. Cambiare uno di questi parametri invalida la voce in cache.
 */
export function cacheKey(input: { text: string; voiceId: string; modelVersion: string; rate: number }): string {
  const rate = Math.round(input.rate * 100) / 100
  return `${input.voiceId}|${input.modelVersion}|${rate.toFixed(2)}|${fnv1a(input.text)}|${input.text.length}`
}

let dbPromise: Promise<IDBDatabase> | null = null

function openCacheDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (!cacheAvailable()) {
      reject(new Error('IndexedDB non disponibile: cache vocale disattivata.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' })
        store.createIndex('lastUsedAt', 'lastUsedAt', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Apertura della cache vocale non riuscita'))
  })
  return dbPromise
}

export async function getCached(key: string, touch = true): Promise<Blob | null> {
  if (!cacheAvailable()) return null
  try {
    const db = await openCacheDb()
    const entry = await new Promise<CachedAudio | undefined>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      request.onsuccess = () => resolve(request.result as CachedAudio | undefined)
      request.onerror = () => reject(request.error)
    })
    if (!entry) return null
    if (touch) {
      const db2 = await openCacheDb()
      await new Promise<void>((resolve) => {
        const transaction = db2.transaction(STORE, 'readwrite')
        transaction.objectStore(STORE).put({ ...entry, lastUsedAt: Date.now() })
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => resolve()
      })
    }
    return entry.blob
  } catch {
    return null
  }
}

export async function putCached(entry: Omit<CachedAudio, 'bytes' | 'createdAt' | 'lastUsedAt'>): Promise<void> {
  if (!cacheAvailable()) return
  try {
    const db = await openCacheDb()
    const now = Date.now()
    const record: CachedAudio = { ...entry, bytes: entry.blob.size, createdAt: now, lastUsedAt: now }
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).put(record)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch {
    // La cache è un'ottimizzazione: se fallisce la sintesi continua comunque.
  }
}

export async function cacheStats(): Promise<{ count: number; bytes: number }> {
  if (!cacheAvailable()) return { count: 0, bytes: 0 }
  try {
    const db = await openCacheDb()
    const entries = await new Promise<CachedAudio[]>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
      request.onsuccess = () => resolve((request.result ?? []) as CachedAudio[])
      request.onerror = () => reject(request.error)
    })
    return { count: entries.length, bytes: entries.reduce((sum, e) => sum + (e.bytes ?? e.blob?.size ?? 0), 0) }
  } catch {
    return { count: 0, bytes: 0 }
  }
}

/** Elimina le voci meno usate finché la cache rientra nel limite indicato. */
export async function pruneCache(limit = DEFAULT_CACHE_LIMIT_BYTES): Promise<number> {
  if (!cacheAvailable()) return 0
  try {
    const db = await openCacheDb()
    const entries = await new Promise<CachedAudio[]>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
      request.onsuccess = () => resolve((request.result ?? []) as CachedAudio[])
      request.onerror = () => reject(request.error)
    })
    let total = entries.reduce((sum, e) => sum + (e.bytes ?? 0), 0)
    if (total <= limit) return 0
    const ordered = [...entries].sort((a, b) => a.lastUsedAt - b.lastUsedAt)
    const removed: string[] = []
    for (const entry of ordered) {
      if (total <= limit) break
      total -= entry.bytes ?? 0
      removed.push(entry.key)
    }
    if (removed.length) {
      await new Promise<void>((resolve) => {
        const transaction = db.transaction(STORE, 'readwrite')
        const store = transaction.objectStore(STORE)
        for (const key of removed) store.delete(key)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => resolve()
      })
    }
    return removed.length
  } catch {
    return 0
  }
}

export async function clearAudioCache(): Promise<void> {
  if (!cacheAvailable()) return
  try {
    const db = await openCacheDb()
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
    })
  } catch {
    // Nessun dato del bambino viene toccato in caso di errore.
  }
}
