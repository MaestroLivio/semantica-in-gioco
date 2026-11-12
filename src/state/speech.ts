// Livello audio unico dell'app. Le schermate continuano a chiamare `speak`:
// dietro, il testo viene normalizzato, messo in coda e pronunciato dal motore
// scelto (neurale locale, pacchetto audio pregenerato, voce di sistema).

import { SpeechQueue } from './tts/queue'
import { normalizeForSpeech } from './tts/normalize-it'
import { cacheStats, clearAudioCache, cacheKey, getCached } from './tts/cache'
import {
  DEFAULT_SPEECH_PREFERENCES,
  type EngineKind,
  type EngineStatus,
  type SpeechEngine,
  type SpeechOptions,
  type SpeechPreferences,
} from './tts/types'
import { NeuralSpeechEngine } from './tts/neural'
import { RecordedSpeechEngine } from './tts/recorded'
import { SystemSpeechEngine } from './tts/system'

export { speechSupported, loadVoices, onVoicesChanged, listVoices, hasItalianVoice } from './tts/system'
export type { VoiceInfo } from './tts/system'
export type { EngineKind, EngineStatus, SpeechOptions, SpeechPreferences } from './tts/types'
export {
  NEURAL_LICENSE,
  NEURAL_MODEL_BYTES,
  NEURAL_VOICE_ID,
  neuralInstalled,
} from './tts/neural'

export const neuralEngine = new NeuralSpeechEngine()
export const recordedEngine = new RecordedSpeechEngine()
export const systemEngine = new SystemSpeechEngine()

let preferences: SpeechPreferences = { ...DEFAULT_SPEECH_PREFERENCES }
let speaking = false
let interrupted = false
let playingEngine: SpeechEngine | null = null

const listeners = new Set<(status: EngineStatus) => void>()

const queue = new SpeechQueue(() => {
  interrupted = true
  playingEngine?.stop()
  playingEngine = null
  speaking = false
})

function notify(): void {
  const status = speechStatus()
  for (const listener of listeners) listener(status)
}

/** Registra un ascoltatore sullo stato del motore vocale. */
export function subscribeSpeech(listener: (status: EngineStatus) => void): () => void {
  listeners.add(listener)
  listener(speechStatus())
  return () => listeners.delete(listener)
}

/** Aggiorna le preferenze audio (profilo, impostazioni, prove). */
export function setSpeechPreferences(patch: Partial<SpeechPreferences>): void {
  preferences = { ...preferences, ...patch }
  notify()
}

export function getSpeechPreferences(): SpeechPreferences {
  return { ...preferences }
}

/** Stato del motore che verrebbe usato adesso. */
export function speechStatus(): EngineStatus {
  return currentEngine().status()
}

export function speechStatuses(): EngineStatus[] {
  return [neuralEngine.status(), recordedEngine.status(), systemEngine.status()]
}

function currentEngine(): SpeechEngine {
  switch (preferences.engine) {
    case 'neural':
      return neuralEngine.status().state === 'ready' || neuralEngine.isInstalled() ? neuralEngine : systemEngine
    case 'recorded':
      return recordedEngine.status().state === 'ready' ? recordedEngine : systemEngine
    case 'system':
      return systemEngine
    default:
      if (neuralEngine.status().state === 'ready') return neuralEngine
      if (recordedEngine.status().state === 'ready') return recordedEngine
      return systemEngine
  }
}

function pickEngineFor(text: string): SpeechEngine {
  if (preferences.engine === 'system') return systemEngine
  if (preferences.engine === 'neural') return currentEngine()
  if (preferences.engine === 'recorded') {
    if (recordedEngine.hasClip(text)) return recordedEngine
    return neuralEngine.status().state === 'ready' ? neuralEngine : systemEngine
  }
  if (neuralEngine.status().state === 'ready') return neuralEngine
  if (recordedEngine.hasClip(text)) return recordedEngine
  return systemEngine
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * Pronuncia un testo. Il testo scritto non viene modificato: la normalizzazione
 * (numeri, sigle, omografi) vale solo per l'audio.
 */
export function speak(text: string, opts: SpeechOptions = {}): void {
  const spoken = normalizeForSpeech(text)
  if (!spoken) {
    opts.onEnd?.()
    return
  }
  const engine = pickEngineFor(spoken)
  const rate = opts.rate ?? preferences.rate
  const volume = opts.volume ?? preferences.volume
  const repeat = Math.max(0, opts.repeat ?? preferences.repeat)
  const pauseBefore = Math.max(0, opts.pauseBeforeMs ?? preferences.pauseBeforeMs)
  const pauseAfter = Math.max(0, opts.pauseAfterMs ?? preferences.pauseAfterMs)
  const voiceURI = opts.voiceURI ?? preferences.voiceURI

  queue.enqueue({
    id: `speak-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    priority: opts.priority ?? 0,
    run: async () => {
      interrupted = false
      speaking = true
      playingEngine = engine
      try {
        if (pauseBefore) await wait(pauseBefore)
        if (interrupted) return
        for (let attempt = 0; attempt <= repeat; attempt++) {
          if (attempt > 0) await wait(Math.max(200, pauseBefore))
          if (interrupted) return
          await engine.play(spoken, {
            rate,
            volume,
            voiceURI,
            onStart: attempt === 0 ? opts.onStart : undefined,
          })
          if (interrupted) return
        }
        if (pauseAfter) await wait(pauseAfter)
      } finally {
        speaking = false
        playingEngine = null
      }
    },
    onEnd: opts.onEnd,
  })
}

/** Ripete la sola parola target, senza rileggere l'intera consegna. */
export function speakTarget(word: string, opts: SpeechOptions = {}): void {
  speak(word, { ...opts, priority: 10, pauseBeforeMs: 0 })
}

export function stopSpeaking(): void {
  queue.cancelAll()
  neuralEngine.stop()
  recordedEngine.stop()
  systemEngine.stop()
  speaking = false
}

export function isSpeaking(): boolean {
  return speaking || queue.busy
}

/** Prepara il motore richiesto. La voce neurale richiede un download esplicito. */
export async function prepareSpeech(target: 'auto' | EngineKind = preferences.engine): Promise<boolean> {
  if (target === 'neural') {
    const ok = await neuralEngine.prepare()
    notify()
    return ok
  }
  if (target === 'recorded') {
    const ok = await recordedEngine.prepare()
    notify()
    return ok
  }
  if (target === 'system') return systemEngine.prepare()
  // 'auto': usa il pacchetto pregenerato se esiste, senza scaricare il modello.
  const recorded = await recordedEngine.prepare()
  notify()
  return recorded
}

/** Precarica in cache le frasi più frequenti (solo con la voce neurale attiva). */
export async function preloadSpeech(texts: string[], rate = preferences.rate): Promise<number> {
  if (neuralEngine.status().state !== 'ready') return 0
  let prepared = 0
  for (const raw of texts) {
    const text = normalizeForSpeech(raw)
    if (!text) continue
    const key = cacheKey({
      text,
      voiceId: 'it_IT-paola-medium',
      modelVersion: '1.0.0',
      rate,
    })
    if (await getCached(key, false)) continue
    try {
      await neuralEngine.synthesize(text, rate)
      prepared++
    } catch {
      // Un contenuto non sintetizzabile non deve interrompere il precaricamento.
    }
  }
  return prepared
}

export { cacheStats as audioCacheStats, clearAudioCache }

/** Rimuove il modello neurale installato e libera la cache audio. */
export async function reinstallNeuralVoice(): Promise<void> {
  neuralEngine.dispose()
  await clearAudioCache()
  notify()
}
