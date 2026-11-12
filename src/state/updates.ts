// Stato dell'aggiornamento per l'interfaccia. Nel browser (build statica) il
// ponte non esiste e tutto tace: non c'è niente da aggiornare senza installer.
import { useCallback, useEffect, useState } from 'react'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'installing'
  | 'up-to-date'
  | 'unsupported'
  | 'error'

export interface UpdateState {
  status: UpdateStatus
  currentVersion: string
  version: string | null
  assetName: string | null
  progress: number
  notesUrl: string | null
  error: string | null
  platform: string
  arch: string
  canInstall: boolean
}

interface UpdateBridge {
  status: () => Promise<UpdateState>
  check: () => Promise<UpdateState>
  install: () => Promise<{ ok: boolean; error?: string }>
  settings: () => Promise<{ autoCheck: boolean; autoInstall: boolean }>
  setSettings: (patch: { autoCheck?: boolean; autoInstall?: boolean }) => Promise<{ autoCheck: boolean; autoInstall: boolean }>
  openRelease: (url: string) => void
  setBusy: (value: boolean) => void
  onChange: (listener: (state: UpdateState) => void) => () => void
}

declare global {
  interface Window {
    semantica?: { updates?: UpdateBridge; platform?: string; arch?: string }
  }
}

/** Ponte verso il processo principale, `undefined` nel browser. */
export function updatesBridge(): UpdateBridge | undefined {
  return typeof window === 'undefined' ? undefined : window.semantica?.updates
}

export function useUpdates() {
  const bridge = updatesBridge()
  const [state, setState] = useState<UpdateState | null>(null)
  const [autoInstall, setAutoInstall] = useState(true)

  useEffect(() => {
    if (!bridge) return
    let alive = true
    void bridge.status().then((next) => {
      if (alive) setState(next)
    })
    void bridge.settings().then((next) => {
      if (alive) setAutoInstall(next.autoInstall)
    })
    const unsubscribe = bridge.onChange((next) => {
      if (alive) setState(next)
    })
    return () => {
      alive = false
      unsubscribe()
    }
  }, [bridge])

  const check = useCallback(async () => {
    if (!bridge) return null
    const next = await bridge.check()
    setState(next)
    return next
  }, [bridge])

  const install = useCallback(async () => {
    if (!bridge) return { ok: false, error: 'non disponibile' }
    return bridge.install()
  }, [bridge])

  const toggleAutoInstall = useCallback(
    async (value: boolean) => {
      setAutoInstall(value)
      if (bridge) await bridge.setSettings({ autoInstall: value })
    },
    [bridge],
  )

  const openRelease = useCallback(
    (url: string | null) => {
      if (bridge && url) bridge.openRelease(url)
    },
    [bridge],
  )

  return { bridge, state, autoInstall, check, install, toggleAutoInstall, openRelease }
}

/** Durante una sessione l'app non si chiude da sola per installare. */
export function setUpdatesBusy(value: boolean) {
  updatesBridge()?.setBusy(value)
}
