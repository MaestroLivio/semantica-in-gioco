import { describe, expect, it } from 'vitest'
import type { Attempt } from './adaptive'
import {
  DEFAULT_THRESHOLDS,
  accuracyOf,
  adapt,
  applyAttempt,
  emptyStats,
  statusOf,
  suggestLevel,
  summarize,
} from './adaptive'
import { buildReviewQueue, DEFAULT_INTERVALS, scheduleNext, type ReviewItem } from './srs'
import { composeSession, interleaveByModule } from './session'
import { isCorrectSelection, orderedCorrect, type Exercise } from './exercise'
import { validateExercise } from './validate'
import { EXERCISE_BANK } from '../data/bank'
import { buildChoice, pickDistractors, sentenceExercise, spatialExercise, describeSlots, recallCueLadder } from './generator'
import { requireConcept } from '../data/lexicon'

function attempt(partial: Partial<Attempt> = {}): Attempt {
  return {
    id: `a-${Math.random().toString(36).slice(2, 8)}`,
    conceptIds: ['mela'],
    targetConceptId: 'mela',
    moduleId: 'm1',
    kind: 'choose-image',
    sessionId: 's1',
    correct: true,
    usedHint: false,
    hintLevel: 0,
    modality: 'tap',
    ms: 1200,
    at: Date.now(),
    origin: 'bank',
    level: 1,
    ...partial,
  }
}

describe('modello adattivo', () => {
  it('parte da uno stato "nuovo" senza esposizioni', () => {
    expect(statusOf(emptyStats('mela'))).toBe('nuovo')
  })

  it('non considera consolidata una competenza in una sola sessione', () => {
    let stats = emptyStats('mela')
    for (let i = 0; i < 6; i++) {
      stats = applyAttempt(stats, attempt({ sessionId: 's1', kind: 'choose-image' }))
    }
    expect(accuracyOf(stats)).toBeGreaterThan(0.9)
    expect(statusOf(stats)).not.toBe('consolidato')
    // Resta in apprendimento finché la competenza non compare in contesti diversi.
    expect(statusOf(stats)).toBe('in-apprendimento')
  })

  it('richiede sessioni e attività diverse per il consolidamento', () => {
    let stats = emptyStats('mela')
    const kinds = ['choose-image', 'choose-label', 'open-recall'] as const
    let session = 0
    for (let round = 0; round < 3; round++) {
      for (const kind of kinds) {
        session++
        stats = applyAttempt(stats, attempt({ sessionId: `s${session}`, kind, correct: true }))
      }
    }
    expect(stats.sessions.length).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.sessions)
    expect(stats.kindsMastered.length).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.kinds)
    expect(statusOf(stats)).toBe('consolidato')
  })

  it('un errore riporta il concetto fra quelli da riprendere', () => {
    let stats = emptyStats('mela')
    stats = applyAttempt(stats, attempt())
    stats = applyAttempt(stats, attempt({ correct: false }))
    expect(statusOf(stats)).toBe('da-ripassare')
  })

  it('i tempi lunghi non cambiano lo stato né il livello', () => {
    let fast = emptyStats('palla')
    let slow = emptyStats('palla')
    for (let i = 0; i < 4; i++) {
      fast = applyAttempt(fast, attempt({ conceptIds: ['palla'], targetConceptId: 'palla', ms: 400, sessionId: `k${i}` }))
      slow = applyAttempt(slow, attempt({ conceptIds: ['palla'], targetConceptId: 'palla', ms: 90_000, sessionId: `k${i}` }))
    }
    expect(statusOf(fast)).toBe(statusOf(slow))
    expect(suggestLevel(fast, 2)).toBe(suggestLevel(slow, 2))
  })

  it('l\'adattamento riduce le alternative quando le prestazioni sono basse', () => {
    let stats = emptyStats('mela')
    stats = applyAttempt(stats, attempt({ correct: true }))
    stats = applyAttempt(stats, attempt({ correct: false }))
    const result = adapt(stats, 4, { autoAdaptive: true, maxAlternatives: 4, cues: 'leggeri', communicationMode: 'touch' })
    expect(result.alternatives).toBeLessThanOrEqual(2)
    expect(result.cueLevel).toBeGreaterThan(0)
  })

  it('con adattamento manuale non cambia nulla senza scelta dell\'adulto', () => {
    const stats = emptyStats('mela')
    const result = adapt(stats, 3, { autoAdaptive: false, maxAlternatives: 3, cues: 'nessuno', communicationMode: 'caa' })
    expect(result.reason).toContain('manuale')
  })

  it('il riepilogo conta correttamente le categorie di stato', () => {
    const s1 = applyAttempt(emptyStats('a'), attempt({ conceptIds: ['a'], targetConceptId: 'a' }))
    const s2 = applyAttempt(emptyStats('b'), attempt({ conceptIds: ['b'], targetConceptId: 'b', correct: false }))
    const summary = summarize([s1, s2])
    expect(summary.presentati).toBe(2)
    expect(summary.daRipassare).toBe(1)
  })
})

describe('ripetizione distribuita', () => {
  it('programma 1, 3, 7 giorni in caso di risposte corrette', () => {
    const now = 1_000_000
    let item: ReviewItem | undefined
    const days: number[] = []
    for (let i = 0; i < 3; i++) {
      item = scheduleNext('mela', item, 'corretto', now)
      days.push(Math.round((item.dueAt - now) / 86_400_000))
    }
    expect(days).toEqual([3, 7, 14])
  })

  it('un errore riporta l\'intervallo al primo passo', () => {
    let item = scheduleNext('mela', undefined, 'corretto', 0)
    item = scheduleNext('mela', item, 'corretto', 0)
    item = scheduleNext('mela', item, 'errore', 0)
    expect(item.intervalIndex).toBe(0)
    expect(Math.round(item.dueAt / 86_400_000)).toBe(1)
  })

  it('include i concetti in difficoltà anche senza ripasso programmato', () => {
    let stats = emptyStats('palla')
    stats = applyAttempt(stats, attempt({ conceptIds: ['palla'], targetConceptId: 'palla', correct: false }))
    const queue = buildReviewQueue([], [stats], Date.now(), 5)
    expect(queue[0]?.conceptId).toBe('palla')
    expect(queue[0]?.reason).toBe('difficoltà')
  })

  it('rispetta gli intervalli personalizzati', () => {
    const item = scheduleNext('mela', undefined, 'corretto', 0, [2, 5])
    expect(Math.round(item.dueAt / 86_400_000)).toBe(5)
    expect(DEFAULT_INTERVALS[0]).toBe(1)
  })
})

describe('validazione degli esercizi', () => {
  it('rifiuta un esercizio senza risposta corretta fra le opzioni', () => {
    const broken: Exercise = {
      id: 'x',
      moduleId: 'm1',
      kind: 'choose-image',
      level: 1,
      prompt: 'Tocca la mela',
      conceptIds: ['mela'],
      options: [
        { id: 'cane', image: '/p/1.png' },
        { id: 'gatto', image: '/p/2.png' },
      ],
      correct: ['mela'],
      scoring: 'objective',
      origin: 'bank',
    }
    expect(validateExercise(broken).length).toBeGreaterThan(0)
  })

  it('rifiuta due alternative con la stessa immagine', () => {
    const ex: Exercise = {
      id: 'y',
      moduleId: 'm1',
      kind: 'choose-image',
      level: 1,
      prompt: 'Tocca la mela',
      conceptIds: ['mela'],
      options: [
        { id: 'mela', image: '/p/1.png' },
        { id: 'pera', image: '/p/1.png' },
      ],
      correct: ['mela'],
      scoring: 'objective',
      origin: 'bank',
    }
    expect(validateExercise(ex)).toContain('Due alternative mostrano la stessa immagine')
  })

  it('rifiuta un contenitore con un elemento in due gruppi', () => {
    const ex: Exercise = {
      id: 'z',
      moduleId: 'm2',
      kind: 'categorize',
      level: 1,
      prompt: 'Metti in ordine',
      conceptIds: ['mela', 'cane'],
      options: [],
      correct: ['mela'],
      bins: [
        { id: 'b1', label: 'Frutta', accepts: ['mela'] },
        { id: 'b2', label: 'Animali', accepts: ['mela'] },
      ],
      scoring: 'objective',
      origin: 'bank',
    }
    expect(validateExercise(ex).some((p) => p.includes('due contenitori'))).toBe(true)
  })

  it('la banca curata non contiene esercizi non validi', () => {
    for (const ex of EXERCISE_BANK) {
      expect({ id: ex.id, problems: validateExercise(ex) }).toEqual({ id: ex.id, problems: [] })
    }
  })
})

describe('composizione della sessione', () => {
  const stats = [emptyStats('mela')]

  it('rispetta il numero richiesto di esercizi', () => {
    const result = composeSession(EXERCISE_BANK, { moduleIds: ['m1'], level: 2, count: 6, mode: 'misto' }, stats)
    expect(result.exercises.length).toBe(6)
  })

  it('non ripete consecutive la stessa richiesta identica', () => {
    const result = composeSession(EXERCISE_BANK, { moduleIds: ['m1', 'm2'], level: 2, count: 10, mode: 'misto' }, stats)
    for (let i = 1; i < result.exercises.length; i++) {
      const prev = result.exercises[i - 1]
      const curr = result.exercises[i]
      const sameTarget = prev.targetConceptId === curr.targetConceptId
      const sameKind = prev.kind === curr.kind
      expect(sameTarget && sameKind).toBe(false)
    }
  })

  it('alterna i moduli quando ne vengono scelti più di uno', () => {
    const list = [1, 2, 3, 4].flatMap((n) =>
      ['a', 'b'].map((m) => ({ id: `${m}-${n}`, moduleId: m } as Exercise)),
    )
    const result = interleaveByModule(list)
    expect(result[0].moduleId).not.toBe(result[1].moduleId)
  })

  it('filtra sui concetti target quando richiesto', () => {
    const result = composeSession(
      EXERCISE_BANK,
      { moduleIds: ['m1'], level: 3, count: 5, mode: 'ripasso', targetConceptIds: ['cane'] },
      stats,
    )
    expect(result.exercises.every((e) => e.conceptIds.includes('cane'))).toBe(true)
  })
})

describe('generatore di esercizi', () => {
  it('produce alternative coerenti e senza duplicati', () => {
    const target = requireConcept('cane')
    const options = buildChoice(target, 3, 'test')
    const ids = options.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('cane')
    expect(options.every((o) => Boolean(o.image))).toBe(true)
  })

  it('i distrattori non sono il concetto target', () => {
    const target = requireConcept('mela')
    const distractors = pickDistractors(target, 3, 4, 'seed')
    expect(distractors.some((d) => d.id === 'mela')).toBe(false)
  })

  it('genera frasi valide con i simboli una sola volta', () => {
    const ex = sentenceExercise(requireConcept('bambino'), requireConcept('mangiare'), requireConcept('mela'), 2, 't1')
    expect(validateExercise(ex)).toEqual([])
    expect(orderedCorrect(ex, ex.sentence!.correctOrder)).toBe(true)
  })

  it('genera scene spaziali con la zona corretta presente', () => {
    const ex = spatialExercise(requireConcept('scatola'), requireConcept('palla'), { id: 'dentro', label: 'dentro' }, 1)
    expect(validateExercise(ex)).toEqual([])
    expect(ex.scene?.zones.some((z) => z.id === 'dentro')).toBe(true)
  })

  it('la mappa di descrizione accetta più risposte e non usa testo segnaposto', () => {
    const slots = describeSlots(requireConcept('ombrello'))
    expect(slots.length).toBeGreaterThanOrEqual(4)
    for (const slot of slots) {
      expect(slot.question).not.toMatch(/lorem|placeholder/i)
      expect(slot.help.length).toBeGreaterThan(3)
    }
  })

  it('la scala di aiuti è graduata e pertinente', () => {
    const cues = recallCueLadder(requireConcept('ombrello'))
    expect(cues.length).toBeGreaterThanOrEqual(2)
    for (const cue of cues) {
      expect(cue.trim().length).toBeGreaterThan(4)
      expect(cue.endsWith('.')).toBe(true)
    }
    expect(cues.join(' ').toLowerCase()).toMatch(/pioggia|utensile|oggetto|serve/)
  })

  it('accetta tutte le risposte corrette nelle selezioni multiple', () => {
    const multi = EXERCISE_BANK.find((e) => e.kind === 'multi-select')
    expect(multi).toBeTruthy()
    expect(isCorrectSelection(multi!, multi!.correct)).toBe(true)
    expect(isCorrectSelection(multi!, multi!.correct.slice(0, 1))).toBe(false)
  })
})
