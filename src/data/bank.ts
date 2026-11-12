import type { Exercise } from '../engine/exercise'
import { validateExercise, type ExerciseIssue } from '../engine/validate'
import { buildBankPart1 } from './bank-core'
import { buildBankPart2 } from './bank-advanced'

/**
 * Banca curata: item definiti a mano, con distrattori selezionati da regole
 * semantiche e verificati dalla validazione. Gli item non validi vengono
 * esclusi e segnalati (mai mostrati al bambino).
 */
function assemble(): { valid: Exercise[]; rejected: ExerciseIssue[] } {
  const all = [...buildBankPart1(), ...buildBankPart2()]
  const valid: Exercise[] = []
  const rejected: ExerciseIssue[] = []
  const seen = new Set<string>()
  for (const ex of all) {
    const problems = validateExercise(ex)
    if (problems.length) {
      for (const p of problems) rejected.push({ exerciseId: ex.id, problem: p })
      continue
    }
    if (seen.has(ex.id)) {
      rejected.push({ exerciseId: ex.id, problem: 'ID duplicato nella banca' })
      continue
    }
    seen.add(ex.id)
    valid.push(ex)
  }
  return { valid, rejected }
}

const assembled = assemble()

export const EXERCISE_BANK: Exercise[] = assembled.valid
export const REJECTED_EXERCISES: ExerciseIssue[] = assembled.rejected

export function bankForModule(moduleId: string): Exercise[] {
  return EXERCISE_BANK.filter((ex) => ex.moduleId === moduleId)
}

export function bankStats(): { total: number; byModule: Record<string, number> } {
  const byModule: Record<string, number> = {}
  for (const ex of EXERCISE_BANK) byModule[ex.moduleId] = (byModule[ex.moduleId] ?? 0) + 1
  return { total: EXERCISE_BANK.length, byModule }
}
