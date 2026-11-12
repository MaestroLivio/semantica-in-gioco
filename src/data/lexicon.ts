import type { Category, Concept, Relation, RelationType } from '../engine/types'
import { CONCEPTS_NATURA } from './concepts-natura'
import { CONCEPTS_VITA } from './concepts-vita'
import { CONCEPTS_MONDO } from './concepts-mondo'
import { CONCEPTS_LINGUA } from './concepts-lingua'
import { CATEGORY_BY_ID } from './categories'
import stimuli from './stimuli.json'

type StimulusEntry = { pictogram?: number; alts?: number[] }
const STIMULI = stimuli as Record<string, StimulusEntry>

// I pittogrammi ARASAAC sono di Sergio Palao (Governo di Aragona), CC BY-NC-SA 4.0.
// Ogni immagine è scaricata localmente così l'app funziona offline.
// Formato WebP (q78): stessa resa dei PNG originali con circa un ventesimo del
// peso, requisito per la PWA installabile e per la versione web.
export function pictogramUrl(id: number): string {
  return `${import.meta.env?.BASE_URL ?? '/'}pictograms/${id}.webp`
}

const RAW_CONCEPTS: Concept[] = [
  ...CONCEPTS_NATURA,
  ...CONCEPTS_VITA,
  ...CONCEPTS_MONDO,
  ...CONCEPTS_LINGUA,
]

export const CONCEPTS: Concept[] = RAW_CONCEPTS.map((concept) => {
  const entry = STIMULI[concept.id]
  return {
    ...concept,
    license: 'ARASAAC CC BY-NC-SA 4.0',
    image: entry?.pictogram ? { pictogram: entry.pictogram, alts: entry.alts ?? [] } : concept.image,
  }
})

export const CONCEPT_BY_ID = new Map<string, Concept>(CONCEPTS.map((c) => [c.id, c]))

export function getConcept(id: string): Concept | undefined {
  return CONCEPT_BY_ID.get(id)
}

export function requireConcept(id: string): Concept {
  const c = CONCEPT_BY_ID.get(id)
  if (!c) throw new Error(`Concetto sconosciuto: ${id}`)
  return c
}

export function conceptsOfCategory(categoryId: string): Concept[] {
  return CONCEPTS.filter((c) => c.category === categoryId)
}

export function byPos(pos: Concept['pos']): Concept[] {
  return CONCEPTS.filter((c) => c.pos === pos)
}

export function isCategoryId(id: string): boolean {
  return CATEGORY_BY_ID.has(id)
}

/** Concetti collegati a `id` con una relazione di un tipo specifico. */
export function relatedConcepts(id: string, type: RelationType): Concept[] {
  const concept = CONCEPT_BY_ID.get(id)
  if (!concept) return []
  return concept.relations
    .filter((r) => r.type === type)
    .map((r) => CONCEPT_BY_ID.get(r.target))
    .filter((c): c is Concept => Boolean(c))
}

export function relationsOf(id: string): Relation[] {
  return CONCEPT_BY_ID.get(id)?.relations ?? []
}

/** Concetti che hanno una relazione inversa esplicita verso `id`. */
export function inverseRelation(id: string, type: RelationType): Concept[] {
  return CONCEPTS.filter((c) => c.relations.some((r) => r.type === type && r.target === id))
}

export function categoriesOfConcept(concept: Concept): Category[] {
  const own = CATEGORY_BY_ID.get(concept.category)
  return own ? [own] : []
}

export function categoryLabel(concept: Concept): string {
  return CATEGORY_BY_ID.get(concept.category)?.label ?? concept.category
}

export function categorySingular(concept: Concept): string {
  return CATEGORY_BY_ID.get(concept.category)?.singular ?? 'un elemento'
}

/** Prima rappresentazione disponibile: il pittogramma principale. */
export function primaryImage(concept: Concept): string | undefined {
  if (!concept.image?.pictogram) return undefined
  return pictogramUrl(concept.image.pictogram)
}

/**
 * Rappresentazioni alternative dello stesso concetto, per la generalizzazione.
 * Include il principale in prima posizione.
 */
export function representations(concept: Concept): string[] {
  const ids = [
    ...(concept.image?.pictogram ? [concept.image.pictogram] : []),
    ...(concept.image?.alts ?? []),
  ]
  return ids.map(pictogramUrl)
}

export function conceptWithImage(): Concept[] {
  return CONCEPTS.filter((c) => Boolean(c.image?.pictogram))
}

/** Ricerca testuale semplice (lemma, definizione, sinonimi, forme). */
export function searchConcepts(query: string): Concept[] {
  const q = query.trim().toLowerCase()
  if (!q) return CONCEPTS
  return CONCEPTS.filter((c) =>
    [c.lemma, c.definition, ...(c.synonyms ?? []), ...(c.forms ?? [])]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
}

export interface LexiconIssue {
  kind: 'missing-relation-target' | 'missing-image' | 'duplicate-id' | 'missing-category' | 'asymmetric-relation' | 'empty-features'
  conceptId: string
  detail: string
}

/**
 * Validazione dell'archivio. Usata dai test e dal pannello adulto:
 * le relazioni devono puntare a concetti o categorie esistenti e ogni
 * concetto deve avere uno stimolo visivo.
 */
export function validateLexicon(concepts: Concept[] = CONCEPTS): LexiconIssue[] {
  const issues: LexiconIssue[] = []
  const seen = new Set<string>()
  for (const concept of concepts) {
    if (seen.has(concept.id)) {
      issues.push({ kind: 'duplicate-id', conceptId: concept.id, detail: `ID duplicato: ${concept.id}` })
    }
    seen.add(concept.id)
    if (!CATEGORY_BY_ID.has(concept.category)) {
      issues.push({ kind: 'missing-category', conceptId: concept.id, detail: `Categoria assente: ${concept.category}` })
    }
    if (!concept.image?.pictogram && !concept.custom) {
      issues.push({ kind: 'missing-image', conceptId: concept.id, detail: 'Nessun pittogramma associato' })
    }
    if (!concept.features.length && concept.pos !== 'spazio' && concept.pos !== 'tempo') {
      issues.push({ kind: 'empty-features', conceptId: concept.id, detail: 'Nessuna caratteristica semantica' })
    }
    for (const r of concept.relations) {
      if (!CONCEPT_BY_ID.has(r.target) && !isCategoryId(r.target)) {
        issues.push({
          kind: 'missing-relation-target',
          conceptId: concept.id,
          detail: `"${concept.id}" ${r.type} → "${r.target}" inesistente`,
        })
      }
    }
  }
  return issues
}

/** Relazioni reciproche dichiarate solo da un lato: informazione utile per la revisione. */
export function asymmetricRelationIds(): string[] {
  const out: string[] = []
  const pairs: [RelationType, RelationType][] = [
    ['has-part', 'part-of'],
    ['part-of', 'has-part'],
    ['used-with', 'used-with'],
  ]
  for (const c of CONCEPTS) {
    for (const r of c.relations) {
      const target = CONCEPT_BY_ID.get(r.target)
      if (!target) continue
      const inverse = pairs.find(([a]) => a === r.type)?.[1]
      if (!inverse) continue
      const hasInverse = target.relations.some((tr) => tr.target === c.id)
      if (!hasInverse) out.push(`${c.id} ${r.type} ${r.target}`)
    }
  }
  return out
}
