// Motore "registrato": riproduce una raccolta di audio pregenerati con la
// stessa voce neurale. È la strategia per i dispositivi che non riescono a
// eseguire il modello (Chromebook, tablet): l'audio è identico su ogni
// dispositivo perché è lo stesso file.

import type { EngineStatus, SpeechEngine, SpeechOptions } from './types'
import { cacheKey } from './cache'
import { playAudioBlob } from './audio-element'

/** Percorso del pacchetto audio incluso nell'app (public/tts/pack). */
export const RECORDED_PACK_URL = './tts/pack/manifest.json'

export interface RecordedPackManifest {
  voice: string
  model?: string
  license: string
  generatedAt: string
  /** chiave = testo normalizzato, valore = file relativo al manifest */
  clips: Record<string, string>
}

const PACK_VERSION = '1'

export class RecordedSpeechEngine implements SpeechEngine {
  readonly kind = 'recorded' as const
  private manifest: RecordedPackManifest | null = null
  private attempted = false
  private state: EngineStatus['state'] = 'idle'
  private message: string | undefined
  private currentStop: (() => void) | null = null

  status(): EngineStatus {
    return {
      kind: 'recorded',
      state: this.state,
      voiceLabel: this.manifest?.voice ?? 'Pacchetto audio pregenerato',
      modelId: this.manifest?.model,
      license: this.manifest?.license,
      offlineReady: Boolean(this.manifest),
      message: this.message,
    }
  }

  /** true se esiste una clip per questo testo (dopo `prepare`). */
  hasClip(text: string): boolean {
    return Boolean(this.manifest?.clips[text])
  }

  async prepare(): Promise<boolean> {
    if (this.attempted) return this.state === 'ready'
    this.attempted = true
    try {
      const response = await fetch(RECORDED_PACK_URL, { cache: 'force-cache' })
      if (!response.ok) {
        this.state = 'unavailable'
        this.message = 'Nessun pacchetto audio pregenerato incluso in questa build.'
        return false
      }
      const manifest = (await response.json()) as RecordedPackManifest
      if (!manifest?.clips || !manifest.voice) {
        this.state = 'unavailable'
        this.message = 'Il pacchetto audio non è valido.'
        return false
      }
      this.manifest = manifest
      this.state = 'ready'
      return true
    } catch {
      this.state = 'unavailable'
      this.message = 'Pacchetto audio non raggiungibile.'
      return false
    }
  }

  async play(text: string, opts: SpeechOptions = {}): Promise<void> {
    if (!this.manifest) await this.prepare()
    const clip = this.manifest?.clips[text]
    if (!clip) {
      // Nessun audio pregenerato per un contenuto dinamico: il chiamante
      // decide il fallback. Meglio tacere che pronunciare con un'altra voce.
      throw new Error('Contenuto non presente nel pacchetto audio')
    }
    const url = new URL(clip, new URL(RECORDED_PACK_URL, window.location.href)).href
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) throw new Error('Clip audio non disponibile')
    const blob = await response.blob()
    const playback = playAudioBlob(blob, {
      rate: opts.rate ?? 1,
      volume: opts.volume ?? 1,
      onStart: opts.onStart,
    })
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

  /** Nome della clip attesa per un testo, utile al generatore del pacchetto. */
  static clipName(text: string, voiceId: string): string {
    return `${cacheKey({ text, voiceId, modelVersion: PACK_VERSION, rate: 1 }).replace(/[|]/g, '_')}.wav`
  }
}
