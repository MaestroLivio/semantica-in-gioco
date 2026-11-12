// Variante usata dalla build web (SEMANTICA_WEB=1).
//
// Il motore neurale Piper pesa ~108 MB di WebAssembly e modello: nell'app
// desktop è scaricato una volta e resta offline, ma in una pubblicazione web
// supererebbe i limiti di spazio dell'hosting e il primo caricamento sarebbe
// inaccettabile. Questa implementazione dichiara il limite invece di simulare
// una funzione: l'app usa la voce del dispositivo o le registrazioni locali e
// lo dice all'adulto in Impostazioni → Voce e modello.

import type { EngineStatus, SpeechEngine, SpeechOptions } from './types'

export const NEURAL_VOICE_ID = 'it_IT-paola-medium'
export const NEURAL_MODEL_BYTES = 63_500_000
export const NEURAL_LICENSE = 'Modello: MIT (rhasspy/piper-voices) · dataset: CC0 1.0'

export function neuralInstalled(): boolean {
  return false
}

export class NeuralSpeechEngine implements SpeechEngine {
  readonly kind = 'neural' as const

  status(): EngineStatus {
    return {
      kind: 'neural',
      state: 'unavailable',
      voiceLabel: 'Voce neurale non inclusa nella versione web',
      modelId: NEURAL_VOICE_ID,
      modelBytes: NEURAL_MODEL_BYTES,
      license: NEURAL_LICENSE,
      message:
        'La voce neurale è inclusa solo nell’app desktop: in questa versione si usa la voce del dispositivo o le registrazioni personalizzate.',
      offlineReady: false,
    }
  }

  isInstalled(): boolean {
    return false
  }

  async prepare(): Promise<boolean> {
    return false
  }

  async synthesize(): Promise<Blob> {
    throw new Error('La voce neurale non è disponibile nella versione web.')
  }

  async play(_text: string, opts: SpeechOptions = {}): Promise<void> {
    opts.onEnd?.()
  }

  stop(): void {
    // Nessun audio da interrompere.
  }

  dispose(): void {
    // Nessuna risorsa da liberare.
  }
}
