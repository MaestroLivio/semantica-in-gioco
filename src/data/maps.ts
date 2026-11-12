import type { Level, RelationType, SemanticMap, SemanticMapNode } from '../engine/types'
import { CONCEPTS, CONCEPT_BY_ID, requireConcept } from './lexicon'

/**
 * 30 mappe semantiche pronte, costruite dall'archivio: ogni arco ha un tipo
 * esplicito ("è un tipo di", "serve per", "può trovarsi in"…), quindi la mappa
 * non mostra semplici associazioni indifferenziate.
 */
const CENTERS: [string, Level][] = [
  ['cane', 2],
  ['gatto', 2],
  ['pesce', 3],
  ['uccello', 2],
  ['mucca', 3],
  ['mela', 2],
  ['banana', 2],
  ['carota', 2],
  ['pane', 3],
  ['torta', 3],
  ['sedia', 2],
  ['tavolo', 2],
  ['letto', 2],
  ['casa', 3],
  ['cucina', 3],
  ['scuola', 3],
  ['supermercato', 4],
  ['automobile', 3],
  ['bicicletta', 3],
  ['medico', 4],
  ['insegnante', 4],
  ['albero', 3],
  ['fiore', 3],
  ['sole', 3],
  ['pioggia', 4],
  ['acqua', 3],
  ['scarpe', 3],
  ['cappotto', 3],
  ['palla', 2],
  ['cucchiaio', 3],
]

function nodesFor(centerId: string): SemanticMapNode[] {
  const center = requireConcept(centerId)
  const nodes: SemanticMapNode[] = []
  const seen = new Set<string>([centerId])

  const push = (rel: RelationType, target: string, note?: string) => {
    if (seen.has(target)) return
    if (!CONCEPT_BY_ID.has(target)) return
    seen.add(target)
    nodes.push({ conceptId: target, relation: rel, note })
  }

  // Relazione categoriale esplicita: "è un tipo di".
  const categoryLabel = center.category
  const categoryConcept = CONCEPTS.find((c) => c.id === categoryLabel)
  if (categoryConcept) push('is-a', categoryConcept.id)

  for (const r of center.relations) {
    if (r.target === centerId) continue
    if (r.type === 'similar-to' && nodes.filter((n) => n.relation === 'similar-to').length >= 2) continue
    push(r.type, r.target, r.note)
  }

  // Se la mappa è troppo povera, aggiunge concetti della stessa categoria
  // con la relazione esplicita "è un tipo di" (sono della stessa famiglia).
  if (nodes.length < 4) {
    const sameCat = CONCEPTS.filter((c) => c.category === center.category && !seen.has(c.id)).slice(0, 4 - nodes.length)
    for (const c of sameCat) push('similar-to', c.id, 'Appartiene allo stesso gruppo.')
  }

  return nodes
}

export const SEMANTIC_MAPS: SemanticMap[] = CENTERS.map(([id, level]) => {
  const center = requireConcept(id)
  return {
    id: `map-${id}`,
    central: id,
    title: `La rete di ${center.lemma}`,
    level,
    nodes: nodesFor(id),
  }
})

export const MAP_BY_ID = new Map(SEMANTIC_MAPS.map((m) => [m.id, m]))

export function mapForConcept(id: string): SemanticMap | undefined {
  return SEMANTIC_MAPS.find((m) => m.central === id)
}

/** Categorie presenti nell'archivio, con etichetta e numero di concetti. */
export function mapsByLevel(level: Level): SemanticMap[] {
  return SEMANTIC_MAPS.filter((m) => m.level <= level)
}
