import type { Concept, Level, RelationType } from './types'
import { PROPERTY_LABELS, RELATION_LABELS } from './types'
import { CATEGORY_BY_ID } from '../data/categories'
import {
  CONCEPTS,
  CONCEPT_BY_ID,
  conceptWithImage,
  conceptsOfCategory,
  primaryImage,
  categoriesOfConcept,
} from '../data/lexicon'
import type { DescribeSlot, ExBin, ExOption, Exercise, ExPair } from './exercise'
import { alternativesForLevel } from './exercise'

/** PRNG deterministico: gli esercizi generati sono riproducibili e testabili. */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], seed: string): T[] {
  const rnd = mulberry32(hashString(seed))
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function optionFor(concept: Concept, labelMode: 'none' | 'label' = 'none'): ExOption {
  return {
    id: concept.id,
    conceptId: concept.id,
    label: concept.lemma,
    image: primaryImage(concept),
    caption: labelMode === 'label' ? concept.lemma : undefined,
  }
}

function samePos(concept: Concept): Concept[] {
  return CONCEPTS.filter((c) => c.pos === concept.pos && c.id !== concept.id && c.image?.pictogram)
}

/**
 * Sceglie distrattori coerenti. Ai livelli alti privilegia la stessa categoria
 * (distrattori più simili), ai livelli bassi categorie diverse (differenza evidente).
 * Esclude sempre i concetti che sarebbero anch'essi risposte corrette.
 */
export function pickDistractors(
  target: Concept,
  count: number,
  level: Level,
  seed: string,
  opts: { avoid?: string[]; sameCategory?: boolean; pool?: Concept[] } = {},
): Concept[] {
  const avoid = new Set([target.id, ...(opts.avoid ?? [])])
  const preferSame = opts.sameCategory ?? level >= 3
  const candidates = (opts.pool ?? CONCEPTS).filter((c) => !avoid.has(c.id) && c.image?.pictogram)

  const sameCat = candidates.filter((c) => c.category === target.category)
  const otherCat = candidates.filter((c) => c.category !== target.category && c.pos === target.pos)
  const fallback = candidates.filter((c) => c.category !== target.category)

  const ordered = preferSame
    ? [...sameCat, ...samePos(target).filter((c) => c.category !== target.category), ...otherCat, ...fallback]
    : [...otherCat, ...fallback, ...sameCat]

  const unique: Concept[] = []
  const used = new Set<string>()
  for (const c of shuffle(ordered, `${seed}:d`)) {
    if (used.has(c.id)) continue
    used.add(c.id)
    unique.push(c)
    if (unique.length === count) break
  }
  return unique
}

/** Opzioni per una domanda a scelta singola, con la risposta corretta inclusa. */
export function buildChoice(
  target: Concept,
  level: Level,
  seed: string,
  count = alternativesForLevel(level),
  opts: { correctLabels?: string[]; labelMode?: 'none' | 'label' } = {},
): ExOption[] {
  const distractors = pickDistractors(target, Math.max(1, count - 1), level, seed)
  const options = [optionFor(target, opts.labelMode), ...distractors.map((d) => optionFor(d, opts.labelMode))]
  return shuffle(options, `${seed}:o`)
}

export function categoryChoices(target: Concept, count = 3): ExOption[] {
  const cats = [...CATEGORY_BY_ID.values()].map((c) => ({ id: c.id, label: c.label }))
  const wrong = cats.filter((c) => c.id !== target.category)
  const chosen = shuffle(wrong, `${target.id}:cat`).slice(0, Math.max(2, count - 1))
  return shuffle([{ id: target.category, label: CATEGORY_BY_ID.get(target.category)?.label ?? target.category }, ...chosen], `${target.id}:cat2`)
}

export function categoryOf(concept: Concept) {
  return CATEGORY_BY_ID.get(concept.category)
}

/** Caratteristiche tipiche (non universali) da usare negli esercizi sugli attributi. */
export function hasProperty(concept: Concept, dim: keyof typeof PROPERTY_LABELS, value: string): boolean {
  const v = concept.properties?.[dim]
  if (!v) return false
  return v.toLowerCase().includes(value.toLowerCase())
}

/** Tutti i concetti che soddisfano un attributo, per accettare più risposte corrette. */
export function conceptsWithProperty(dim: keyof typeof PROPERTY_LABELS, value: string): Concept[] {
  return CONCEPTS.filter((c) => hasProperty(c, dim, value))
}

/** Coppie oggetto-funzione ricavabili dal grafo ("serve per"). */
export function functionPairs(limit = 40): { concept: Concept; target: Concept }[] {
  const out: { concept: Concept; target: Concept }[] = []
  for (const c of CONCEPTS) {
    for (const r of c.relations) {
      if (r.type !== 'used-for' && r.type !== 'tool-for') continue
      const t = CONCEPT_BY_ID.get(r.target)
      if (t && c.image?.pictogram && t.image?.pictogram) out.push({ concept: c, target: t })
    }
  }
  return out.slice(0, limit)
}

export function thematicPairs(type: RelationType, limit = 40): { concept: Concept; target: Concept }[] {
  const out: { concept: Concept; target: Concept }[] = []
  for (const c of CONCEPTS) {
    for (const r of c.relations) {
      if (r.type !== type) continue
      const t = CONCEPT_BY_ID.get(r.target)
      if (t && c.image?.pictogram && t.image?.pictogram) out.push({ concept: c, target: t })
    }
  }
  return out.slice(0, limit)
}

/** Scala di aiuti per il recupero lessicale, dal più leggero al modello completo. */
export function recallCueLadder(concept: Concept): string[] {
  const category = categoryOf(concept)
  const cues: string[] = []
  const context = concept.contexts?.[0]
  if (context) cues.push(`Si usa ${context}.`)
  const fn = concept.functions?.[0]
  if (fn) cues.push(`Serve per: ${fn}.`)
  if (category) cues.push(`È ${category.singular}.`)
  const feature = concept.features[0]
  if (feature) cues.push(feature.charAt(0).toUpperCase() + feature.slice(1) + '.')
  if (concept.synonyms?.length) cues.push(`Si può dire anche: ${concept.synonyms[0]}.`)
  return cues
}

/** Prima sillaba approssimativa: indizio fonologico opzionale, non una valutazione. */
export function phonologicalCue(concept: Concept): string {
  const word = concept.lemma.toLowerCase()
  const vowels = 'aeiouàèéìòù'
  let idx = -1
  for (let i = 1; i < word.length; i++) {
    if (vowels.includes(word[i])) {
      idx = i
      break
    }
  }
  if (idx <= 0) return word.slice(0, 2) + '…'
  return word.slice(0, idx + (word[idx + 1] && !vowels.includes(word[idx + 1]) ? 1 : 0)) + '…'
}

/** Sei domande della mappa semantica (Modulo 14). */
export function describeSlots(concept: Concept): DescribeSlot[] {
  const slots: DescribeSlot[] = []
  const cat = categoryOf(concept)
  const img = primaryImage(concept)

  slots.push({
    question: 'Che cos\'è?',
    help: 'Tocca l\'immagine che corrisponde alla parola.',
    options: buildChoice(concept, 2, `${concept.id}:what`, 3).map((o) => ({ ...o })),
    correct: [concept.id],
  })

  if (cat) {
    slots.push({
      question: 'A quale categoria appartiene?',
      help: `Scegli il nome del gruppo: ${cat.definition}`,
      options: categoryChoices(concept, 3),
      correct: [cat.id],
    })
  }

  if (concept.features.length) {
    const others = pickDistractors(concept, 2, 4, `${concept.id}:feat`, { sameCategory: true })
    const featOptions: ExOption[] = [
      { id: `${concept.id}:f0`, label: concept.features[0] },
      ...others.map((o, i) => ({
        id: `${o.id}:f${i}`,
        label: o.features[0] ?? o.definition,
      })),
    ]
    slots.push({
      question: 'Com\'è fatto?',
      help: 'Scegli la caratteristica giusta.',
      options: shuffle(featOptions, `${concept.id}:fo`),
      correct: [`${concept.id}:f0`],
    })
  }

  if (concept.functions?.length) {
    const others = pickDistractors(concept, 2, 3, `${concept.id}:fn`, { sameCategory: true }).filter(
      (o) => o.functions?.length,
    )
    const fnOptions: ExOption[] = [
      { id: `${concept.id}:u0`, label: concept.functions[0] },
      ...others.map((o, i) => ({ id: `${o.id}:u${i}`, label: o.functions![0] })),
    ]
    if (fnOptions.length >= 2) {
      slots.push({
        question: 'A cosa serve?',
        help: 'Scegli la funzione giusta.',
        options: shuffle(fnOptions, `${concept.id}:uo`),
        correct: [`${concept.id}:u0`],
      })
    }
  }

  const placeTargets = concept.relations
    .filter((r) => r.type === 'located-in')
    .map((r) => CONCEPT_BY_ID.get(r.target))
    .filter((c): c is Concept => Boolean(c) && Boolean(c?.image?.pictogram))
  if (placeTargets.length) {
    const place = placeTargets[0]
    slots.push({
      question: 'Dove si trova?',
      help: 'Scegli il luogo giusto.',
      options: buildChoice(place, 2, `${concept.id}:where`, 3),
      correct: [place.id],
    })
  }

  const withTargets = concept.relations
    .filter((r) => r.type === 'used-with' || r.type === 'part-of')
    .map((r) => CONCEPT_BY_ID.get(r.target))
    .filter((c): c is Concept => Boolean(c) && Boolean(c?.image?.pictogram))
  if (withTargets.length) {
    const withC = withTargets[0]
    slots.push({
      question: 'Con che cosa si usa? A che cosa assomiglia?',
      help: 'Questa risposta può essere discussa con l\'adulto.',
      options: buildChoice(withC, 2, `${concept.id}:with`, 3),
      correct: [withC.id],
    })
  }

  if (img && slots.length < 6) {
    slots.push({
      question: 'Racconta con le tue parole',
      help: 'Il bambino può rispondere parlando, con un gesto o con la barra CAA. L\'adulto conferma.',
      options: [],
      correct: [],
    })
  }

  return slots
}

/** Opzioni per un esercizio "trova tutti quelli che…". */
export function multiSelectOptions(
  correctConcepts: Concept[],
  distractorPool: Concept[],
  count: number,
  seed: string,
): { options: ExOption[]; correct: string[] } {
  const correct = new Set(correctConcepts.map((c) => c.id))
  const chosenDistractors = shuffle(
    distractorPool.filter((c) => !correct.has(c.id) && c.image?.pictogram),
    `${seed}:m`,
  ).slice(0, count)
  const options = shuffle([...correctConcepts, ...chosenDistractors], `${seed}:mo`).map((c) => optionFor(c))
  return { options, correct: [...correct] }
}

export function pairExercise(
  pairs: { left: Concept; right: Concept }[],
  level: Level,
  seed: string,
  moduleId: string,
): Exercise {
  const exPairs: ExPair[] = pairs.map((p) => ({ left: optionFor(p.left), right: optionFor(p.right) }))
  return {
    id: `${moduleId}-pair-${seed}`,
    moduleId,
    kind: 'pair-match',
    level,
    prompt: 'Unisci ogni immagine alla sua compagna: tocca prima una a sinistra, poi quella collegata a destra.',
    conceptIds: pairs.flatMap((p) => [p.left.id, p.right.id]),
    targetConceptId: pairs[0]?.left.id,
    pairs: exPairs,
    correct: exPairs.map((p) => `${p.left.id}>${p.right.id}`),
    explanation: 'Ogni cosa ha la sua relazione: guarda bene come sono collegate.',
    scoring: 'objective',
    origin: 'generated',
  }
}

export function categorizeExercise(
  bins: { label: string; concepts: Concept[] }[],
  allPool: Concept[],
  level: Level,
  seed: string,
): Exercise | null {
  const items = bins.flatMap((b) => b.concepts)
  if (!items.length) return null
  const exBins: ExBin[] = bins.map((b) => ({
    id: `bin-${hashString(b.label) % 10000}`,
    label: b.label,
    accepts: b.concepts.map((c) => c.id),
  }))
  return {
    id: `m2-cat-${seed}`,
    moduleId: 'm2',
    kind: 'categorize',
    level,
    prompt: 'Metti ogni cosa nel contenitore giusto.',
    conceptIds: items.map((c) => c.id),
    targetConceptId: items[0]?.id,
    options: shuffle(items.map((c) => optionFor(c)), `${seed}:c`),
    bins: exBins,
    correct: items.map((c) => c.id),
    criterion: bins.map((b) => b.label).join(' / '),
    explanation: `Ogni gruppo ha un nome: ${bins.map((b) => b.label).join(', ')}.`,
    scoring: 'objective',
    origin: 'generated',
    alternatives: allPool.length,
  }
}

export function sentenceExercise(
  agent: Concept,
  action: Concept,
  object: Concept,
  level: Level,
  seed: string,
  reversed = false,
): Exercise {
  const subject = reversed ? object : agent
  const obj = reversed ? agent : object
  const tokens: ExOption[] = [
    { id: `t-${subject.id}`, label: subject.lemma, image: primaryImage(subject), conceptId: subject.id },
    { id: `t-${action.id}`, label: action.forms?.[0] ?? action.lemma, image: primaryImage(action), conceptId: action.id },
    { id: `t-${obj.id}`, label: obj.lemma, image: primaryImage(obj), conceptId: obj.id },
  ]
  const order = shuffle(tokens, `${seed}:s`).map((t) => t.id)
  return {
    id: `m12-sentence-${seed}`,
    moduleId: 'm12',
    kind: 'sentence-build',
    level,
    prompt: reversed
      ? `Chi fa l'azione? Componi la frase: ${subject.lemma} ${action.forms?.[0] ?? action.lemma} ${obj.lemma}.`
      : 'Componi la frase nell\'ordine giusto: prima chi fa l\'azione, poi che cosa fa, poi che cosa.',
    conceptIds: [agent.id, action.id, object.id],
    targetConceptId: action.id,
    sentence: { tokens: order.map((id) => tokens.find((t) => t.id === id)!), correctOrder: [...order] },
    correct: [...order],
    explanation: `${subject.lemma[0].toUpperCase() + subject.lemma.slice(1)} ${action.forms?.[0] ?? action.lemma} ${obj.lemma}.`,
    scoring: 'objective',
    origin: 'generated',
  }
}

// Articoli determinativi dei materiali usati nelle scene spaziali. Il prompt
// deve suonare come una consegna vera: "Metti la palla dentro la scatola",
// non "Metti palla dentro scatola".
const ARTICLES: Record<string, string> = {
  scatola: 'la',
  palla: 'la',
  orsetto: "l'",
  bambola: 'la',
  piatto: 'il',
  forchetta: 'la',
  zaino: 'lo',
  cucchiaio: 'il',
  tazza: 'la',
  puzzle: 'il',
  pigiama: 'il',
  bicchiere: 'il',
  gatto: 'il',
  tavolo: 'il',
  letto: 'il',
  sedia: 'la',
}

function withArticle(concept: Concept): string {
  const article = ARTICLES[concept.id]
  if (!article) return concept.lemma
  return article.endsWith("'") ? `${article}${concept.lemma}` : `${article} ${concept.lemma}`
}

function placePhrase(zoneId: string, reference: Concept): string {
  const article = ARTICLES[reference.id] ?? 'la'
  if (zoneId === 'davanti' || zoneId === 'accanto') {
    const base = zoneId === 'davanti' ? 'davanti' : 'accanto'
    if (article === "l'") return `${base} all'${reference.lemma}`
    const contraction = article === 'la' ? 'alla' : article === 'il' ? 'al' : article === 'lo' ? 'allo' : article
    return `${base} ${contraction} ${reference.lemma}`
  }
  return `${zoneId} ${withArticle(reference)}`
}

export function spatialExercise(
  reference: Concept,
  object: Concept,
  zone: { id: string; label: string },
  level: Level,
): Exercise {
  const zones = [
    { id: 'dentro', label: 'dentro', x: 38, y: 30, w: 24, h: 34 },
    { id: 'sopra', label: 'sopra', x: 34, y: 10, w: 32, h: 16 },
    { id: 'sotto', label: 'sotto', x: 36, y: 68, w: 28, h: 16 },
    { id: 'davanti', label: 'davanti', x: 8, y: 44, w: 22, h: 24 },
    { id: 'dietro', label: 'dietro', x: 70, y: 44, w: 22, h: 24 },
    { id: 'accanto', label: 'accanto', x: 66, y: 72, w: 26, h: 20 },
  ]
  return {
    id: `m9-place-${reference.id}-${object.id}-${zone.id}`,
    moduleId: 'm9',
    kind: 'spatial-place',
    level,
    prompt: `Metti ${withArticle(object)} ${placePhrase(zone.id, reference)}.`,
    conceptIds: [reference.id, object.id],
    targetConceptId: object.id,
    scene: { referenceConceptId: reference.id, objectConceptId: object.id, zones, correctZone: zone.id },
    correct: [zone.id],
    explanation: `${object.lemma[0].toUpperCase() + object.lemma.slice(1)} è ${zone.label} ${reference.lemma}.`,
    scoring: 'objective',
    origin: 'generated',
    alternatives: zones.length,
  }
}

/**
 * Mini-lezione su un singolo concetto, usata dalla scheda parola.
 * Tre passaggi: riconoscere l'immagine, scegliere la parola, recuperarla.
 * Non dipende dalla banca: funziona per qualunque concetto illustrato, anche
 * quelli scelti come parola del giorno.
 */
export function conceptLesson(conceptId: string, level: Level = 2): Exercise[] {
  const concept = CONCEPT_BY_ID.get(conceptId)
  if (!concept || !concept.image?.pictogram) return []
  const seed = `lesson:${conceptId}:${level}`
  const images = buildChoice(concept, level, `${seed}:img`, Math.max(2, alternativesForLevel(level)))
  const labels = shuffle(
    [optionFor(concept), ...pickDistractors(concept, 2, level, `${seed}:lab`).map((c) => optionFor(c))],
    `${seed}:labo`,
  ).map((option) => ({ ...option, image: undefined }))

  return [
    {
      id: `lesson-${conceptId}-image`,
      moduleId: 'm1',
      kind: 'choose-image',
      level,
      prompt: `Tocca ${concept.lemma}.`,
      conceptIds: [conceptId],
      targetConceptId: conceptId,
      options: images,
      correct: [conceptId],
      explanation: `${concept.lemma[0].toUpperCase() + concept.lemma.slice(1)}. ${concept.definition}`,
      cue: concept.features[0],
      scoring: 'objective',
      origin: 'generated',
      alternatives: images.length,
    },
    {
      id: `lesson-${conceptId}-label`,
      moduleId: 'm1',
      kind: 'choose-label',
      level,
      prompt: 'Quale parola corrisponde all\'immagine?',
      conceptIds: [conceptId],
      targetConceptId: conceptId,
      options: labels,
      correct: [conceptId],
      explanation: `${concept.lemma}. ${concept.definition}`,
      cue: concept.functions?.[0],
      scoring: 'objective',
      origin: 'generated',
      alternatives: labels.length,
    },
    {
      id: `lesson-${conceptId}-recall`,
      moduleId: 'm15',
      kind: 'open-recall',
      level,
      prompt: 'Come si chiama? Puoi rispondere parlando, con un gesto o con i simboli.',
      conceptIds: [conceptId],
      targetConceptId: conceptId,
      options: buildChoice(concept, level, `${seed}:rec`, 3),
      correct: [],
      cue: concept.definition,
      explanation: `${concept.lemma}. ${concept.definition}`,
      scoring: 'adult',
      origin: 'generated',
    },
  ]
}

/** Categorie disponibili per nome nelle opzioni (usato dal modulo categorie). */
export function categoryOptionsFor(concept: Concept): ExOption[] {
  return categoriesOfConcept(concept).map((c) => ({ id: c.id, label: c.label }))
}

export function relationLabel(type: RelationType): string {
  return RELATION_LABELS[type]
}

/** Pool di immagini per i distrattori dei moduli che accettano più risposte. */
export function imagePool(): Concept[] {
  return conceptWithImage()
}

export function sameCategory(catId: string, exceptId?: string): Concept[] {
  return conceptsOfCategory(catId).filter((c) => c.id !== exceptId)
}
