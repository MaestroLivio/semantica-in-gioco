import type { Exercise } from './exercise'
import { CONCEPT_BY_ID } from '../data/lexicon'

export interface ExerciseIssue {
  exerciseId: string
  problem: string
}

/**
 * Regole di validazione applicate a ogni esercizio della banca e a quelli generati.
 * Un esercizio che non le rispetta non viene mostrato al bambino.
 */
export function validateExercise(ex: Exercise, concepts = CONCEPT_BY_ID): string[] {
  const problems: string[] = []
  if (!ex.prompt.trim()) problems.push('Consegna vuota')
  if (ex.level < 1 || ex.level > 6) problems.push('Livello fuori intervallo')
  if (!ex.conceptIds.length) problems.push('Nessun concetto coinvolto')
  for (const id of ex.conceptIds) {
    if (!concepts.has(id)) problems.push(`Concetto inesistente: ${id}`)
  }
  // Le attività aperte con valutazione adulta non hanno una risposta unica.
  if (!ex.correct.length && ex.scoring !== 'adult') problems.push('Nessuna risposta corretta dichiarata')
  const optionIds = new Set((ex.options ?? []).map((o) => o.id))
  if (optionIds.size !== (ex.options ?? []).length) problems.push('Opzioni con id duplicato')

  switch (ex.kind) {
    case 'choose-image':
    case 'choose-label':
    case 'odd-one-out': {
      if ((ex.options ?? []).length < 2) problems.push('Servono almeno due alternative')
      if (ex.correct.length !== 1) problems.push('Deve esserci una sola risposta corretta')
      for (const id of ex.correct) if (!optionIds.has(id)) problems.push(`Risposta non presente fra le opzioni: ${id}`)
      if (ex.kind === 'choose-image') {
        for (const o of ex.options ?? []) if (!o.image) problems.push(`Alternativa senza immagine: ${o.id}`)
      }
      break
    }
    case 'multi-select': {
      if ((ex.options ?? []).length < 3) problems.push('Servono almeno tre alternative')
      if (ex.correct.length < 1) problems.push('Nessuna risposta corretta')
      for (const id of ex.correct) if (!optionIds.has(id)) problems.push(`Risposta non presente: ${id}`)
      break
    }
    case 'pair-match': {
      if (!ex.pairs || ex.pairs.length < 2) problems.push('Servono almeno due coppie')
      for (const p of ex.pairs ?? []) {
        if (!p.left.image || !p.right.image) problems.push('Coppia senza immagini')
      }
      break
    }
    case 'ordering':
    case 'sentence-build': {
      const seq = ex.sequence ?? ex.sentence?.correctOrder
      if (!seq || seq.length < 2) problems.push('Sequenza troppo corta')
      if (ex.sentence) {
        const tokenIds = new Set(ex.sentence.tokens.map((t) => t.id))
        for (const id of ex.sentence.correctOrder) {
          if (!tokenIds.has(id)) problems.push(`Token della frase inesistente: ${id}`)
        }
        if (ex.sentence.tokens.length !== ex.sentence.correctOrder.length) {
          problems.push('La frase usa tutti i simboli disponibili una sola volta')
        }
      }
      break
    }
    case 'categorize': {
      if (!ex.bins || ex.bins.length < 2) problems.push('Servono almeno due contenitori')
      const placed = new Set<string>()
      for (const bin of ex.bins ?? []) {
        if (!bin.accepts.length) problems.push(`Contenitore vuoto: ${bin.label}`)
        for (const id of bin.accepts) {
          if (placed.has(id)) problems.push(`Elemento in due contenitori: ${id}`)
          placed.add(id)
        }
      }
      for (const id of ex.correct) if (!placed.has(id)) problems.push(`Elemento non collocato: ${id}`)
      break
    }
    case 'spatial-place': {
      if (!ex.scene) problems.push('Scena spaziale assente')
      else if (!ex.scene.zones.some((z) => z.id === ex.scene!.correctZone)) {
        problems.push('Zona corretta non presente nella scena')
      }
      break
    }
    case 'open-recall':
    case 'open-describe':
      if (!ex.targetConceptId) problems.push('Manca il concetto da recuperare o descrivere')
      if (ex.kind === 'open-describe' && !ex.describe?.length) problems.push('Mappa semantica vuota')
      break
  }

  if (ex.kind === 'choose-image' && ex.correct.length === 1) {
    // Le immagini devono essere tutte distinte, altrimenti non c'è una sola risposta.
    const images = (ex.options ?? []).map((o) => o.image)
    if (new Set(images).size !== images.length) problems.push('Due alternative mostrano la stessa immagine')
  }

  return problems
}

export function validateAll(exercises: Exercise[]): ExerciseIssue[] {
  const issues: ExerciseIssue[] = []
  for (const ex of exercises) {
    for (const p of validateExercise(ex)) issues.push({ exerciseId: ex.id, problem: p })
  }
  return issues
}

/** Un esercizio è valido solo se rispetta tutte le regole. */
export function isValidExercise(ex: Exercise): boolean {
  return validateExercise(ex).length === 0
}
