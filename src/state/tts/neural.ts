// Modello vocale neurale italiano eseguito localmente (Piper via WebAssembly).
// Il modello viene scaricato una sola volta e poi riutilizzato offline:
// nessuna frase viene inviata a un servizio esterno.

import type { EngineStatus, SpeechEngine, SpeechOptions } from './types'
import { cacheKey, getCached, putCached, pruneCache } from './cache'
import { playAudioBlob } from './audio-element'

/** Voce principale: pesi MIT, dataset CC0. Vedi LICENZE.md. */
export const NEURAL_VOICE_ID = 'it_IT-paola-medium'
export const NEURAL_MODEL_VERSION = '1.0.0'
export const NEURAL_MODEL_BYTES = 63_500_000
export const NEURAL_LICENSE = 'Modello: MIT (rhasspy/piper-voices) · dataset: CC0 1.0'

interface PiperResponse {
  file: Blob
  duration?: number
}

interface PiperEngine {
  generate(text: string, voice: string, speaker?: number): Promise<PiperResponse>
}

interface PiperModule {
  PiperWebWorkerEngine: new (options?: { voiceProvider?: unknown }) => PiperEngine
  HuggingFaceVoiceProvider: new () => unknown
}

const INSTALL_FLAG = 'semantica-tts-neural-installed'

export function neuralInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALL_FLAG) === NEURAL_MODEL_VERSION
  } catch {
    return false
  }
}

function markInstalled(): void {
  try {
    localStorage.setItem(INSTALL_FLAG, NEURAL_MODEL_VERSION)
  } catch {
    // Storage non disponibile: il modello resta comunque in cache.
  }
}

export class NeuralSpeechEngine implements SpeechEngine {
  readonly kind = 'neural' as const
  private engine: PiperEngine | null = null
  private state: EngineStatus['state'] = 'idle'
  private progressValue: number | undefined
  private message: string | undefined
  private preparing: Promise<boolean> | null = null
  private currentStop: (() => void) | null = null
  private audioContext: AudioContext | null = null

  status(): EngineStatus {
    return {
      kind: 'neural',
      state: this.state,
      voiceLabel: 'Paola (italiano, neurale)',
      modelId: NEURAL_VOICE_ID,
      modelBytes: NEURAL_MODEL_BYTES,
      license: NEURAL_LICENSE,
      progress: this.progressValue,
      message: this.message,
      offlineReady: this.state === 'ready',
    }
  }

  /** true quando il modello è già stato scaricato in una sessione precedente. */
  isInstalled(): boolean {
    return neuralInstalled()
  }

  async prepare(): Promise<boolean> {
    if (this.state === 'ready') return true
    if (this.preparing) return this.preparing
    this.preparing = this.doPrepare()
    try {
      return await this.preparing
    } finally {
      this.preparing = null
    }
  }

  private async doPrepare(): Promise<boolean> {
    this.state = 'loading'
    this.message = undefined
    this.progressValue = 0.05
    try {
      const module = (await import('piper-tts-web')) as unknown as PiperModule
      const voiceProvider = new module.HuggingFaceVoiceProvider()
      const engine = new module.PiperWebWorkerEngine({ voiceProvider })
      this.engine = engine
      this.progressValue = 0.2
      // Riscaldamento: forza il download del modello e la creazione della sessione.
      const warmup = await engine.generate('Ciao', NEURAL_VOICE_ID, 0)
      if (!warmup?.file) throw new Error('Il modello non ha prodotto audio')
      this.progressValue = 1
      this.state = 'ready'
      markInstalled()
      return true
    } catch (error) {
      this.state = 'error'
      this.progressValue = undefined
      this.message =
        error instanceof Error
          ? `Voce neurale non disponibile: ${error.message}`
          : 'Voce neurale non disponibile su questo dispositivo.'
      return false
    }
  }

  /** Sintetizza senza riprodurre: alimenta la cache e il precaricamento. */
  async synthesize(text: string, rate = 1): Promise<Blob> {
    if (!(await this.prepare()) || !this.engine) {
      throw new Error(this.message ?? 'Motore neurale non pronto')
    }
    const key = cacheKey({ text, voiceId: NEURAL_VOICE_ID, modelVersion: NEURAL_MODEL_VERSION, rate })
    const cached = await getCached(key)
    if (cached) return cached
    const response = await this.engine.generate(text, NEURAL_VOICE_ID, 0)
    if (!response?.file) throw new Error('Sintesi senza audio')
    await putCached({ key, blob: response.file, voiceId: NEURAL_VOICE_ID, modelVersion: NEURAL_MODEL_VERSION })
    void pruneCache()
    return response.file
  }

  async play(text: string, opts: SpeechOptions = {}): Promise<void> {
    const rate = opts.rate ?? 1
    const blob = await this.synthesize(text, rate)

    const playback = playAudioBlob(blob, { rate, volume: opts.volume ?? 1, onStart: opts.onStart })
    this.currentStop = playback.stop
    try {
      await playback.promise
    } finally {
      this.currentStop = null
    }
  }

  stop(): void {
    this.currentStop?.()
    this.currentStop = null
  }

  /** Libera completamente il motore (usato quando l'adulto reinstalla il modello). */
  dispose(): void {
    this.stop()
    this.engine = null
    this.state = 'idle'
    this.progressValue = undefined
    try {
      localStorage.removeItem(INSTALL_FLAG)
    } catch {
      // nulla da fare
    }
    void this.audioContext?.close().catch(() => {})
    this.audioContext = null
  }
}
