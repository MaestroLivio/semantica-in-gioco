import type { Level } from './types'

export type ExerciseKind =
  | 'choose-image' // ascolta/leggi la consegna e tocca l'immagine
  | 'choose-label' // guarda l'immagine e scegli la parola
  | 'multi-select' // seleziona tutti gli elementi corretti
  | 'pair-match' // associa coppie
  | 'ordering' // ordina una sequenza
  | 'categorize' // metti ogni elemento nel contenitore giusto
  | 'odd-one-out' // trova l'intruso secondo un criterio esplicito
  | 'spatial-place' // colloca un oggetto in una posizione
  | 'sentence-build' // componi una frase con i simboli
  | 'open-recall' // denominazione con aiuti graduati
  | 'open-describe' // descrizione con mappa semantica

export type Scoring = 'objective' | 'adult' | 'self'

export interface ExOption {
  id: string
  label?: string
  conceptId?: string
  image?: string
  /** Parola/frase mostrata sotto l'immagine, se le etichette sono attive. */
  caption?: string
}

export interface ExBin {
  id: string
  label: string
  /** id delle opzioni accettate in questo contenitore */
  accepts: string[]
}

export interface ExPair {
  left: ExOption
  right: ExOption
}

export interface SpatialScene {
  referenceConceptId: string
  objectConceptId: string
  zones: { id: string; label: string; x: number; y: number; w: number; h: number }[]
  correctZone: string
}

export interface DescribeSlot {
  question: string
  options: ExOption[]
  correct: string[]
  help: string
}

export interface Exercise {
  id: string
  moduleId: string
  kind: ExerciseKind
  level: Level
  /** Consegna in italiano, sempre disponibile anche in audio. */
  prompt: string
  /** Testo alternativo più breve per la modalità essenziale. */
  promptShort?: string
  conceptIds: string[]
  /** Concetto centrale, per la ripetizione distribuita. */
  targetConceptId?: string
  options?: ExOption[]
  correct: string[]
  /** Criterio esplicito per intruso e categorizzazione. */
  criterion?: string
  bins?: ExBin[]
  pairs?: ExPair[]
  sequence?: string[]
  sentence?: { tokens: ExOption[]; correctOrder: string[] }
  scene?: SpatialScene
  describe?: DescribeSlot[]
  explanation?: string
  cue?: string
  scoring: Scoring
  /** Numero minimo di alternative consigliate in base al livello. */
  alternatives?: number
  /** Provenienza: banca curata o generata dal motore. */
  origin: 'bank' | 'generated'
}

/** Numero di alternative visive consigliato per livello. */
export function alternativesForLevel(level: Level): number {
  switch (level) {
    case 1:
      return 2
    case 2:
      return 3
    case 3:
      return 4
    default:
      return 4
  }
}

export function isCorrectSelection(exercise: Exercise, selected: string[]): boolean {
  if (!exercise.correct.length) return false
  const a = [...new Set(selected)].sort()
  const b = [...new Set(exercise.correct)].sort()
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export function orderedCorrect(exercise: Exercise, order: string[]): boolean {
  const expected = exercise.sequence ?? exercise.sentence?.correctOrder ?? []
  return expected.length === order.length && expected.every((id, i) => id === order[i])
}

export function matchingPairsCorrect(exercise: Exercise, mapping: Record<string, string>): boolean {
  if (!exercise.pairs?.length) return false
  return exercise.pairs.every((p) => mapping[p.left.id] === p.right.id)
}

export function categorizeCorrect(exercise: Exercise, placement: Record<string, string>): boolean {
  if (!exercise.bins?.length) return false
  for (const bin of exercise.bins) {
    for (const optionId of bin.accepts) {
      if (placement[optionId] !== bin.id) return false
    }
  }
  return Object.keys(placement).length === exercise.bins.reduce((n, b) => n + b.accepts.length, 0)
}
