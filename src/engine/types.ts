// Tipi condivisi dell'architettura. Il lessico è un grafo tipizzato:
// le relazioni hanno un significato esplicito e non sono intercambiabili.

export type Pos = 'nome' | 'verbo' | 'aggettivo' | 'spazio' | 'tempo' | 'astratto'
export type Level = 1 | 2 | 3 | 4 | 5 | 6

export type PropertyDim =
  | 'colore'
  | 'forma'
  | 'dimensione'
  | 'materiale'
  | 'consistenza'
  | 'temperatura'
  | 'peso'
  | 'sapore'
  | 'odore'
  | 'rumore'
  | 'movimento'
  | 'funzione'

export const PROPERTY_LABELS: Record<PropertyDim, string> = {
  colore: 'Colore',
  forma: 'Forma',
  dimensione: 'Dimensione',
  materiale: 'Materiale',
  consistenza: 'Consistenza',
  temperatura: 'Temperatura',
  peso: 'Peso',
  sapore: 'Sapore',
  odore: 'Odore',
  rumore: 'Rumore',
  movimento: 'Movimento',
  funzione: 'Funzione',
}

/** Relazioni semantiche tipizzate. Ogni etichetta è quella mostrata al bambino/adulto. */
export type RelationType =
  | 'is-a' // è un tipo di
  | 'part-of' // è parte di
  | 'has-part' // ha come parte
  | 'used-for' // serve per
  | 'tool-for' // si usa per
  | 'located-in' // può trovarsi in
  | 'used-with' // si usa con
  | 'similar-to' // è simile a
  | 'eats' // mangia
  | 'lives-in' // vive in
  | 'made-of' // è fatto di
  | 'professional-uses' // il professionista usa
  | 'has-property' // ha la caratteristica
  | 'opposite-of' // è il contrario di
  | 'action-of' // azione collegata

export const RELATION_LABELS: Record<RelationType, string> = {
  'is-a': 'è un tipo di',
  'part-of': 'è parte di',
  'has-part': 'ha come parte',
  'used-for': 'serve per',
  'tool-for': 'si usa per',
  'located-in': 'può trovarsi in',
  'used-with': 'si usa con',
  'similar-to': 'è simile a',
  eats: 'mangia',
  'lives-in': 'vive in',
  'made-of': 'è fatto di',
  'professional-uses': 'usa',
  'has-property': 'ha la caratteristica',
  'opposite-of': 'è il contrario di',
  'action-of': 'azione collegata',
}

export interface Relation {
  type: RelationType
  target: string
  /** Sfumatura o nota didattica (es. "solo quando è accesa"). */
  note?: string
}

export interface Category {
  /** Traduzioni inglesi facoltative: presenti solo se già scritte e revisionate. */
  labelEn?: string
  singularEn?: string
  definitionEn?: string
  id: string
  label: string
  singular: string
  definition: string
  /** tassonomica = "è un tipo di"; tematica = raggruppa per contesto d'uso. */
  kind: 'taxonomic' | 'thematic'
  color: string
  parent?: string
}

export interface Concept {
  id: string
  lemma: string
  plural?: string
  pos: Pos
  category: string
  subcategory?: string
  definition: string
  features: string[]
  functions?: string[]
  contexts?: string[]
  properties?: Partial<Record<PropertyDim, string>>
  relations: Relation[]
  synonyms?: string[]
  antonyms?: string[]
  examples: string[]
  difficulty: Level
  /** 1 = molto raro per un bambino, 5 = esperienza quotidiana. */
  familiarity: 1 | 2 | 3 | 4 | 5
  /** 1 = poco utile a comunicare, 5 = molto utile. */
  communicativeUse: 1 | 2 | 3 | 4 | 5
  ambiguity?: string
  forms?: string[]
  /** Concetti personalizzati creati dall'adulto (foto dell'ambiente reale). */
  custom?: boolean
  image?: { pictogram?: number; alts?: number[] }
  audioRef?: string
  license?: string
}

export interface StoryPanel {
  text: string
  conceptIds: string[]
  /** Domanda esplicita o inferenziale sul pannello. */
  question?: string
  answer?: string
}

export interface StoryQuestionOption {
  label: string
  correct: boolean
  /** Concetti illustrati che sostengono l'opzione, per la comprensione visiva. */
  conceptIds?: string[]
}

export interface StoryQuestion {
  text: string
  kind: 'explicit' | 'inferential' | 'sequence' | 'vocabulary'
  options: StoryQuestionOption[]
  explanation?: string
}

export interface Story {
  id: string
  title: string
  level: Level
  ageBand: string
  panels: StoryPanel[]
  keyWords: string[]
  questions: StoryQuestion[]
  /** Parole da riutilizzare in produzione dopo la storia. */
  reuse: string[]
  license?: string
}

export interface SemanticMapNode {
  conceptId: string
  relation: RelationType
  note?: string
}

export interface SemanticMap {
  id: string
  central: string
  title: string
  level: Level
  nodes: SemanticMapNode[]
}

export interface PathStep {
  moduleId: string
  level: Level
  note: string
}

export interface LearningPath {
  id: string
  title: string
  goal: string
  prerequisites: string[]
  steps: PathStep[]
  observation: string[]
  generalization: string[]
  level: Level
}

export type EnvironmentId = 'casa' | 'supermercato' | 'fattoria' | 'citta' | 'bosco' | 'scuola'

export interface EnvironmentHotspot {
  conceptId: string
  x: number
  y: number
  label?: string
}

export interface EnvironmentMission {
  id: string
  title: string
  goal: string
  moduleId: string
  level: Level
  tasks: string[]
}

export interface Environment {
  id: EnvironmentId
  title: string
  description: string
  words: string[]
  hotspots: EnvironmentHotspot[]
  missions: EnvironmentMission[]
}
