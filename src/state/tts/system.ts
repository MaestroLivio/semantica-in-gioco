// Fallback: sintesi vocale del sistema operativo.
// Resta disponibile quando il modello neurale non è installato, ma la voce
// cambia da dispositivo a dispositivo: l'interfaccia lo dichiara apertamente.

import type { EngineStatus, SpeechEngine, SpeechOptions } from './types'

let cachedVoices: SpeechSynthesisVoice[] = []

export interface VoiceInfo {
  uri: string
  name: string
  lang: string
  italian: boolean
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function loadVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices.length) cachedVoices = voices
  return cachedVoices
}

export function onVoicesChanged(cb: () => void): () => void {
  if (!speechSupported()) return () => {}
  const handler = () => {
    loadVoices()
    cb()
  }
  window.speechSynthesis.addEventListener('voiceschanged', handler)
  loadVoices()
  return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
}

export function listVoices(): VoiceInfo[] {
  return loadVoices().map((voice) => ({
    uri: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    italian: voice.lang.toLowerCase().startsWith('it'),
  }))
}

export function hasItalianVoice(): boolean {
  return listVoices().some((voice) => voice.italian)
}

function pickVoice(preferred: string | null | undefined): SpeechSynthesisVoice | undefined {
  const voices = loadVoices()
  if (!voices.length) return undefined
  if (preferred) {
    const exact = voices.find((voice) => voice.voiceURI === preferred)
    if (exact) return exact
  }
  return voices.find((voice) => voice.lang.toLowerCase().startsWith('it')) ?? voices[0]
}

export class SystemSpeechEngine implements SpeechEngine {
  readonly kind = 'system' as const
  private finish: (() => void) | null = null

  status(): EngineStatus {
    const voice = pickVoice(null)
    return {
      kind: 'system',
      state: speechSupported() ? 'ready' : 'unavailable',
      voiceLabel: voice ? voice.name : 'Voce del dispositivo',
      license: 'Fornita dal sistema operativo; qualità e disponibilità variano per dispositivo.',
      offlineReady: true,
      message: speechSupported()
        ? hasItalianVoice()
          ? undefined
          : 'Il dispositivo non espone una voce italiana: la pronuncia può essere alterata.'
        : 'Questo dispositivo non supporta la sintesi vocale.',
    }
  }

  async prepare(): Promise<boolean> {
    return speechSupported()
  }

  play(text: string, opts: SpeechOptions = {}): Promise<void> {
    if (!speechSupported() || !text.trim()) return Promise.resolve()
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(opts.voiceURI)
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang?.toLowerCase().startsWith('it') ? voice.lang : 'it-IT'
    utterance.rate = Math.min(1.4, Math.max(0.5, opts.rate ?? 0.9))
    utterance.volume = Math.min(1, Math.max(0, opts.volume ?? 1))
    utterance.pitch = 1

    return new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        this.finish = null
        resolve()
      }
      this.finish = done
      utterance.onend = done
      utterance.onerror = done
      synth.speak(utterance)
      opts.onStart?.()
    })
  }

  stop(): void {
    if (speechSupported()) window.speechSynthesis.cancel()
    this.finish?.()
    this.finish = null
  }
}
