import type { Exercise } from './exercise'
import type { Level } from './types'
import type { ConceptStats } from './adaptive'
import { suggestLevel } from './adaptive'

export interface SessionRequest {
  moduleIds: string[]
  level: Level
  count: number
  mode: 'nuovi' | 'consolidamento' | 'ripasso' | 'misto'
  targetConceptIds?: string[]
  seed?: string
}

export interface SessionConfigResult {
  exercises: Exercise[]
  skipped: number
}

function conceptIdsOf(ex: Exercise): string[] {
  return ex.targetConceptId ? [ex.targetConceptId] : ex.conceptIds
}

function relevance(ex: Exercise, stats: Map<string, ConceptStats>, mode: SessionRequest['mode']): number {
  const ids = conceptIdsOf(ex)
  const records = ids.map((id) => stats.get(id)).filter((s): s is ConceptStats => Boolean(s))
  const exposures = records.reduce((n, s) => n + s.exposures, 0)
  const mistakes = records.reduce((n, s) => n + s.incorrect, 0)
  const correct = records.reduce((n, s) => n + s.correct, 0)
  const accuracy = exposures ? correct / exposures : 0
  switch (mode) {
    case 'nuovi':
      return -exposures
    case 'consolidamento':
      return exposures > 0 && accuracy < 0.9 ? 10 : -exposures
    case 'ripasso':
      return mistakes * 3 - exposures * 0.2
    default:
      return -Math.abs(exposures - 2)
  }
}

/**
 * Compone una sessione equilibrata: alterna tipi di attività, evita richieste
 * identiche consecutive e rispetta il numero di esercizi richiesto.
 */
export function composeSession(
  bank: Exercise[],
  request: SessionRequest,
  stats: ConceptStats[],
): SessionConfigResult {
  const statMap = new Map(stats.map((s) => [s.conceptId, s]))
  const modules = new Set(request.moduleIds)
  let pool = bank.filter((ex) => modules.has(ex.moduleId))
  if (request.targetConceptIds?.length) {
    const targets = new Set(request.targetConceptIds)
    const focused = pool.filter((ex) => ex.conceptIds.some((id) => targets.has(id)))
    if (focused.length) pool = focused
  }

  // Adatta il livello richiesto per i concetti già consolidati o in difficoltà.
  const adjusted = pool.map((ex) => {
    const targetId = ex.targetConceptId
    if (!targetId) return ex
    const s = statMap.get(targetId)
    if (!s || !s.exposures) return ex
    const next = suggestLevel(s, ex.level)
    return next === ex.level ? ex : { ...ex, level: next }
  })

  const scored = adjusted
    .map((ex) => ({ ex, score: relevance(ex, statMap, request.mode), tie: ex.id }))
    .sort((a, b) => b.score - a.score || a.tie.localeCompare(b.tie))

  const chosen: Exercise[] = []
  const lastKind = new Map<string, string>()
  const lastTarget = new Map<string, string>()
  let skipped = 0

  const take = (list: Exercise[]) => {
    for (const ex of list) {
      if (chosen.length >= request.count) return true
      const key = ex.moduleId
      const target = ex.targetConceptId ?? ex.conceptIds[0] ?? ''
      if (lastKind.get(key) === ex.kind && lastTarget.get(key) === target) {
        skipped++
        continue
      }
      chosen.push(ex)
      lastKind.set(key, ex.kind)
      lastTarget.set(key, target)
    }
    return chosen.length >= request.count
  }

  take(scored.map((s) => s.ex))

  // Se non bastano esercizi validi, completa con varianti generate dai concetti.
  if (chosen.length < request.count) {
    const used = new Set(chosen.map((e) => e.id))
    take(scored.filter((s) => !used.has(s.ex.id)).map((s) => s.ex))
  }

  return { exercises: chosen, skipped }
}

/** Alterna moduli diversi quando l'adulto ne ha scelti più di uno. */
export function interleaveByModule(exercises: Exercise[]): Exercise[] {
  const byModule = new Map<string, Exercise[]>()
  for (const ex of exercises) {
    const list = byModule.get(ex.moduleId) ?? []
    list.push(ex)
    byModule.set(ex.moduleId, list)
  }
  const out: Exercise[] = []
  let added = true
  while (added) {
    added = false
    for (const list of byModule.values()) {
      const next = list.shift()
      if (next) {
        out.push(next)
        added = true
      }
    }
  }
  return out
}
