// Contratti del livello audio. Il resto dell'app chiama solo questi tipi:
// sostituire il motore vocale non richiede modifiche alle schermate.

export type EngineKind = 'neural' | 'recorded' | 'system'

export type EngineState = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable'

/** Stato osservabile dal pannello adulti (modello, licenza, cache, offline). */
export interface EngineStatus {
  kind: EngineKind
  state: EngineState
  /** Nome leggibile della voce usata. */
  voiceLabel: string
  modelId?: string
  modelBytes?: number
  license?: string
  /** 0..1 durante il download o il caricamento del modello. */
  progress?: number
  /** Messaggio tecnico leggibile quando lo stato è 'error'. */
  message?: string
  /** true quando la sintesi funziona senza rete. */
  offlineReady: boolean
}

export interface SpeechOptions {
  rate?: number
  volume?: number
  voiceURI?: string | null
  /** Pausa in millisecondi prima di iniziare (consegna che parte piano). */
  pauseBeforeMs?: number
  /** Pausa in millisecondi dopo la fine. */
  pauseAfterMs?: number
  /** Ripetizioni aggiuntive della stessa frase (0 = una sola lettura). */
  repeat?: number
  /** Priorità in coda: valori più alti vengono serviti prima. */
  priority?: number
  onStart?: () => void
  onEnd?: () => void
}

/**
 * Motore vocale. `play` riceve il testo già normalizzato per la sintesi e
 * risolve quando la riproduzione è terminata (o è stata interrotta).
 */
export interface SpeechEngine {
  readonly kind: EngineKind
  status(): EngineStatus
  /** Prepara il motore (download/caricamento del modello). Idempotente. */
  prepare(): Promise<boolean>
  play(text: string, opts: SpeechOptions): Promise<void>
  stop(): void
}

/** Preferenze audio applicate a livello di profilo. */
export interface SpeechPreferences {
  /** 'auto' = neurale se già installata, altrimenti registrata, altrimenti sistema. */
  engine: 'auto' | EngineKind
  rate: number
  /** Velocità della modalità lenta, attivabile con un tocco. */
  slowRate: number
  volume: number
  voiceURI: string | null
  /** Letture aggiuntive automatiche della consegna (0 = una sola). */
  repeat: number
  pauseBeforeMs: number
  pauseAfterMs: number
  /** Ripete soltanto la parola target, non l'intera frase. */
  repeatTargetOnly: boolean
  /** Legge automaticamente i messaggi di feedback. */
  readFeedback: boolean
  /** Effetti sonori decorativi. */
  sounds: boolean
}

export const DEFAULT_SPEECH_PREFERENCES: SpeechPreferences = {
  engine: 'auto',
  rate: 0.9,
  slowRate: 0.65,
  volume: 1,
  voiceURI: null,
  repeat: 0,
  pauseBeforeMs: 0,
  pauseAfterMs: 0,
  repeatTargetOnly: false,
  readFeedback: true,
  sounds: false,
}
