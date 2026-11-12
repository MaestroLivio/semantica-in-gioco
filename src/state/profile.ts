export type CommunicationMode = 'touch' | 'caa' | 'verbale' | 'misto'
export type VisualMode = 'essenziale' | 'standard' | 'esplorazione'

export interface SensorySettings {
  decoratives: boolean
  animations: boolean
  autoplayAudio: boolean
}

/** Profilo bambino: solo uno pseudonimo, nessun dato identificativo. */
export interface ChildProfile {
  id: string
  nickname: string
  color: string
  ageBand: '3-5' | '6-7' | '8-9' | '10-11'
  createdAt: number
  updatedAt: number
  communicationMode: CommunicationMode
  showText: boolean
  symbolLabels: boolean
  /** Mostra tutte le scritte dell'interfaccia in maiuscolo. */
  uppercase: boolean
  alternatives: 2 | 3 | 4 | 6
  visualMode: VisualMode
  highContrast: boolean
  reducedMotion: boolean
  scanMode: boolean
  motorMode: 'tap' | 'drag' | 'both'
  ttsRate: number
  ttsVolume: number
  /** Motore vocale preferito: 'auto' usa la voce neurale se già installata. */
  ttsEngine: 'auto' | 'neural' | 'recorded' | 'system'
  /** Velocità della modalità lenta (mai una semplice alterazione del tono). */
  ttsSlowRate: number
  /** Letture aggiuntive della consegna dopo la prima (0 = una sola). */
  ttsRepeat: number
  /** Pausa prima della consegna, in millisecondi. */
  ttsPauseBeforeMs: number
  /** Pausa dopo la consegna, in millisecondi. */
  ttsPauseAfterMs: number
  /** Ripete solo la parola target invece dell'intera frase. */
  ttsRepeatTargetOnly: boolean
  /** Legge automaticamente i feedback di risposta. */
  ttsReadFeedback: boolean
  decorativeSounds: boolean
  autoAudio: boolean
  autoAdaptive: boolean
  cues: 'nessuno' | 'leggeri' | 'completi'
  masterySessions: number
  masteryKinds: number
  masteryAccuracy: number
  reviewIntervals: number[]
  sessionLength: number
  objectives: string[]
  focusVocabulary: string[]
  interests: string[]
  notesForAdult: string
  pinProtected?: boolean
}

export const PROFILE_COLORS = ['#3f7d6e', '#5b7fb8', '#c96a4e', '#8d7bab', '#c9a24e', '#6d9bb5']

export function createProfile(nickname: string, index = 0): ChildProfile {
  const now = Date.now()
  return {
    id: `p-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    nickname: nickname.trim() || 'Bambino',
    color: PROFILE_COLORS[index % PROFILE_COLORS.length],
    ageBand: '6-7',
    createdAt: now,
    updatedAt: now,
    communicationMode: 'touch',
    showText: true,
    symbolLabels: true,
    uppercase: false,
    alternatives: 3,
    visualMode: 'standard',
    highContrast: false,
    reducedMotion: false,
    scanMode: false,
    motorMode: 'both',
    ttsRate: 0.9,
    ttsVolume: 1,
    ttsEngine: 'auto',
    ttsSlowRate: 0.65,
    ttsRepeat: 0,
    ttsPauseBeforeMs: 0,
    ttsPauseAfterMs: 0,
    ttsRepeatTargetOnly: false,
    ttsReadFeedback: true,
    decorativeSounds: false,
    autoAudio: true,
    autoAdaptive: true,
    cues: 'leggeri',
    masterySessions: 2,
    masteryKinds: 3,
    masteryAccuracy: 0.75,
    reviewIntervals: [1, 3, 7, 14],
    sessionLength: 8,
    objectives: [],
    focusVocabulary: [],
    interests: [],
    notesForAdult: '',
  }
}

/**
 * Profili salvati prima dell'introduzione dei campi audio non li hanno:
 * i valori mancanti vengono completati senza toccare i dati esistenti.
 * Non è una migrazione distruttiva e non richiede un cambio di versione del DB.
 */
export function withProfileDefaults(profile: Partial<ChildProfile> & { id: string }): ChildProfile {
  const base = createProfile(profile.nickname ?? 'Bambino')
  return { ...base, ...profile, id: profile.id }
}

export interface GlobalSettings {
  adultPin: string | null
  preferredVoiceURI: string | null
  showLicensesOnStart: boolean
  lastProfileId: string | null
  /** Lingua dell'interfaccia: vale per il dispositivo, non per il singolo profilo. */
  language: 'it' | 'en'
  /** Dizionario di pronuncia personalizzato (parola → forma per la sintesi). */
  pronunciation?: { word: string; spoken: string; context?: string }[]
}

export const DEFAULT_GLOBAL: GlobalSettings = {
  adultPin: null,
  preferredVoiceURI: null,
  showLicensesOnStart: false,
  lastProfileId: null,
  language: 'it',
  pronunciation: [],
}

export function profileInitials(nickname: string): string {
  return nickname
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}
