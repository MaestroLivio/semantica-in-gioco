import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Attempt, ConceptStats } from '../engine/adaptive'
import { applyAttempt, emptyStats } from '../engine/adaptive'
import type { ReviewItem } from '../engine/srs'
import { createProfile, DEFAULT_GLOBAL, withProfileDefaults, type ChildProfile, type GlobalSettings } from './profile'
import * as db from './db'

export interface ObservationNote {
  id: string
  profileId: string
  at: number
  text: string
  moduleId?: string
  conceptIds?: string[]
}

export interface CustomConceptRecord {
  id: string
  profileId: string
  lemma: string
  category: string
  definition: string
  /** Immagine come data URL (foto dell'ambiente reale). */
  image: string
  audioId?: string
  features: string[]
  createdAt: number
}

export interface RecordingRecord {
  id: string
  label: string
  blob: Blob
  createdAt: number
}

export interface SessionSummary {
  id: string
  profileId: string
  startedAt: number
  endedAt: number
  moduleIds: string[]
  exercises: number
  correct: number
  aided: number
  skipped: number
}

interface StoreValue {
  ready: boolean
  storageError: string | null
  profiles: ChildProfile[]
  activeProfile: ChildProfile | null
  activeProfileId: string | null
  attempts: Attempt[]
  notes: ObservationNote[]
  customConcepts: CustomConceptRecord[]
  sessions: SessionSummary[]
  recordings: RecordingRecord[]
  global: GlobalSettings
  stats: Map<string, ConceptStats>
  selectProfile: (id: string | null) => void
  addProfile: (nickname: string) => ChildProfile
  updateProfile: (profile: ChildProfile) => void
  deleteProfile: (id: string) => void
  recordAttempt: (attempt: Attempt) => void
  addNote: (note: Omit<ObservationNote, 'id' | 'at'>) => void
  deleteNote: (id: string) => void
  addCustomConcept: (record: Omit<CustomConceptRecord, 'id' | 'createdAt'>) => void
  deleteCustomConcept: (id: string) => void
  addRecording: (label: string, blob: Blob) => RecordingRecord
  deleteRecording: (id: string) => void
  saveSession: (session: SessionSummary) => void
  updateGlobal: (patch: Partial<GlobalSettings>) => void
  exportData: () => Promise<string>
  importData: (json: string) => Promise<{ imported: number; skipped: string[] }>
  wipeData: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<ChildProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [notes, setNotes] = useState<ObservationNote[]>([])
  const [customConcepts, setCustomConcepts] = useState<CustomConceptRecord[]>([])
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [recordings, setRecordings] = useState<RecordingRecord[]>([])
  const [global, setGlobal] = useState<GlobalSettings>(DEFAULT_GLOBAL)

  useEffect(() => {
    // Nessun guardia di reingresso: in StrictMode l'effetto viene montato,
    // smontato e rimontato; la seconda esecuzione deve poter completare il
    // caricamento e impostare `ready`, altrimenti l'app resta sul boot.
    let cancelled = false
    ;(async () => {
      try {
        const [loadedProfiles, loadedAttempts, loadedNotes, loadedCustom, loadedSessions, loadedRecordings, meta] =
          await Promise.all([
            db.getAll<ChildProfile>('profiles'),
            db.getAll<Attempt>('attempts'),
            db.getAll<ObservationNote>('notes'),
            db.getAll<CustomConceptRecord>('customConcepts'),
            db.getAll<SessionSummary>('sessions'),
            db.getAll<RecordingRecord>('recordings'),
            db.getAll<{ key: string; value: unknown }>('meta'),
          ])
        if (cancelled) return
        const savedGlobal = meta.find((m) => m.key === 'global')?.value as GlobalSettings | undefined
        const nextGlobal = { ...DEFAULT_GLOBAL, ...(savedGlobal ?? {}) }
        setGlobal(nextGlobal)
        // I profili salvati da versioni precedenti non hanno i campi audio
        // nuovi: vengono completati in memoria, senza riscrivere il database.
        setProfiles(
          loadedProfiles.map((profile) => withProfileDefaults(profile)).sort((a, b) => a.createdAt - b.createdAt),
        )
        setAttempts(loadedAttempts)
        setNotes(loadedNotes)
        setCustomConcepts(loadedCustom)
        setSessions(loadedSessions)
        setRecordings(loadedRecordings)
        if (nextGlobal.lastProfileId && loadedProfiles.some((p) => p.id === nextGlobal.lastProfileId)) {
          setActiveProfileId(nextGlobal.lastProfileId)
        }
      } catch (error) {
        if (cancelled) return
        setStorageError(
          error instanceof Error
            ? `Archiviazione locale non disponibile: ${error.message}`
            : 'Archiviazione locale non disponibile.',
        )
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  )

  const profileAttempts = useMemo(
    () => (activeProfile ? attempts.filter((a) => (a as Attempt & { profileId?: string }).profileId === activeProfile.id) : []),
    [attempts, activeProfile],
  )

  const stats = useMemo(() => {
    const map = new Map<string, ConceptStats>()
    for (const attempt of profileAttempts) {
      for (const conceptId of attempt.conceptIds) {
        const current = map.get(conceptId) ?? emptyStats(conceptId)
        const isTarget = attempt.targetConceptId === conceptId
        map.set(
          conceptId,
          isTarget
            ? applyAttempt(current, attempt)
            : { ...current, exposures: current.exposures, lastSeen: Math.max(current.lastSeen, attempt.at) },
        )
      }
    }
    return map
  }, [profileAttempts])

  const selectProfile = useCallback(
    (id: string | null) => {
      setActiveProfileId(id)
      const next = { ...global, lastProfileId: id }
      setGlobal(next)
      void db.put('meta', { key: 'global', value: next })
    },
    [global],
  )

  const addProfile = useCallback((nickname: string) => {
    const profile = createProfile(nickname, profiles.length)
    setProfiles((prev) => [...prev, profile])
    void db.put('profiles', profile)
    setActiveProfileId(profile.id)
    setGlobal((prev) => {
      const next = { ...prev, lastProfileId: profile.id }
      void db.put('meta', { key: 'global', value: next })
      return next
    })
    return profile
  }, [profiles.length])

  const updateProfile = useCallback((profile: ChildProfile) => {
    const next = { ...profile, updatedAt: Date.now() }
    setProfiles((prev) => prev.map((p) => (p.id === next.id ? next : p)))
    void db.put('profiles', next)
  }, [])

  const deleteProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => prev.filter((p) => p.id !== id))
      setAttempts((prev) => prev.filter((a) => (a as Attempt & { profileId?: string }).profileId !== id))
      setNotes((prev) => prev.filter((n) => n.profileId !== id))
      setCustomConcepts((prev) => prev.filter((c) => c.profileId !== id))
      setSessions((prev) => prev.filter((s) => s.profileId !== id))
      void db.remove('profiles', id)
      for (const attempt of attempts.filter((a) => (a as Attempt & { profileId?: string }).profileId === id)) {
        void db.remove('attempts', attempt.id)
      }
      if (activeProfileId === id) setActiveProfileId(null)
    },
    [attempts, activeProfileId],
  )

  const recordAttempt = useCallback(
    (attempt: Attempt) => {
      const withProfile = { ...attempt } as Attempt & { profileId?: string }
      if (activeProfile) withProfile.profileId = activeProfile.id
      setAttempts((prev) => [...prev, withProfile])
      void db.put('attempts', withProfile)
    },
    [activeProfile],
  )

  const addNote = useCallback(
    (note: Omit<ObservationNote, 'id' | 'at'>) => {
      const record: ObservationNote = { ...note, id: uid('note'), at: Date.now() }
      setNotes((prev) => [record, ...prev])
      void db.put('notes', record)
    },
    [],
  )

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    void db.remove('notes', id)
  }, [])

  const addCustomConcept = useCallback((record: Omit<CustomConceptRecord, 'id' | 'createdAt'>) => {
    const full: CustomConceptRecord = { ...record, id: uid('custom'), createdAt: Date.now() }
    setCustomConcepts((prev) => [...prev, full])
    void db.put('customConcepts', full)
  }, [])

  const deleteCustomConcept = useCallback((id: string) => {
    setCustomConcepts((prev) => prev.filter((c) => c.id !== id))
    void db.remove('customConcepts', id)
  }, [])

  const addRecording = useCallback((label: string, blob: Blob) => {
    const record: RecordingRecord = { id: uid('rec'), label, blob, createdAt: Date.now() }
    setRecordings((prev) => [record, ...prev])
    void db.put('recordings', record)
    return record
  }, [])

  const deleteRecording = useCallback((id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id))
    void db.remove('recordings', id)
  }, [])

  const saveSession = useCallback((session: SessionSummary) => {
    setSessions((prev) => [session, ...prev])
    void db.put('sessions', session)
  }, [])

  const updateGlobal = useCallback((patch: Partial<GlobalSettings>) => {
    setGlobal((prev) => {
      const next = { ...prev, ...patch }
      void db.put('meta', { key: 'global', value: next })
      return next
    })
  }, [])

  const exportData = useCallback(() => db.exportDatabase(), [])

  const importData = useCallback(async (json: string) => {
    const result = await db.importDatabase(json)
    const [loadedProfiles, loadedAttempts, loadedNotes, loadedCustom, loadedSessions, loadedRecordings] =
      await Promise.all([
        db.getAll<ChildProfile>('profiles'),
        db.getAll<Attempt>('attempts'),
        db.getAll<ObservationNote>('notes'),
        db.getAll<CustomConceptRecord>('customConcepts'),
        db.getAll<SessionSummary>('sessions'),
        db.getAll<RecordingRecord>('recordings'),
      ])
    setProfiles(loadedProfiles.sort((a, b) => a.createdAt - b.createdAt))
    setAttempts(loadedAttempts)
    setNotes(loadedNotes)
    setCustomConcepts(loadedCustom)
    setSessions(loadedSessions)
    setRecordings(loadedRecordings)
    return result
  }, [])

  const wipeData = useCallback(async () => {
    await db.deleteAllData()
    setProfiles([])
    setAttempts([])
    setNotes([])
    setCustomConcepts([])
    setSessions([])
    setRecordings([])
    setActiveProfileId(null)
    setGlobal(DEFAULT_GLOBAL)
  }, [])

  const value: StoreValue = {
    ready,
    storageError,
    profiles,
    activeProfile,
    activeProfileId,
    attempts: profileAttempts,
    notes: activeProfile ? notes.filter((n) => n.profileId === activeProfile.id) : [],
    customConcepts: activeProfile ? customConcepts.filter((c) => c.profileId === activeProfile.id) : [],
    sessions: activeProfile ? sessions.filter((s) => s.profileId === activeProfile.id) : [],
    recordings,
    global,
    stats,
    selectProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    recordAttempt,
    addNote,
    deleteNote,
    addCustomConcept,
    deleteCustomConcept,
    addRecording,
    deleteRecording,
    saveSession,
    updateGlobal,
    exportData,
    importData,
    wipeData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve essere usato dentro StoreProvider')
  return ctx
}

/** Costruisce gli elementi di ripasso distribuito dai tentativi del profilo. */
export function reviewItemsFromStats(stats: Map<string, ConceptStats>, intervals: number[]): ReviewItem[] {
  const items: ReviewItem[] = []
  const day = 86_400_000
  for (const s of stats.values()) {
    if (!s.exposures) continue
    const index = Math.min(Math.max(0, s.streak - 1), intervals.length - 1)
    const lastResult: ReviewItem['lastResult'] = s.streak === 0 ? 'errore' : s.assisted > 0 ? 'con-aiuto' : 'corretto'
    items.push({
      conceptId: s.conceptId,
      dueAt: (s.lastSeen || Date.now()) + intervals[index] * day,
      intervalIndex: index,
      lastResult,
    })
  }
  return items
}
