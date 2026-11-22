// Persistenza locale (IndexedDB). Nessun dato lascia il dispositivo:
// profili, tentativi, annotazioni, contenuti personalizzati e registrazioni
// restano nel browser e possono essere esportati/eliminati dall'adulto.

export const DB_NAME = 'semantica-in-gioco'
export const DB_VERSION = 1

export type StoreName = 'profiles' | 'attempts' | 'notes' | 'customConcepts' | 'recordings' | 'sessions' | 'meta'

const STORES: { name: StoreName; keyPath: string; index?: string }[] = [
  { name: 'profiles', keyPath: 'id' },
  { name: 'attempts', keyPath: 'id', index: 'profileId' },
  { name: 'notes', keyPath: 'id', index: 'profileId' },
  { name: 'customConcepts', keyPath: 'id' },
  { name: 'recordings', keyPath: 'id' },
  { name: 'sessions', keyPath: 'id', index: 'profileId' },
  { name: 'meta', keyPath: 'key' },
]

let dbPromise: Promise<IDBDatabase> | null = null

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB non disponibile su questo dispositivo.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store.name)) {
          const os = db.createObjectStore(store.name, { keyPath: store.keyPath })
          if (store.index) os.createIndex(store.index, store.index, { unique: false })
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Apertura del database non riuscita'))
  })
  return dbPromise
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (os: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const request = fn(transaction.objectStore(store))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Operazione non riuscita'))
      }),
  )
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const result = await tx<T[]>(store, 'readonly', (os) => os.getAll() as IDBRequest<T[]>)
  return result ?? []
}

export function put<T>(store: StoreName, value: T, id?: string): Promise<IDBValidKey> {
  // Tutti gli store usano una chiave in-line (keyPath): passare un secondo
  // argomento a put() farebbe fallire la scrittura con DataError.
  const definition = STORES.find((entry) => entry.name === store)
  const record = id && definition ? { ...(value as object), [definition.keyPath]: id } : value
  return tx<IDBValidKey>(store, 'readwrite', (os) => os.put(record as T))
}

export function remove(store: StoreName, key: string): Promise<undefined> {
  return tx<undefined>(store, 'readwrite', (os) => os.delete(key))
}

export function clearStore(store: StoreName): Promise<undefined> {
  return tx<undefined>(store, 'readwrite', (os) => os.clear())
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  // A chunked conversion avoids "too many arguments" on large recordings.
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`
}

export function dataUrlToBlob(value: string): Blob {
  const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/s.exec(value)
  if (!match) return new Blob([value])
  const type = match[1] || 'application/octet-stream'
  const binary = atob(match[2] ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type })
}

/** Serializza i Blob (registrazioni) per il backup JSON senza perderli. */
async function exportableRow(store: StoreName, row: unknown): Promise<unknown> {
  if (store !== 'recordings' || !row || typeof row !== 'object') return row
  const record = row as { blob?: unknown }
  if (!(record.blob instanceof Blob)) return row
  return { ...record, blob: await blobToDataUrl(record.blob) }
}

function importableRow(store: StoreName, row: unknown): unknown {
  if (store !== 'recordings' || !row || typeof row !== 'object') return row
  const record = row as { blob?: unknown }
  if (typeof record.blob !== 'string') return row
  return { ...record, blob: dataUrlToBlob(record.blob) }
}

export async function exportDatabase(): Promise<string> {
  const data: Record<string, unknown[]> = {}
  for (const store of STORES) {
    const rows = await getAll<unknown>(store.name)
    data[store.name] = await Promise.all(rows.map((row) => exportableRow(store.name, row)))
  }
  return JSON.stringify({ app: 'semantica-in-gioco', version: DB_VERSION, exportedAt: new Date().toISOString(), data }, null, 2)
}

/** Importazione con controllo della struttura: non sovrascrive il database in caso di file non valido. */
export async function importDatabase(json: string): Promise<{ imported: number; skipped: string[] }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Il file non è un JSON valido.')
  }
  const payload = parsed as { app?: string; data?: Record<string, unknown[]> }
  if (!payload || payload.app !== 'semantica-in-gioco' || !payload.data) {
    throw new Error('Il file non è un backup di Semantica in Gioco.')
  }
  let imported = 0
  const skipped: string[] = []
  for (const store of STORES) {
    const rows = payload.data[store.name]
    if (!Array.isArray(rows)) continue
    for (const row of rows) {
      try {
        await put(store.name, importableRow(store.name, row))
        imported++
      } catch {
        skipped.push(`${store.name}: voce non importabile`)
      }
    }
  }
  return { imported, skipped }
}

/**
 * Cancellazione completa dei dati di un profilo in una sola transazione.
 * Include note, contenuti personalizzati, sessioni e registrazioni collegate:
 * non devono restare voci orfane nel database.
 */
export async function deleteProfileData(profileId: string): Promise<void> {
  const db = await openDb()
  const names: StoreName[] = ['profiles', 'attempts', 'notes', 'customConcepts', 'sessions', 'recordings']
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(names, 'readwrite')
    transaction.objectStore('profiles').delete(profileId)
    for (const name of ['attempts', 'notes', 'customConcepts', 'sessions', 'recordings'] as StoreName[]) {
      const objectStore = transaction.objectStore(name)
      const request = objectStore.getAll()
      request.onsuccess = () => {
        for (const row of request.result as { id?: string; profileId?: string }[]) {
          if (row.profileId === profileId && row.id) objectStore.delete(row.id)
        }
      }
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Cancellazione del profilo non riuscita'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Cancellazione del profilo annullata'))
  })
}

/** Cancellazione effettiva di tutti i dati locali. */
export async function deleteAllData(): Promise<void> {
  const db = await openDb()
  const names = STORES.map((s) => s.name)
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(names, 'readwrite')
    for (const name of names) transaction.objectStore(name).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Cancellazione non riuscita'))
  })
}
