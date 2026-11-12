import { describe, expect, it } from 'vitest'
import type { ConceptStats } from './adaptive'
import { applyAttempt, emptyStats } from './adaptive'
import type { Attempt } from './adaptive'
import type { Exercise } from './exercise'
import { CATEGORY_BY_ID } from '../data/categories'
import { conceptLesson } from './generator'
import { validateExercise } from './validate'
import { CONCEPTS, requireConcept } from '../data/lexicon'
import {
  PHASES,
  analyseCategorize,
  analyseOrder,
  analysePair,
  analyseSelection,
  conceptOfTheDay,
  contrastSentence,
  nextStepRecommendation,
  planSession,
  scaffoldsFor,
  semanticCard,
  transferTask,
  workedExample,
} from './pedagogy'

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

function choiceExercise(targetId: string, optionIds: string[]): Exercise {
  return {
    id: 'test-choice',
    moduleId: 'm1',
    kind: 'choose-image',
    level: 2,
    prompt: `Tocca ${targetId}.`,
    conceptIds: [targetId],
    targetConceptId: targetId,
    options: optionIds.map((id) => ({ id, conceptId: id, image: `/pictograms/${id}.webp` })),
    correct: [targetId],
    scoring: 'objective',
    origin: 'bank',
  }
}

describe('fasi della sessione', () => {
  const exercises = Array.from({ length: 8 }, (_, i) => ({ id: `e${i}` } as Exercise))

  it('apre con riscaldamento e dimostrazione, poi lascia la pratica', () => {
    const plan = planSession(exercises)
    expect(plan).toHaveLength(8)
    expect(plan[0].phase).toBe('aggancio')
    expect(plan[1].phase).toBe('modellamento')
    expect(plan.at(-1)!.phase).toBe('pratica-autonoma')
  })

  it('non mette la pratica autonoma prima di quella guidata', () => {
    const phases = planSession(exercises).map((p) => p.phase)
    const firstIndependent = phases.indexOf('pratica-autonoma')
    const lastGuided = phases.lastIndexOf('pratica-guidata')
    expect(firstIndependent).toBeGreaterThan(lastGuided)
  })

  it('gestisce sessioni molto brevi senza fasi impossibili', () => {
    expect(planSession([])).toEqual([])
    expect(planSession(exercises.slice(0, 1)).map((p) => p.phase)).toEqual(['modellamento'])
    expect(planSession(exercises.slice(0, 2)).map((p) => p.phase)).toEqual(['aggancio', 'modellamento'])
    expect(planSession(exercises.slice(0, 3)).map((p) => p.phase)).toEqual([
      'aggancio',
      'modellamento',
      'pratica-guidata',
    ])
  })

  it('in una mini-lezione parte dalla dimostrazione, senza riscaldamento fuori tema', () => {
    const phases = planSession(exercises.slice(0, 3), { startWithModel: true }).map((p) => p.phase)
    expect(phases[0]).toBe('modellamento')
    expect(phases).not.toContain('aggancio')
    expect(phases.at(-1)).toBe('pratica-autonoma')
  })

  it('riduce gli aiuti nella pratica autonoma', () => {
    expect(scaffoldsFor('pratica-autonoma').cues).toBe(false)
    expect(scaffoldsFor('pratica-autonoma').eliminateDistractors).toBe(false)
    expect(scaffoldsFor('modellamento').showSolution).toBe(true)
    expect(scaffoldsFor('pratica-guidata').eliminateDistractors).toBe(true)
  })

  it('ogni fase dichiara un messaggio per il bambino e una ragione per l’adulto', () => {
    for (const phase of Object.values(PHASES)) {
      expect(phase.label.length).toBeGreaterThan(2)
      expect(phase.childCue.length).toBeGreaterThan(10)
      expect(phase.adultCue.length).toBeGreaterThan(30)
    }
  })
})

describe('analisi dell’errore', () => {
  it('riconosce un distrattore della stessa categoria e spiega la differenza', () => {
    const target = requireConcept('mela')
    const sibling = CONCEPTS.find((c) => c.category === target.category && c.id !== target.id && c.image?.pictogram)
    expect(sibling).toBeTruthy()
    const analysis = analyseSelection(choiceExercise(target.id, [target.id, sibling!.id]), [sibling!.id])
    expect(analysis.kind).toBe('categoria-affine')
    expect(analysis.explanation).toContain(sibling!.lemma)
    expect(analysis.explanation).toContain(target.lemma)
    expect(analysis.cue).toBeTruthy()
  })

  it('distingue due gruppi diversi con i nomi delle categorie', () => {
    const target = requireConcept('mela')
    const other = CONCEPTS.find((c) => c.category !== target.category && c.image?.pictogram)
    const analysis = analyseSelection(choiceExercise(target.id, [target.id, other!.id]), [other!.id])
    expect(analysis.kind).toBe('categoria-diversa')
    expect(analysis.explanation).toContain(CATEGORY_BY_ID.get(other!.category)!.singular)
    expect(analysis.targetLemma).toBe(target.lemma)
  })

  it('nomina la relazione quando due concetti sono collegati', () => {
    const target = CONCEPTS.find((c) =>
      c.relations.some((r) => ['used-with', 'used-for', 'located-in'].includes(r.type)),
    )!
    const relation = target.relations.find((r) => ['used-with', 'used-for', 'located-in'].includes(r.type))!
    const analysis = analyseSelection(choiceExercise(target.id, [target.id, relation.target]), [relation.target])
    expect(analysis.kind).toBe('relazione-semantica')
    expect(analysis.explanation).toContain('collegati')
  })

  it('spiega una selezione multipla incompleta senza punire', () => {
    const exercise: Exercise = {
      ...choiceExercise('mela', ['mela', 'pera', 'cane']),
      kind: 'multi-select',
      correct: ['mela', 'pera'],
    }
    const analysis = analyseSelection(exercise, ['mela'])
    expect(analysis.kind).toBe('selezione-parziale')
    expect(analysis.explanation).toContain('1 elementi su 2')
    expect(analysis.explanation).toContain('pera')
  })

  it('non usa formule punitive', () => {
    const target = requireConcept('cane')
    const other = requireConcept('mela')
    const text = [
      contrastSentence(target, other),
      analyseSelection(choiceExercise(target.id, [target.id, other.id]), [other.id]).explanation,
      analyseSelection(choiceExercise(target.id, [target.id, other.id]), []).explanation,
    ].join(' ')
    expect(text.toLowerCase()).not.toMatch(/\bsbagliat[oaie]\b|\berrore\b|\bmale\b|punizione/)
  })

  it('indica la compagna corretta in una coppia e il contenitore giusto', () => {
    const dog = requireConcept('cane')
    const cat = requireConcept('gatto')
    const bone = CONCEPTS.find((c) => c.category === 'alimenti') ?? requireConcept('mela')
    const pair: Exercise = {
      id: 'p',
      moduleId: 'm5',
      kind: 'pair-match',
      level: 2,
      prompt: 'Unisci le coppie.',
      conceptIds: [dog.id, bone.id, cat.id, dog.id],
      pairs: [
        { left: { id: dog.id, conceptId: dog.id, label: dog.lemma }, right: { id: bone.id, conceptId: bone.id, label: bone.lemma } },
        { left: { id: cat.id, conceptId: cat.id, label: cat.lemma }, right: { id: 'latte', conceptId: 'latte', label: 'latte' } },
      ],
      correct: [`${dog.id}>${bone.id}`, `${cat.id}>latte`],
      scoring: 'objective',
      origin: 'bank',
    }
    const analysis = analysePair(pair, dog.id, 'latte')
    expect(analysis.kind).toBe('relazione-semantica')
    expect(analysis.explanation).toContain(bone.lemma)

    const categorize: Exercise = {
      ...choiceExercise('mela', ['mela', 'cane']),
      kind: 'categorize',
      bins: [
        { id: 'b1', label: 'Frutta', accepts: ['mela'] },
        { id: 'b2', label: 'Animali', accepts: ['cane'] },
      ],
    }
    const misplaced = analyseCategorize(categorize, { mela: 'b2', cane: 'b2' }, [
      { id: 'mela', label: 'mela' },
      { id: 'cane', label: 'cane' },
    ])
    expect(misplaced.kind).toBe('categoria-diversa')
    expect(misplaced.explanation).toContain('Frutta')
  })

  it('spiega un ordine sbagliato indicando che cosa viene prima', () => {
    const exercise: Exercise = {
      ...choiceExercise('mela', ['a', 'b', 'c']),
      kind: 'ordering',
      sequence: ['a', 'b', 'c'],
      correct: ['a', 'b', 'c'],
      options: [
        { id: 'a', label: 'mattina' },
        { id: 'b', label: 'pomeriggio' },
        { id: 'c', label: 'sera' },
      ],
    }
    const analysis = analyseOrder(exercise, ['b', 'a', 'c'])
    expect(analysis.kind).toBe('ordine')
    expect(analysis.explanation).toContain('mattina')
  })
})

describe('esempio svolto e transfer', () => {
  it('mostra il ragionamento e la risposta, senza saltare passaggi', () => {
    const example = workedExample(choiceExercise('mela', ['mela', 'cane']))
    expect(example.answer).toBe('mela')
    expect(example.steps.length).toBeGreaterThanOrEqual(4)
    expect(example.steps[0]).toContain('consegna')
    expect(example.steps.join(' ')).toContain('mela')
    expect(example.steps.join(' ').toLowerCase()).toContain('non è un problema')
  })

  it('propone compiti da svolgere senza dispositivo', () => {
    const transfer = transferTask(['cane', 'mela', 'sedia'])
    expect(transfer.tasks.length).toBeGreaterThan(0)
    expect(transfer.tasks.length).toBeLessThanOrEqual(3)
    expect(transfer.title).toContain('fuori dallo schermo')
    for (const task of transfer.tasks) {
      expect(task.length).toBeGreaterThan(20)
      expect(task).not.toMatch(/lorem|placeholder|TBD/i)
    }
  })

  it('funziona anche senza concetti noti', () => {
    expect(transferTask([]).tasks.length).toBe(1)
  })
})

describe('prossimo passo', () => {
  function statsFor(id: string, partial: Partial<Attempt> = {}): ConceptStats {
    return applyAttempt(emptyStats(id), attempt({ conceptIds: [id], targetConceptId: id, ...partial }))
  }

  it('senza dati non inventa un passo', () => {
    expect(nextStepRecommendation([])).toBeNull()
  })

  it('propone il ripasso ravvicinato dopo un errore', () => {
    const stats = [statsFor('mela', { correct: false })]
    const next = nextStepRecommendation(stats)!
    expect(next.action).toBe('riprendere')
    expect(next.mode).toBe('ripasso')
    expect(next.conceptIds).toContain('mela')
    expect(next.why.length).toBeGreaterThan(20)
  })

  it('propone di alzare il livello solo su competenze stabili', () => {
    let stats = emptyStats('cane')
    const kinds = ['choose-image', 'choose-label', 'open-recall'] as const
    let session = 0
    for (let round = 0; round < 3; round++) {
      for (const kind of kinds) {
        session++
        stats = applyAttempt(stats, attempt({ conceptIds: ['cane'], targetConceptId: 'cane', sessionId: `s${session}`, kind }))
      }
    }
    const next = nextStepRecommendation([stats])!
    expect(next.action).toBe('estendere')
    expect(next.level).toBeGreaterThanOrEqual(3)
  })
})

describe('mini-lezione dalla scheda parola', () => {
  it('costruisce tre attività valide sul concetto scelto', () => {
    const lesson = conceptLesson('montagna', 2)
    expect(lesson).toHaveLength(3)
    expect(lesson.every((ex) => ex.targetConceptId === 'montagna')).toBe(true)
    expect(lesson.map((ex) => ex.kind)).toEqual(['choose-image', 'choose-label', 'open-recall'])
    for (const exercise of lesson) {
      expect(validateExercise(exercise)).toEqual([])
    }
  })

  it('non inventa una lezione per un concetto senza immagine', () => {
    expect(conceptLesson('concetto-inesistente')).toEqual([])
  })
})

describe('scheda parola e parola del giorno', () => {
  it('costruisce una griglia leggibile con categoria e funzione', () => {
    const rows = semanticCard(requireConcept('ombrello'))
    expect(rows.length).toBeGreaterThanOrEqual(3)
    expect(rows[0].label).toBe('È un tipo di')
    for (const row of rows) {
      expect(row.label.length).toBeGreaterThan(2)
      expect(row.value.length).toBeGreaterThan(1)
    }
  })

  it('la parola del giorno è stabile nella giornata e cambia nel tempo', () => {
    const day = new Date('2026-11-12T09:00:00')
    const a = conceptOfTheDay('p-1', day)
    const b = conceptOfTheDay('p-1', new Date('2026-11-12T21:00:00'))
    const c = conceptOfTheDay('p-1', new Date('2026-11-20T09:00:00'))
    expect(a?.id).toBe(b?.id)
    expect(a?.id).not.toBe(c?.id)
    expect(a?.image?.pictogram).toBeTruthy()
  })
})
