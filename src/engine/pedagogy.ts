// Modello didattico della sessione.
//
// Il motore di esercizi risponde a "che cosa chiedere"; questo modulo risponde
// a "come condurre l'apprendimento". Ogni sessione segue un ciclo esplicito:
//   aggancio → modellamento (I do) → pratica guidata (we do) → pratica autonoma (you do)
// e si chiude con un compito di transfer fuori dallo schermo.
//
// Le funzioni sono pure: nessun DOM, nessun effetto. Le schermate le usano per
// decidere quanti aiuti mostrare, che cosa dire dopo un errore e che cosa
// proporre domani.

import type { Concept, Level } from './types'
import { RELATION_LABELS } from './types'
import type { Exercise } from './exercise'
import { statusOf, accuracyOf, suggestLevel, DEFAULT_THRESHOLDS, type ConceptStats, type MasteryThresholds } from './adaptive'
import { hashString } from './generator'
import { CATEGORY_BY_ID } from '../data/categories'
import { CONCEPTS, CONCEPT_BY_ID } from '../data/lexicon'

export type SessionPhase = 'aggancio' | 'modellamento' | 'pratica-guidata' | 'pratica-autonoma'

export interface Scaffolds {
  /** L'indizio è disponibile e viene proposto dopo il primo errore. */
  cues: boolean
  /** Si può togliere un distrattore per ridurre il carico. */
  eliminateDistractors: boolean
  /** La risposta corretta è mostrata: è una dimostrazione, non una prova. */
  showSolution: boolean
  /** Dopo due tentativi si mostra il modello completo con il ragionamento. */
  fullModelAfterRetry: boolean
}

export interface PhaseInfo {
  id: SessionPhase
  label: string
  /** Che cosa sente il bambino. */
  childCue: string
  /** Perché la fase esiste, in linguaggio per l'adulto. */
  adultCue: string
  scaffolds: Scaffolds
}

export const PHASES: Record<SessionPhase, PhaseInfo> = {
  aggancio: {
    id: 'aggancio',
    label: 'Riscaldamento',
    childCue: 'Cominciamo con una parola che conosci già.',
    adultCue:
      'Attivazione: si parte da un item accessibile per recuperare attenzione e fiducia prima della novità. Serve a osservare come il bambino entra nel compito, non a misurare.',
    scaffolds: { cues: true, eliminateDistractors: false, showSolution: false, fullModelAfterRetry: true },
  },
  modellamento: {
    id: 'modellamento',
    label: 'Guardiamo insieme',
    childCue: 'Prima lo faccio io: guarda come si ragiona. Poi provi tu.',
    adultCue:
      'Esempio svolto (I do): la risposta è visibile e il ragionamento è esplicito. L\'apprendimento per imitazione richiede un modello chiaro prima della prestazione autonoma.',
    scaffolds: { cues: true, eliminateDistractors: false, showSolution: true, fullModelAfterRetry: true },
  },
  'pratica-guidata': {
    id: 'pratica-guidata',
    label: 'Proviamo insieme',
    childCue: 'Ora provi tu. Se serve, posso darti una mano.',
    adultCue:
      'Pratica guidata (we do): gli aiuti sono disponibili e l\'errore porta a un indizio semantico. Qui si costruisce la procedura, non si valuta.',
    scaffolds: { cues: true, eliminateDistractors: true, showSolution: false, fullModelAfterRetry: true },
  },
  'pratica-autonoma': {
    id: 'pratica-autonoma',
    label: 'Provi tu',
    childCue: 'Adesso da solo. Prenditi tutto il tempo che vuoi.',
    adultCue:
      'Pratica autonoma (you do): nessuna riduzione automatica delle alternative, nessun limite di tempo. Gli aiuti restano disponibili su richiesta, ma non vengono imposti: è la fase in cui si osserva l\'autonomia.',
    scaffolds: { cues: false, eliminateDistractors: false, showSolution: false, fullModelAfterRetry: true },
  },
}

export function scaffoldsFor(phase: SessionPhase): Scaffolds {
  return PHASES[phase].scaffolds
}

export interface PlannedExercise {
  exercise: Exercise
  phase: SessionPhase
  position: number
  total: number
}

/**
 * Distribuisce gli esercizi già composti nelle fasi della sessione.
 * Non riordina i contenuti: aggiunge solo l'impalcatura didattica.
 *
 * `startWithModel` serve alle mini-lezioni nate da una scheda parola: la
 * presentazione è già avvenuta, quindi non c'è un riscaldamento ma si parte
 * dalla dimostrazione.
 */
export function planSession(exercises: Exercise[], opts: { startWithModel?: boolean } = {}): PlannedExercise[] {
  const total = exercises.length
  if (!total) return []

  if (opts.startWithModel) {
    const remaining = total - 1
    const guided = Math.max(1, Math.ceil(remaining / 2))
    const phases: SessionPhase[] = ['modellamento']
    for (let i = 0; i < remaining; i++) phases.push(i < guided ? 'pratica-guidata' : 'pratica-autonoma')
    return exercises.map((exercise, position) => ({ exercise, phase: phases[position], position, total }))
  }

  const phases: SessionPhase[] = []
  if (total === 1) {
    phases.push('modellamento')
  } else if (total === 2) {
    phases.push('aggancio', 'modellamento')
  } else {
    const remaining = total - 2
    const guided = Math.max(1, Math.floor(remaining / 2))
    phases.push('aggancio', 'modellamento')
    for (let i = 0; i < remaining; i++) phases.push(i < guided ? 'pratica-guidata' : 'pratica-autonoma')
  }
  return exercises.map((exercise, position) => ({ exercise, phase: phases[position], position, total }))
}

// ————————————————————————————————————————————————————————————————
// Analisi dell'errore: l'errore non è "sbagliato", è un'informazione.
// ————————————————————————————————————————————————————————————————

export type ErrorKind =
  | 'categoria-affine'
  | 'relazione-semantica'
  | 'categoria-diversa'
  | 'selezione-parziale'
  | 'ordine'
  | 'fuori-tema'
  | 'nessuna-risposta'

export interface ErrorAnalysis {
  kind: ErrorKind
  headline: string
  /** Spiegazione contrastiva costruita dai dati reali del lessico. */
  explanation: string
  /** Indizio breve per il nuovo tentativo. */
  cue?: string
  targetLemma?: string
  chosenLemma?: string
}

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function lowerFirst(text: string): string {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text
}

function cueOf(concept: Concept): string | undefined {
  if (concept.functions?.length) return `Serve per: ${concept.functions[0]}.`
  if (concept.features.length) return `${capitalize(concept.features[0])}.`
  return undefined
}

function relationFromTo(from: Concept, to: Concept) {
  const direct = from.relations.find((r) => r.target === to.id)
  if (direct) return { relation: direct, forward: true as const }
  const reverse = to.relations.find((r) => r.target === from.id)
  if (reverse) return { relation: reverse, forward: false as const }
  return null
}

/** Differenza semantica fra due concetti della stessa categoria. */
export function semanticDifference(target: Concept, chosen: Concept): string | undefined {
  const chosenFeatures = chosen.features.join(' ').toLowerCase()
  const feature = target.features.find((f) => !chosenFeatures.includes(f.toLowerCase()))
  if (feature) return `${capitalize(feature)}.`
  if (target.functions?.length && !chosen.functions?.some((f) => f === target.functions![0])) {
    return `Serve per: ${target.functions[0]}.`
  }
  return undefined
}

/** Frase contrastiva: spiega la differenza senza mai dire "hai sbagliato". */
export function contrastSentence(target: Concept, chosen: Concept): string {
  const targetCat = CATEGORY_BY_ID.get(target.category)
  const chosenCat = CATEGORY_BY_ID.get(chosen.category)

  if (chosen.category === target.category && chosenCat) {
    const difference = semanticDifference(target, chosen)
    const base = `Anche «${chosen.lemma}» è ${chosenCat.singular}: sta nello stesso gruppo di «${target.lemma}».`
    return difference
      ? `${base} La differenza è questa: ${lowerFirst(difference)}`
      : `${base} Ma la parola chiesta era «${target.lemma}»: ${lowerFirst(target.definition)}`
  }

  if (targetCat && chosenCat) {
    return `«${chosen.lemma}» è ${chosenCat.singular}, mentre «${target.lemma}» è ${targetCat.singular}: sono due gruppi diversi.`
  }

  return `La parola chiesta era «${target.lemma}»: ${lowerFirst(target.definition)}`
}

function targetOf(exercise: Exercise): Concept | undefined {
  const id = exercise.targetConceptId ?? exercise.correct[0]
  const concept = id ? CONCEPT_BY_ID.get(id) : undefined
  if (concept) return concept
  const first = exercise.conceptIds.find((cid) => CONCEPT_BY_ID.has(cid))
  return first ? CONCEPT_BY_ID.get(first) : undefined
}

function conceptOfOptionId(exercise: Exercise, optionId: string): Concept | undefined {
  const all = [
    ...(exercise.options ?? []),
    ...(exercise.pairs ?? []).flatMap((p) => [p.left, p.right]),
  ]
  const option = all.find((o) => o.id === optionId)
  const conceptId = option?.conceptId ?? optionId.split(':')[0]
  return CONCEPT_BY_ID.get(conceptId)
}

export function analyseSelection(exercise: Exercise, selected: string[]): ErrorAnalysis {
  const target = targetOf(exercise)

  if (exercise.kind === 'multi-select') {
    const missing = exercise.correct.filter((id) => !selected.includes(id))
    const extra = selected.filter((id) => !exercise.correct.includes(id))
    const missingNames = missing.map((id) => conceptOfOptionId(exercise, id)?.lemma ?? id)
    const extraConcept = extra.length ? conceptOfOptionId(exercise, extra[0]) : undefined
    const extraCat = extraConcept ? CATEGORY_BY_ID.get(extraConcept.category) : undefined
    const parts = [`Hai trovato ${selected.filter((id) => exercise.correct.includes(id)).length} elementi su ${exercise.correct.length}.`]
    if (missingNames.length) parts.push(`Manca ancora: ${missingNames.join(', ')}.`)
    if (extraConcept) {
      parts.push(
        `«${extraConcept.lemma}» non fa parte del gruppo${extraCat ? `: è ${extraCat.singular}` : ''}.`,
      )
    }
    return {
      kind: 'selezione-parziale',
      headline: 'Quasi: guardiamo il gruppo intero',
      explanation: parts.join(' '),
      cue: extraCat ? `Il gruppo che cerchiamo: ${target ? target.definition : exercise.prompt}` : undefined,
      targetLemma: target?.lemma,
    }
  }

  if (!selected.length || !target) {
    return {
      kind: 'nessuna-risposta',
      headline: 'Riascoltiamo la consegna',
      explanation: target
        ? `Cerchiamo «${target.lemma}»: ${lowerFirst(target.definition)}`
        : 'Prendiamoci un momento e riascoltiamo la richiesta.',
      cue: target ? cueOf(target) : undefined,
      targetLemma: target?.lemma,
    }
  }

  const chosen = conceptOfOptionId(exercise, selected[0])
  if (!chosen || chosen.id === target.id) {
    return {
      kind: 'fuori-tema',
      headline: 'Guardiamo di nuovo',
      explanation: target
        ? `La parola in gioco è «${target.lemma}»: ${lowerFirst(target.definition)}`
        : 'Riguardiamo le alternative con calma.',
      cue: target ? cueOf(target) : undefined,
      targetLemma: target?.lemma,
    }
  }

  // Prima la confusione dentro la stessa categoria: è l'errore più informativo
  // per il lessico. Solo se i gruppi sono diversi si nomina la relazione, che
  // altrimenti spiegherebbe il legame invece della differenza.
  if (chosen.category === target.category) {
    return {
      kind: 'categoria-affine',
      headline: 'Stesso gruppo, parola diversa',
      explanation: contrastSentence(target, chosen),
      cue: cueOf(target),
      targetLemma: target.lemma,
      chosenLemma: chosen.lemma,
    }
  }

  const relation = relationFromTo(target, chosen)
  if (relation) {
    const [subject, object] = relation.forward ? [chosen, target] : [target, chosen]
    return {
      kind: 'relazione-semantica',
      headline: 'Sono collegati, ma non sono la stessa cosa',
      explanation: `«${chosen.lemma}» e «${target.lemma}» sono collegati: «${subject.lemma}» ${RELATION_LABELS[
        relation.relation.type
      ].toLowerCase()} «${object.lemma}». Però la parola chiesta era «${target.lemma}».`,
      cue: target.definition,
      targetLemma: target.lemma,
      chosenLemma: chosen.lemma,
    }
  }

  return {
    kind: 'categoria-diversa',
    headline: 'Due gruppi diversi',
    explanation: contrastSentence(target, chosen),
    cue: cueOf(target),
    targetLemma: target.lemma,
    chosenLemma: chosen.lemma,
  }
}

/** Errore nella scelta della compagna di una coppia. */
export function analysePair(exercise: Exercise, leftId: string, rightId: string): ErrorAnalysis {
  const pairs = exercise.pairs ?? []
  const pair = pairs.find((p) => p.left.id === leftId)
  const expected = pair ? pairs.find((p) => p.right.id === pair.right.id)?.right : undefined
  const chosen = conceptOfOptionId(exercise, rightId)
  const left = conceptOfOptionId(exercise, leftId)
  const expectedConcept = expected?.conceptId ? CONCEPT_BY_ID.get(expected.conceptId) : undefined
  const linked = left && chosen ? relationFromTo(left, chosen) : null

  return {
    kind: 'relazione-semantica',
    headline: 'Guardiamo il legame',
    explanation: [
      linked
        ? `«${left!.lemma}» e «${chosen!.lemma}» sono collegati, ma in un altro modo.`
        : `«${left?.lemma ?? 'Questo elemento'}» non va con «${chosen?.lemma ?? 'questo'}».`,
      expectedConcept ? `La compagna giusta è «${expectedConcept.lemma}»: ${lowerFirst(expectedConcept.definition)}` : '',
    ]
      .filter(Boolean)
      .join(' '),
    cue: left?.functions?.length ? `«${left.lemma}» serve per: ${left.functions[0]}.` : undefined,
    targetLemma: left?.lemma,
  }
}

/** Errore di collocazione in un contenitore. */
export function analyseCategorize(
  exercise: Exercise,
  placement: Record<string, string>,
  options: { id: string; label?: string }[],
): ErrorAnalysis {
  const bins = exercise.bins ?? []
  const misplaced = Object.entries(placement).find(([itemId, binId]) => {
    const bin = bins.find((b) => b.id === binId)
    return bin ? !bin.accepts.includes(itemId) : true
  })
  if (!misplaced) {
    return {
      kind: 'nessuna-risposta',
      headline: 'Controlliamo i contenitori',
      explanation: 'Riguardiamo un elemento per volta: a quale gruppo appartiene davvero?',
    }
  }
  const [itemId, binId] = misplaced
  const bin = bins.find((b) => b.id === binId)
  const correctBin = bins.find((b) => b.id !== binId && b.accepts.includes(itemId))
  const concept = conceptOfOptionId(exercise, itemId)
  const option = options.find((o) => o.id === itemId)
  const cat = concept ? CATEGORY_BY_ID.get(concept.category) : undefined
  const name = concept?.lemma ?? option?.label ?? 'Un elemento'
  return {
    kind: 'categoria-diversa',
    headline: 'Un elemento è nel gruppo sbagliato',
    explanation: [
      cat
        ? `«${name}» non va in «${bin?.label ?? 'questo gruppo'}»: è ${cat.singular}.`
        : `«${name}» non appartiene a «${bin?.label ?? 'questo gruppo'}».`,
      correctBin ? `Il suo gruppo è «${correctBin.label}».` : '',
    ]
      .filter(Boolean)
      .join(' '),
    cue: correctBin
      ? `Guarda gli elementi già presenti in «${correctBin.label}»: che cosa hanno in comune?`
      : cat
        ? `Pensa a che cosa hanno in comune le cose di «${cat.label}».`
        : undefined,
    targetLemma: concept?.lemma,
  }
}

/** Errore nell'ordine di una sequenza o di una frase. */
export function analyseOrder(exercise: Exercise, order: string[]): ErrorAnalysis {
  const expected = exercise.sequence ?? exercise.sentence?.correctOrder ?? []
  const index = expected.findIndex((id, i) => order[i] !== id)
  const tokens = [...(exercise.options ?? []), ...(exercise.sentence?.tokens ?? [])]
  const labelOf = (id?: string) => {
    if (!id) return ''
    const concept = conceptOfOptionId(exercise, id)
    if (concept) return concept.forms?.[0] ?? concept.lemma
    return tokens.find((t) => t.id === id)?.label ?? id
  }
  const expectedLabel = labelOf(expected[index >= 0 ? index : 0])
  const actualLabel = labelOf(order[index >= 0 ? index : 0])
  return {
    kind: 'ordine',
    headline: 'Riguardiamo l\'ordine',
    explanation:
      expectedLabel && actualLabel && expectedLabel !== actualLabel
        ? `In questa posizione viene «${expectedLabel}», non «${actualLabel}». Pensiamo a che cosa succede prima.`
        : 'Pensiamo alla successione: che cosa viene prima, che cosa dopo.',
    cue: exercise.explanation,
  }
}

// ————————————————————————————————————————————————————————————————
// Esempio svolto
// ————————————————————————————————————————————————————————————————

export interface WorkedExample {
  title: string
  answer?: string
  steps: string[]
}

/** Modello esplicito: il ragionamento che l'adulto verbalizza (I do). */
export function workedExample(exercise: Exercise): WorkedExample {
  const target = targetOf(exercise)
  const steps: string[] = [`Leggo la consegna: «${exercise.prompt}»`]

  if (target) {
    steps.push(`Cerco «${target.lemma}»: ${lowerFirst(target.definition)}`)
    if (exercise.options?.length) {
      steps.push(`Guardo le alternative una per una e le confronto con quello che so di «${target.lemma}».`)
    }
    const reason = target.functions?.length
      ? `perché serve per ${target.functions[0]}`
      : target.features.length
        ? `perché ${target.features[0]}`
        : `perché corrisponde alla definizione`
    steps.push(`Scelgo «${target.lemma}» ${reason}.`)
  } else {
    steps.push('Guardo gli elementi e cerco il legame che li unisce.')
    steps.push(exercise.explanation ?? 'Controllo la soluzione e la racconto con parole mie.')
  }

  steps.push('Se sbaglio non è un problema: posso riprovare con un aiuto.')

  return { title: 'Guarda come si fa', answer: target?.lemma, steps }
}

// ————————————————————————————————————————————————————————————————
// Transfer e prossimo passo
// ————————————————————————————————————————————————————————————————

export interface TransferTask {
  title: string
  tasks: string[]
}

/** Compiti brevi da svolgere senza dispositivo, derivati dal concetto. */
export function transferTask(conceptIds: string[], limit = 3): TransferTask {
  const tasks: string[] = []
  const seen = new Set<string>()

  for (const id of conceptIds) {
    const concept = CONCEPT_BY_ID.get(id)
    if (!concept) continue

    const withTarget = concept.relations.find((r) => r.type === 'used-with')
    const partner = withTarget ? CONCEPT_BY_ID.get(withTarget.target) : undefined
    if (partner) {
      const text = `Prendi «${concept.lemma}» e «${partner.lemma}» e usali insieme in un gioco o in una routine.`
      if (!seen.has(text)) {
        seen.add(text)
        tasks.push(text)
      }
    }

    if (concept.functions?.length) {
      const text = `Chiedi a un adulto: «A che cosa serve ${concept.lemma}?». Poi cercalo davvero in casa o in classe.`
      if (!seen.has(text)) {
        seen.add(text)
        tasks.push(text)
      }
    }

    const cat = CATEGORY_BY_ID.get(concept.category)
    if (cat && cat.kind === 'taxonomic') {
      const text = `Trova altri due elementi del gruppo «${cat.label}» e nominali insieme a un adulto.`
      if (!seen.has(text)) {
        seen.add(text)
        tasks.push(text)
      }
    }

    if (concept.contexts?.length) {
      const text = `Racconta un momento in cui hai visto «${concept.lemma}» ${concept.contexts[0]}.`
      if (!seen.has(text)) {
        seen.add(text)
        tasks.push(text)
      }
    }

    if (tasks.length >= limit) break
  }

  if (!tasks.length) tasks.push('Scegli una parola della sessione e cercala nel mondo intorno a te.')
  return { title: 'Porta le parole fuori dallo schermo', tasks: tasks.slice(0, limit) }
}

export type NextStepAction = 'riprendere' | 'consolidare' | 'estendere' | 'iniziare'

export interface NextStep {
  action: NextStepAction
  title: string
  why: string
  conceptIds: string[]
  moduleIds: string[]
  level: Level
  mode: 'nuovi' | 'consolidamento' | 'ripasso' | 'misto'
}

/**
 * Il prossimo passo didattico, derivato dai dati del bambino.
 * Non è un giudizio: è una proposta con una ragione esplicita.
 */
export function nextStepRecommendation(
  stats: ConceptStats[],
  thresholds: MasteryThresholds = DEFAULT_THRESHOLDS,
): NextStep | null {
  const seen = stats.filter((s) => s.exposures > 0)
  if (!seen.length) return null

  const relevant = new Set(stats.map((s) => s.conceptId))
  const moduleIdsOf = (list: ConceptStats[]) =>
    [...new Set(list.flatMap((s) => s.modules))].filter(Boolean).slice(0, 2)

  const struggling = seen.filter((s) => statusOf(s, thresholds) === 'da-ripassare')
  if (struggling.length) {
    const ids = struggling.slice(0, 6).map((s) => s.conceptId)
    const modules = moduleIdsOf(struggling)
    return {
      action: 'riprendere',
      title: 'Riprendiamo le parole in difficoltà',
      why: `${ids.length === 1 ? 'Una parola ha' : `${ids.length} parole hanno`} avuto un errore recente: un breve ripasso ravvicinato è più utile di un esercizio nuovo.`,
      conceptIds: ids,
      moduleIds: modules.length ? modules : ['m1', 'm2', 'm5'],
      level: 2,
      mode: 'ripasso',
    }
  }

  const growing = seen.filter((s) => statusOf(s, thresholds) === 'in-consolidamento')
  if (growing.length) {
    const ids = growing.slice(0, 6).map((s) => s.conceptId)
    const modules = moduleIdsOf(growing)
    return {
      action: 'consolidare',
      title: 'Consolidiamo con un\'attività diversa',
      why: 'La competenza c\'è, ma non è ancora stabile: cambiare tipo di attività aiuta a generalizzare.',
      conceptIds: ids,
      moduleIds: modules.length ? modules : ['m1', 'm2', 'm14'],
      level: growing[0] ? suggestLevel(growing[0], 2) : 2,
      mode: 'consolidamento',
    }
  }

  const strong = seen.filter((s) => statusOf(s, thresholds) === 'consolidato' && s.streak >= 3)
  if (strong.length) {
    const ids = strong.slice(0, 5).map((s) => s.conceptId)
    const modules = moduleIdsOf(strong)
    const base = strong[0] ? suggestLevel(strong[0], 3) : 3
    return {
      action: 'estendere',
      title: 'Alziamo un po\' il livello',
      why: 'Queste parole sono stabili in contesti diversi: si può chiedere qualcosa di più articolato.',
      conceptIds: ids,
      moduleIds: modules.length ? modules : ['m2', 'm19', 'm14'],
      level: Math.min(6, base + 1) as Level,
      mode: 'misto',
    }
  }

  const learning = seen.filter((s) => statusOf(s, thresholds) === 'in-apprendimento')
  if (learning.length) {
    const ids = learning.slice(0, 6).map((s) => s.conceptId)
    const modules = moduleIdsOf(learning)
    const first = learning[0]
    return {
      action: 'consolidare',
      title: 'Un altro giro sulle stesse parole',
      why: `La comprensione è a ${Math.round(accuracyOf(first ?? learning[0]) * 100)}%: ancora una sessione sugli stessi concetti, poi si allarga.`,
      conceptIds: ids,
      moduleIds: modules.length ? modules : ['m1', 'm5'],
      level: first ? suggestLevel(first, 2) : 2,
      mode: 'consolidamento',
    }
  }

  return {
    action: 'iniziare',
    title: 'Cerchiamo parole nuove',
    why: 'Le parole incontrate sono stabili: è il momento di allargare il vocabolario.',
    conceptIds: [...relevant].slice(0, 6),
    moduleIds: ['m1', 'm2', 'm5'],
    level: 2,
    mode: 'nuovi',
  }
}

// ————————————————————————————————————————————————————————————————
// Scheda parola: analisi delle caratteristiche semantiche
// ————————————————————————————————————————————————————————————————

export interface SemanticCardRow {
  label: string
  value: string
}

/**
 * Griglia di analisi semantica (categoria, funzione, parti, luogo, uso, esempio).
 * È una scheda per imparare, non una verifica: si legge, si ascolta, si commenta.
 */
export function semanticCard(concept: Concept): SemanticCardRow[] {
  const cat = CATEGORY_BY_ID.get(concept.category)
  const rows: SemanticCardRow[] = []
  const names = (type: 'located-in' | 'used-with' | 'part-of', max: number) =>
    concept.relations
      .filter((r) => r.type === type)
      .map((r) => CONCEPT_BY_ID.get(r.target)?.lemma)
      .filter((v): v is string => Boolean(v))
      .slice(0, max)
      .join(', ')

  if (cat) rows.push({ label: 'È un tipo di', value: cat.label })
  if (concept.functions?.length) rows.push({ label: 'A che cosa serve', value: concept.functions[0] })
  if (concept.features.length) rows.push({ label: 'Com\'è fatto', value: concept.features.slice(0, 3).join(' · ') })
  const place = names('located-in', 2)
  if (place) rows.push({ label: 'Dove si trova', value: place })
  const together = names('used-with', 3)
  if (together) rows.push({ label: 'Si usa con', value: together })
  if (concept.properties?.materiale) rows.push({ label: 'Di che cosa è fatto', value: concept.properties.materiale })
  if (concept.examples.length) rows.push({ label: 'Un esempio', value: concept.examples[0] })
  return rows.slice(0, 6)
}

/** Parola del giorno: stabile nella giornata, diversa per profilo. */
export function conceptOfTheDay(profileId: string, date = new Date(), pool: Concept[] = CONCEPTS): Concept | undefined {
  const usable = pool.filter((c) => Boolean(c.image?.pictogram))
  if (!usable.length) return undefined
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  const index = hashString(`${profileId}:${day}`) % usable.length
  return usable[index]
}

/** Riepilogo didattico di una sessione: quante parole nuove, quante da riprendere. */
export function sessionDidacticSummary(conceptIds: string[], stats: ConceptStats[]) {
  const map = new Map(stats.map((s) => [s.conceptId, s]))
  let fresh = 0
  let review = 0
  for (const id of new Set(conceptIds)) {
    const s = map.get(id)
    if (!s || s.exposures === 0) fresh++
    else if (statusOf(s) === 'da-ripassare') review++
  }
  return { fresh, review, total: new Set(conceptIds).size }
}
