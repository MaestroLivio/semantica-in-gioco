import type { Concept, Level } from './types'
import type { ExerciseKind } from './exercise'

export type ConceptStatus = 'nuovo' | 'in-apprendimento' | 'in-consolidamento' | 'consolidato' | 'da-ripassare'

export interface Attempt {
  id: string
  conceptIds: string[]
  targetConceptId?: string
  moduleId: string
  kind: ExerciseKind
  sessionId: string
  /** Risposta corretta al primo tentativo, senza aiuti. */
  correct: boolean
  /** L'item è stato risolto con un aiuto (indizio, riduzione alternative, modello). */
  usedHint: boolean
  /** Livello massimo di aiuto usato (0 = nessuno, fino a 6 = modello completo). */
  hintLevel: number
  /** Modalità con cui il bambino ha risposto. */
  modality: 'tap' | 'drag' | 'keyboard' | 'symbol' | 'oral' | 'adult-confirmed'
  /** Tempo in ms: registrato ma non usato per penalizzare. */
  ms: number
  at: number
  origin: 'bank' | 'generated'
  level: Level
}

export interface ConceptStats {
  conceptId: string
  exposures: number
  correct: number
  incorrect: number
  independent: number
  assisted: number
  maxHint: number
  /** Tipi di esercizio risolti correttamente: serve per la generalizzazione. */
  kindsMastered: string[]
  modules: string[]
  sessions: string[]
  lastSeen: number
  lastCorrectAt: number
  streak: number
}

export function emptyStats(conceptId: string): ConceptStats {
  return {
    conceptId,
    exposures: 0,
    correct: 0,
    incorrect: 0,
    independent: 0,
    assisted: 0,
    maxHint: 0,
    kindsMastered: [],
    modules: [],
    sessions: [],
    lastSeen: 0,
    lastCorrectAt: 0,
    streak: 0,
  }
}

export interface MasteryThresholds {
  /** Numero di sessioni diverse in cui la competenza deve comparire. */
  sessions: number
  /** Numero di tipi di attività diversi in cui la competenza deve comparire. */
  kinds: number
  /** Accuratezza minima (0-1). */
  accuracy: number
  /** Risposte autonome minime. */
  independent: number
}

export const DEFAULT_THRESHOLDS: MasteryThresholds = {
  sessions: 2,
  kinds: 3,
  accuracy: 0.75,
  independent: 3,
}

export function applyAttempt(stats: ConceptStats, attempt: Attempt): ConceptStats {
  const next: ConceptStats = {
    ...stats,
    exposures: stats.exposures + 1,
    correct: stats.correct + (attempt.correct ? 1 : 0),
    incorrect: stats.incorrect + (attempt.correct ? 0 : 1),
    independent: stats.independent + (attempt.correct && !attempt.usedHint ? 1 : 0),
    assisted: stats.assisted + (attempt.usedHint ? 1 : 0),
    maxHint: Math.max(stats.maxHint, attempt.hintLevel),
    lastSeen: Math.max(stats.lastSeen, attempt.at),
    lastCorrectAt: attempt.correct ? Math.max(stats.lastCorrectAt, attempt.at) : stats.lastCorrectAt,
    streak: attempt.correct ? stats.streak + 1 : 0,
    kindsMastered: [...new Set([...stats.kindsMastered, ...(attempt.correct ? [attempt.kind] : [])])],
    modules: [...new Set([...stats.modules, attempt.moduleId])],
    sessions: [...new Set([...stats.sessions, ...(attempt.correct ? [attempt.sessionId] : [])])],
  }
  return next
}

export function accuracyOf(stats: ConceptStats): number {
  return stats.exposures ? stats.correct / stats.exposures : 0
}

/**
 * Stato della competenza. Il consolidamento richiede che la stessa abilità
 * compaia in sessioni e attività diverse: non basta una percentuale alta.
 */
export function statusOf(stats: ConceptStats, thresholds: MasteryThresholds = DEFAULT_THRESHOLDS): ConceptStatus {
  if (!stats.exposures) return 'nuovo'
  const accuracy = accuracyOf(stats)
  const generalized = stats.sessions.length >= thresholds.sessions && stats.kindsMastered.length >= thresholds.kinds
  if (stats.incorrect > 0 && stats.streak === 0) return 'da-ripassare'
  if (generalized && accuracy >= thresholds.accuracy && stats.independent >= thresholds.independent) return 'consolidato'
  if (generalized || (accuracy >= 0.6 && stats.assisted > 0)) return 'in-consolidamento'
  return 'in-apprendimento'
}

export interface AdaptationSettings {
  autoAdaptive: boolean
  maxAlternatives: number
  cues: 'nessuno' | 'leggeri' | 'completi'
  communicationMode: 'touch' | 'caa' | 'verbale' | 'misto'
}

export interface Adaptation {
  alternatives: number
  cueLevel: 0 | 1 | 2 | 3
  preferRecall: boolean
  removeDistractors: number
  reason: string
}

/**
 * Regola il carico cognitivo in base alle prestazioni recenti.
 * I tempi non entrano mai nella decisione: un bambino lento non viene penalizzato.
 */
export function adapt(
  stats: ConceptStats,
  level: Level,
  settings: AdaptationSettings,
  thresholds: MasteryThresholds = DEFAULT_THRESHOLDS,
): Adaptation {
  const base = level <= 1 ? 2 : level <= 2 ? 3 : 4
  const capped = Math.min(base, settings.maxAlternatives)
  if (!settings.autoAdaptive) {
    return {
      alternatives: capped,
      cueLevel: settings.cues === 'completi' ? 2 : settings.cues === 'leggeri' ? 1 : 0,
      preferRecall: false,
      removeDistractors: 0,
      reason: 'Adattamento manuale impostato dall\'adulto.',
    }
  }
  const status = statusOf(stats, thresholds)
  const accuracy = accuracyOf(stats)

  if (status === 'nuovo' || stats.exposures < 2) {
    return {
      alternatives: Math.max(2, capped - 1),
      cueLevel: settings.cues === 'nessuno' ? 0 : 1,
      preferRecall: false,
      removeDistractors: 0,
      reason: 'Primo incontro con il concetto: poche alternative e un indizio disponibile.',
    }
  }
  if (status === 'da-ripassare' || accuracy < 0.5) {
    return {
      alternatives: 2,
      cueLevel: 2,
      preferRecall: false,
      removeDistractors: 1,
      reason: 'Serve un passo indietro: meno alternative e indizio semantico.',
    }
  }
  if (status === 'consolidato' && accuracy >= thresholds.accuracy) {
    return {
      alternatives: Math.min(capped + 1, settings.maxAlternatives),
      cueLevel: settings.cues === 'completi' ? 1 : 0,
      preferRecall: settings.communicationMode !== 'caa',
      removeDistractors: 0,
      reason: 'Competenza stabile: si può chiedere recupero senza alternative.',
    }
  }
  return {
    alternatives: capped,
    cueLevel: settings.cues === 'nessuno' ? 0 : 1,
    preferRecall: false,
    removeDistractors: 0,
    reason: 'Progressione graduale: manteniamo il livello attuale.',
  }
}

/** Livello suggerito per il prossimo esercizio sullo stesso concetto. */
export function suggestLevel(stats: ConceptStats, current: Level): Level {
  const status = statusOf(stats)
  if (status === 'da-ripassare') return Math.max(1, current - 1) as Level
  if (status === 'consolidato' && stats.streak >= 3) return Math.min(6, current + 1) as Level
  return current
}

export interface ConceptSummary {
  total: number
  presentati: number
  autonomi: number
  conAiuto: number
  inConsolidamento: number
  daRipassare: number
  consolidati: number
}

export function summarize(statsList: ConceptStats[]): ConceptSummary {
  const out: ConceptSummary = {
    total: statsList.length,
    presentati: 0,
    autonomi: 0,
    conAiuto: 0,
    inConsolidamento: 0,
    daRipassare: 0,
    consolidati: 0,
  }
  for (const s of statsList) {
    if (!s.exposures) continue
    out.presentati++
    if (s.independent > 0) out.autonomi++
    if (s.assisted > 0) out.conAiuto++
    const status = statusOf(s)
    if (status === 'in-consolidamento') out.inConsolidamento++
    if (status === 'da-ripassare') out.daRipassare++
    if (status === 'consolidato') out.consolidati++
  }
  return out
}

export function statsForConcepts(concepts: Concept[], all: ConceptStats[]): ConceptStats[] {
  const map = new Map(all.map((s) => [s.conceptId, s]))
  return concepts.map((c) => map.get(c.id) ?? emptyStats(c.id))
}
