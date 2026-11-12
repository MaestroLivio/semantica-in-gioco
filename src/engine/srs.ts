import type { ConceptStats } from './adaptive'
import { statusOf } from './adaptive'

export interface ReviewItem {
  conceptId: string
  dueAt: number
  intervalIndex: number
  lastResult: 'corretto' | 'con-aiuto' | 'errore'
}

/** Intervalli in giorni: 1, 3, 7, 14, poi 30. Configurabili dall'adulto. */
export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30]
const DAY = 86_400_000

export function scheduleNext(
  conceptId: string,
  previous: ReviewItem | undefined,
  result: ReviewItem['lastResult'],
  now: number,
  intervals: number[] = DEFAULT_INTERVALS,
): ReviewItem {
  const baseIndex = previous?.intervalIndex ?? 0
  let index = baseIndex
  if (result === 'errore') index = 0
  else if (result === 'con-aiuto') index = Math.max(0, index)
  else index = Math.min(intervals.length - 1, baseIndex + 1)
  const days = intervals[Math.min(index, intervals.length - 1)]
  return { conceptId, dueAt: now + days * DAY, intervalIndex: index, lastResult: result }
}

export function dueReviewItems(items: ReviewItem[], now: number): ReviewItem[] {
  return items.filter((i) => i.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt)
}

/** Elementi da riprendere oggi, includendo i concetti in difficoltà ancora senza ripasso. */
export function buildReviewQueue(
  items: ReviewItem[],
  stats: ConceptStats[],
  now: number,
  limit = 12,
): { conceptId: string; reason: 'scaduto' | 'difficoltà'; dueAt: number }[] {
  const scheduled = dueReviewItems(items, now).map((i) => ({
    conceptId: i.conceptId,
    reason: 'scaduto' as const,
    dueAt: i.dueAt,
  }))
  const scheduledIds = new Set(scheduled.map((s) => s.conceptId))
  const struggling = stats
    .filter((s) => !scheduledIds.has(s.conceptId) && statusOf(s) === 'da-ripassare')
    .map((s) => ({ conceptId: s.conceptId, reason: 'difficoltà' as const, dueAt: s.lastSeen }))
  return [...scheduled, ...struggling].slice(0, limit)
}

export function describeDue(dueAt: number, now: number): string {
  const diff = Math.round((dueAt - now) / DAY)
  if (diff <= 0) return 'da riprendere oggi'
  if (diff === 1) return 'domani'
  return `tra ${diff} giorni`
}
