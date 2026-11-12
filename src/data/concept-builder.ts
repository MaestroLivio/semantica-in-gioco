import type { Concept, Level, Pos, Relation, RelationType } from '../engine/types'

export function rel(type: RelationType, target: string, note?: string): Relation {
  return note ? { type, target, note } : { type, target }
}

/** Costruttore compatto: i campi non indicati restano vuoti e vengono completati dai default. */
export function c(
  id: string,
  lemma: string,
  pos: Pos,
  category: string,
  difficulty: Level,
  definition: string,
  extra: Partial<Concept> = {},
): Concept {
  return {
    id,
    lemma,
    pos,
    category,
    difficulty,
    definition,
    features: [],
    relations: [],
    examples: [],
    familiarity: 3,
    communicativeUse: 3,
    ...extra,
  }
}
