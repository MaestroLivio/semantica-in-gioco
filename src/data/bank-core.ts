import type { Level } from '../engine/types'
import type { ExOption, Exercise } from '../engine/exercise'
import { requireConcept } from './lexicon'
import {
  buildChoice,
  optionFor,
  pickDistractors,
  pairExercise,
  categorizeExercise,
  spatialExercise,
  describeSlots,
  shuffle,
} from '../engine/generator'

// ---------------------------------------------------------------
// Costruttori della banca curata.
// Ogni voce dichiara concetto, livello e consegna. I distrattori sono
// scelti da regole semantiche controllate e ogni esercizio viene
// validato da engine/validate.ts prima di essere mostrato.
// ---------------------------------------------------------------

function imageChoice(moduleId: string, targetId: string, level: Level, prompt: string, distractors?: number): Exercise {
  const target = requireConcept(targetId)
  const count = distractors ?? (level === 1 ? 2 : level === 2 ? 3 : 4)
  const options = buildChoice(target, level, `${moduleId}:${targetId}:${prompt}`, count)
  return {
    id: `${moduleId}-${targetId}-${level}`,
    moduleId,
    kind: 'choose-image',
    level,
    prompt,
    conceptIds: [targetId],
    targetConceptId: targetId,
    options,
    correct: [targetId],
    explanation: `${target.lemma[0].toUpperCase() + target.lemma.slice(1)}: ${target.definition}`,
    cue: target.features[0],
    scoring: 'objective',
    origin: 'bank',
    alternatives: count,
  }
}

function labelChoice(moduleId: string, targetId: string, level: Level, prompt: string, count = 3): Exercise {
  const target = requireConcept(targetId)
  const options = buildChoice(target, level, `${moduleId}:${targetId}:lbl`, count, { labelMode: 'label' })
  return {
    id: `${moduleId}-${targetId}-lbl-${level}`,
    moduleId,
    kind: 'choose-label',
    level,
    prompt,
    conceptIds: [targetId],
    targetConceptId: targetId,
    options,
    correct: [targetId],
    explanation: `${target.lemma[0].toUpperCase() + target.lemma.slice(1)}: ${target.definition}`,
    cue: target.features[0],
    scoring: 'objective',
    origin: 'bank',
    alternatives: count,
  }
}

function textChoice(
  moduleId: string,
  id: string,
  level: Level,
  prompt: string,
  correctLabel: string,
  wrongLabels: string[],
  conceptIds: string[],
  explanation: string,
): Exercise {
  const options: ExOption[] = shuffle(
    [{ id: 'ok', label: correctLabel }, ...wrongLabels.map((l, i) => ({ id: `w${i}`, label: l }))],
    `${id}:t`,
  )
  return {
    id,
    moduleId,
    kind: 'choose-label',
    level,
    prompt,
    conceptIds,
    targetConceptId: conceptIds[0],
    options,
    correct: ['ok'],
    explanation,
    scoring: 'objective',
    origin: 'bank',
    alternatives: options.length,
  }
}

function oddOneOut(
  id: string,
  level: Level,
  prompt: string,
  criterion: string,
  targetId: string,
  groupIds: string[],
  explanation: string,
): Exercise {
  const target = requireConcept(targetId)
  const others = groupIds.map((g) => requireConcept(g))
  const options = shuffle([optionFor(target), ...others.map((o) => optionFor(o))], `${id}:odd`)
  return {
    id,
    moduleId: 'm6',
    kind: 'odd-one-out',
    level,
    prompt,
    criterion,
    conceptIds: [targetId, ...groupIds],
    targetConceptId: targetId,
    options,
    correct: [targetId],
    explanation,
    cue: `Tutti gli altri sono ${criterion.toLowerCase()}.`,
    scoring: 'objective',
    origin: 'bank',
    alternatives: options.length,
  }
}

function multiSelect(
  id: string,
  moduleId: string,
  level: Level,
  prompt: string,
  correctIds: string[],
  distractorIds: string[],
): Exercise {
  const correctConcepts = correctIds.map((cid) => requireConcept(cid))
  const distractors = distractorIds.map((cid) => requireConcept(cid))
  const options = shuffle([...correctConcepts, ...distractors].map((c) => optionFor(c)), `${id}:ms`)
  return {
    id,
    moduleId,
    kind: 'multi-select',
    level,
    prompt,
    conceptIds: [...correctIds, ...distractorIds],
    targetConceptId: correctIds[0],
    options,
    correct: [...correctIds],
    explanation: `Le risposte giuste sono: ${correctConcepts.map((c) => c.lemma).join(', ')}.`,
    scoring: 'objective',
    origin: 'bank',
    alternatives: options.length,
  }
}

function ordering(
  id: string,
  level: Level,
  prompt: string,
  orderedIds: string[],
  explanation: string,
): Exercise {
  const concepts = orderedIds.map((cid) => requireConcept(cid))
  return {
    id,
    moduleId: 'm10',
    kind: 'ordering',
    level,
    prompt,
    conceptIds: orderedIds,
    targetConceptId: orderedIds[0],
    options: shuffle(concepts.map((c) => optionFor(c)), `${id}:ord`),
    sequence: [...orderedIds],
    correct: [...orderedIds],
    explanation,
    scoring: 'objective',
    origin: 'bank',
    alternatives: concepts.length,
  }
}

function guessExercise(targetId: string, level: Level, clueCount: number): Exercise {
  const target = requireConcept(targetId)
  const clues = [target.features[0], target.features[1], target.features[2]]
    .filter(Boolean)
    .slice(0, Math.max(2, clueCount))
  const prompt = `Ascolta gli indizi. ${clues.map((c) => c.charAt(0).toUpperCase() + c.slice(1) + '.').join(' ')} Che cos'è?`
  const count = level <= 2 ? 3 : 4
  const options = buildChoice(target, level, `m13:${targetId}:${clues.length}`, count)
  return {
    id: `m13-${targetId}-${level}`,
    moduleId: 'm13',
    kind: 'choose-image',
    level,
    prompt,
    conceptIds: [targetId],
    targetConceptId: targetId,
    options,
    correct: [targetId],
    explanation: `${target.lemma[0].toUpperCase() + target.lemma.slice(1)}: ${target.definition}`,
    cue: target.functions?.[0],
    scoring: 'objective',
    origin: 'bank',
    alternatives: count,
  }
}

function describeExercise(targetId: string, level: Level): Exercise {
  const target = requireConcept(targetId)
  return {
    id: `m14-${targetId}-${level}`,
    moduleId: 'm14',
    kind: 'open-describe',
    level,
    prompt: `Descrivi ${target.lemma} rispondendo alle domande della mappa.`,
    conceptIds: [targetId],
    targetConceptId: targetId,
    correct: [],
    describe: describeSlots(target),
    explanation: target.definition,
    scoring: 'adult',
    origin: 'bank',
  }
}

function recallExercise(targetId: string, level: Level): Exercise {
  const target = requireConcept(targetId)
  const distractors = pickDistractors(target, 2, Math.max(3, level) as Level, `m15:${targetId}`)
  return {
    id: `m15-${targetId}-${level}`,
    moduleId: 'm15',
    kind: 'open-recall',
    level,
    prompt: `Che cos'è? Puoi dirlo, indicarlo o usare la barra dei simboli.`,
    conceptIds: [targetId],
    targetConceptId: targetId,
    options: [optionFor(target), ...distractors.map((d) => optionFor(d))],
    correct: [targetId],
    explanation: target.definition,
    cue: target.functions?.[0],
    scoring: 'self',
    origin: 'bank',
  }
}

function inferenceExercise(id: string, level: Level, prompt: string, correctId: string, wrongIds: string[], explanation: string): Exercise {
  const correct = requireConcept(correctId)
  const options = shuffle(
    [correct, ...wrongIds.map((w) => requireConcept(w))].map((c) => optionFor(c)),
    `${id}:inf`,
  )
  return {
    id,
    moduleId: 'm17',
    kind: 'choose-image',
    level,
    prompt,
    conceptIds: [correctId, ...wrongIds],
    targetConceptId: correctId,
    options,
    correct: [correctId],
    explanation,
    scoring: 'objective',
    origin: 'bank',
    alternatives: options.length,
  }
}

function pairItem(id: string, level: Level, prompt: string, pairs: [string, string][]): Exercise {
  const ex = pairExercise(
    pairs.map(([a, b]) => ({ left: requireConcept(a), right: requireConcept(b) })),
    level,
    id,
    'm5',
  )
  return { ...ex, id: `m5-${id}`, prompt, origin: 'bank', explanation: 'Ogni cosa è collegata a un\'altra: guarda il tipo di relazione.' }
}

// ---------------------------------------------------------------
// MODULO 1 — Parole e immagini (36 item)
// ---------------------------------------------------------------
const M1: (string | number)[][] = [
  ['mela', 1, 'Tocca la mela.'],
  ['cane', 1, 'Tocca il cane.'],
  ['gatto', 1, 'Tocca il gatto.'],
  ['sedia', 1, 'Tocca la sedia.'],
  ['palla', 1, 'Tocca la palla.'],
  ['pane', 1, 'Tocca il pane.'],
  ['scarpe', 1, 'Tocca le scarpe.'],
  ['bicchiere', 1, 'Tocca il bicchiere.'],
  ['sole', 1, 'Tocca il sole.'],
  ['fiore', 1, 'Tocca il fiore.'],
  ['banana', 1, 'Tocca la banana.'],
  ['letto', 1, 'Tocca il letto.'],
  ['mela', 2, 'Ascolta la parola «mela» e tocca l\'immagine giusta.'],
  ['cavallo', 2, 'Ascolta la parola «cavallo» e tocca l\'immagine giusta.'],
  ['torta', 2, 'Tocca la torta.'],
  ['ombrello', 2, 'Tocca l\'ombrello.'],
  ['matita', 2, 'Tocca la matita.'],
  ['mucca', 2, 'Ascolta la parola «mucca» e tocca l\'immagine giusta.'],
  ['pesce', 2, 'Tocca il pesce.'],
  ['uccello', 2, 'Tocca l\'uccello.'],
  ['carota', 2, 'Tocca la carota.'],
  ['forchetta', 2, 'Tocca la forchetta.'],
  ['scarpe', 3, 'Quale immagine mostra le scarpe?'],
  ['fragola', 3, 'Quale immagine mostra la fragola?'],
  ['tamburo', 3, 'Quale immagine mostra il tamburo?'],
  ['pompiere', 3, 'Quale immagine mostra il pompiere? È la persona che spegne il fuoco.'],
  ['orologio', 3, 'Quale immagine mostra l\'orologio?'],
  ['anguria', 3, 'Quale immagine mostra l\'anguria?'],
  ['scaffale', 3, 'Quale immagine mostra lo scaffale?'],
  ['coniglio', 3, 'Quale immagine mostra il coniglio?'],
  ['chiave', 3, 'Quale oggetto serve per aprire la porta?'],
  ['farfalla', 3, 'Quale immagine mostra la farfalla?'],
  ['mela', 4, 'Tocca la mela. Attenzione: tutte le immagini sono frutti.'],
  ['cane', 4, 'Trova il cane tra gli animali.'],
  ['sedia', 4, 'Quale immagine mostra la sedia? Tutte le alternative sono mobili.'],
  ['bicchiere', 4, 'Quale immagine mostra il bicchiere? Tutte le alternative sono oggetti da cucina.'],
  ['cavallo', 4, 'Quale animale è il cavallo?'],
]

// ---------------------------------------------------------------
// MODULO 3 — Funzioni (24 item)
// ---------------------------------------------------------------
const M3: (string | number)[][] = [
  ['matita', 1, 'Quale oggetto usiamo per scrivere?'],
  ['forbici', 1, 'Quale oggetto usiamo per tagliare la carta?'],
  ['bicchiere', 1, 'Quale oggetto usiamo per bere?'],
  ['cucchiaio', 1, 'Quale oggetto usiamo per mangiare la minestra?'],
  ['letto', 1, 'Su quale mobile dormiamo?'],
  ['spazzolino', 1, 'Quale oggetto usiamo per lavarci i denti?'],
  ['spazzola', 2, 'Quale oggetto usiamo per pettinare i capelli?'],
  ['ombrello', 1, 'Quale oggetto prendiamo quando piove?'],
  ['sedia', 1, 'Su quale mobile ci sediamo?'],
  ['sapone', 1, 'Quale oggetto usiamo per lavarci le mani?'],
  ['pentola', 2, 'In quale recipiente cuociamo la pasta?'],
  ['chiave', 2, 'Quale oggetto usiamo per aprire la porta?'],
  ['piatto', 2, 'Su quale oggetto mettiamo il cibo?'],
  ['asciugamano', 2, 'Quale oggetto usiamo per asciugarci?'],
  ['camion', 2, 'Quale veicolo trasporta le merci?'],
  ['trattore', 3, 'Quale mezzo usa il contadino per arare il campo?'],
  ['stetoscopio', 3, 'Quale strumento usa il medico per ascoltare il cuore?'],
  ['lavagna', 2, 'Su quale superficie scrive l\'insegnante?'],
  ['forno', 2, 'In quale elettrodomestico si cuoce il pane?'],
  ['frigorifero', 2, 'In quale elettrodomestico mettiamo il latte per tenerlo fresco?'],
  ['scopa', 2, 'Quale oggetto usiamo per pulire il pavimento?'],
  ['secchio', 2, 'In quale contenitore mettiamo l\'acqua per pulire?'],
  ['tazza', 2, 'In quale oggetto beviamo il tè?'],
  ['coperchio', 3, 'Quale oggetto chiude la pentola?'],
]

// ---------------------------------------------------------------
// MODULO 4 — Attributi (22 item)
// ---------------------------------------------------------------
const M4: (string | number)[][] = [
  ['orsetto', 1, 'Quale oggetto è morbido?'],
  ['tavolo', 1, 'Quale oggetto è duro?'],
  ['palla', 1, 'Quale oggetto è rotondo?'],
  ['neve', 2, 'Quale di queste cose è fredda?'],
  ['minestra', 2, 'Quale cibo è caldo?'],
  ['legno', 2, 'Quale materiale viene dagli alberi?'],
  ['treno', 2, 'Quale veicolo è veloce?'],
  ['tartaruga', 2, 'Quale animale è lento?'],
  ['gelato', 2, 'Quale cibo è freddo e cremoso?'],
  ['miele', 3, 'Quale alimento è dolce e appiccicoso?'],
  ['limone', 2, 'Quale frutto è aspro?'],
  ['pioggia', 3, 'Quale di queste cose bagna?'],
  ['tamburo', 3, 'Quale strumento fa un suono forte?'],
  ['foglia', 4, 'Quale di queste cose è leggera?'],
  ['camion', 3, 'Quale veicolo è pesante?'],
  ['pomodoro', 4, 'Quale di queste cose è rossa e tonda?'],
  ['lampada', 3, 'Quale oggetto fa luce?'],
  ['pentola', 3, 'Quale oggetto si mette sul fuoco?'],
  ['bicicletta', 3, 'Quale veicolo ha due ruote?'],
  ['palla', 4, 'Quale oggetto è tondo e si può lanciare?'],
  ['pesce', 4, 'Quale animale ha le pinne?'],
  ['spazzola', 3, 'Quale oggetto ha le setole?'],
]

// ---------------------------------------------------------------
// MODULO 2 — Categorie (24 item, più raggruppamenti)
// ---------------------------------------------------------------
const M2: (string | number)[][] = [
  ['mela', 1, 'Quale di questi è un frutto?'],
  ['cane', 1, 'Quale di questi è un animale?'],
  ['sedia', 1, 'Quale di questi è un mobile?'],
  ['palla', 1, 'Quale di questi è un giocattolo?'],
  ['scarpe', 1, 'Quale di questi è un vestito?'],
  ['automobile', 1, 'Quale di questi è un veicolo?'],
  ['matita', 1, 'Quale di questi è un oggetto scolastico?'],
  ['mela', 2, 'Tocca il frutto. Attenzione: alcune immagini sono verdure.'],
  ['cane', 2, 'Quale di questi animali abbaia?'],
  ['chitarra', 2, 'Quale di questi è uno strumento musicale?'],
  ['medico', 2, 'Quale di queste persone è il medico?'],
  ['carota', 2, 'Quale di questi è una verdura?'],
  ['mucca', 2, 'Quale di questi animali dà il latte?'],
  ['cappotto', 2, 'Quale di questi vestiti si indossa quando fa freddo?'],
  ['camion', 2, 'Quale veicolo trasporta merci?'],
  ['cucchiaio', 2, 'Quale utensile usiamo per mangiare la minestra?'],
  ['telefono', 2, 'Quale oggetto serve per parlare a distanza?'],
  ['nuvola', 3, 'Quale di questi elementi porta la pioggia?'],
  ['banana', 3, 'Qual è il frutto? Tutte le alternative sono alimenti.'],
  ['zucchina', 3, 'Qual è la verdura? Tutte le alternative sono alimenti.'],
  ['torta', 3, 'Quale alimento si prepara per una festa?'],
  ['violino', 3, 'Quale strumento ha le corde e si suona con l\'archetto?'],
  ['nonno', 4, 'Quale persona è un familiare anziano?'],
  ['pianoforte', 4, 'Quale strumento ha i tasti bianchi e neri?'],
]

// ---------------------------------------------------------------
// MODULO 6 — Intrusi (24 item)
// ---------------------------------------------------------------
export function buildBankPart1(): Exercise[] {
  const items: Exercise[] = []

  for (const [id, level, prompt] of M1) items.push(imageChoice('m1', String(id), level as Level, String(prompt)))

  for (const [id, level, prompt] of M2) items.push(imageChoice('m2', String(id), level as Level, String(prompt)))

  for (const [id, level, prompt] of M3) items.push(imageChoice('m3', String(id), level as Level, String(prompt)))

  for (const [id, level, prompt] of M4) items.push(imageChoice('m4', String(id), level as Level, String(prompt)))

  // Associazioni semantiche (modulo 5)
  items.push(pairItem('oggetti-funzione', 2, 'Unisci ogni oggetto a ciò con cui si usa.', [
    ['spazzolino', 'denti'],
    ['sapone', 'acqua'],
    ['cucchiaio', 'minestra'],
    ['forbice-mela', 'mela'],
  ].filter(([a]) => a !== 'forbice-mela') as [string, string][]))
  items.push(pairItem('animali-habitat', 3, 'Unisci ogni animale al suo ambiente.', [
    ['pesce', 'mare'],
    ['mucca', 'fattoria'],
    ['uccello', 'albero'],
    ['ape', 'fiore'],
  ]))
  items.push(pairItem('professioni-strumenti', 3, 'Unisci ogni persona allo strumento che usa.', [
    ['medico', 'stetoscopio'],
    ['cuoco', 'pentola'],
    ['contadino', 'trattore'],
    ['insegnante', 'lavagna'],
  ]))
  items.push(pairItem('cibo-origine', 4, 'Unisci ogni alimento a ciò da cui viene.', [
    ['latte', 'mucca'],
    ['uovo', 'gallina'],
    ['miele', 'ape'],
    ['formaggio', 'latte'],
  ]))
  items.push(pairItem('parte-intero', 4, 'Unisci la parte all\'insieme a cui appartiene.', [
    ['dito', 'mano'],
    ['foglia', 'albero'],
    ['coperchio', 'pentola'],
    ['ruota-moto', 'bicicletta'],
  ].filter(([a]) => a !== 'ruota-moto') as [string, string][]))

  // Intrusi (modulo 6)
  items.push(oddOneOut('m6-frutta-scarpa', 1, 'Quale non è frutta?', 'frutta', 'scarpe', ['mela', 'banana', 'pera'], 'La scarpa non si mangia: è un vestito.'))
  items.push(oddOneOut('m6-animali-sedia', 1, 'Quale non è un animale?', 'animali', 'sedia', ['cane', 'gatto', 'mucca'], 'La sedia è un mobile, non un animale.'))
  items.push(oddOneOut('m6-veicoli-mela', 2, 'Quale non è un veicolo?', 'veicoli', 'mela', ['automobile', 'autobus', 'treno'], 'La mela è un frutto: non serve per spostarsi.'))
  items.push(oddOneOut('m6-vestiti-palla', 2, 'Quale non è un vestito?', 'vestiti', 'palla', ['maglietta', 'pantaloni', 'scarpe'], 'La palla è un giocattolo.'))
  items.push(oddOneOut('m6-utensili-libro', 2, 'Quale non si usa in cucina?', 'utensili da cucina', 'libro', ['cucchiaio', 'pentola', 'forchetta'], 'Il libro si legge, non si usa per cucinare.'))
  items.push(oddOneOut('m6-musica-mela', 3, 'Quale non è uno strumento musicale?', 'strumenti musicali', 'arancia', ['chitarra', 'tamburo', 'flauto'], 'L\'arancia è un frutto.'))
  items.push(oddOneOut('m6-animali-coniglio-treno', 3, 'Quale non è un animale?', 'animali', 'treno', ['coniglio', 'volpe', 'rana'], 'Il treno è un veicolo.'))
  items.push(oddOneOut('m6-frutta-pomodoro', 4, 'Tre sono frutti, uno è una verdura: quale?', 'frutti', 'pomodoro', ['mela', 'pera', 'banana'], 'Il pomodoro, in cucina, è trattato come verdura.'))
  items.push(oddOneOut('m6-mobili-chiave', 4, 'Quale non è un mobile?', 'mobili', 'chiave', ['sedia', 'tavolo', 'armadio'], 'La chiave è un piccolo oggetto, non un mobile.'))
  items.push(oddOneOut('m6-forme-sole', 5, 'Tre sono forme geometriche, uno è un elemento naturale: quale?', 'forme geometriche', 'sole', ['cerchio', 'quadrato', 'triangolo'], 'Il sole è un elemento naturale, non una forma disegnata.'))
  items.push(oddOneOut('m6-categoria-tempo', 5, 'Tre sono parole dello spazio, una del tempo: quale?', 'parole dello spazio', 'oggi', ['sopra', 'dentro', 'accanto'], '"Oggi" indica il tempo, non lo spazio.'))
  items.push(oddOneOut('m6-animali-domestici', 5, 'Tre vivono in casa, uno no: quale?', 'animali domestici', 'leone', ['gatto', 'cane', 'topo'], 'Il leone vive nella savana, non in casa.'))
  items.push(oddOneOut('m6-oggetti-scuola', 3, 'Quale non si porta a scuola per scrivere?', 'strumenti per scrivere', 'pentola', ['matita', 'penna', 'quaderno'], 'La pentola serve per cucinare.'))
  items.push(oddOneOut('m6-cibo-dolce', 4, 'Tre sono dolci, uno è salato: quale?', 'dolci', 'pane', ['torta', 'biscotto', 'gelato'], 'Il pane è salato, gli altri sono dolci.'))
  items.push(oddOneOut('m6-azioni', 4, 'Tre sono azioni con le gambe, una no: quale?', 'azioni con le gambe', 'leggere', ['correre', 'saltare', 'camminare'], 'Leggere non si fa con le gambe.'))
  items.push(oddOneOut('m6-colori', 3, 'Quale non è un colore?', 'colori', 'tavolo', ['rosso', 'blu', 'giallo'], 'Il tavolo è un mobile.'))
  items.push(oddOneOut('m6-corpo', 3, 'Quale non è una parte del corpo?', 'parti del corpo', 'scarpe', ['mano', 'occhio', 'piede'], 'Le scarpe si indossano.'))
  items.push(oddOneOut('m6-natura', 4, 'Quale non è un elemento naturale?', 'elementi naturali', 'telefono', ['sole', 'nuvola', 'fiume'], 'Il telefono è costruito dalle persone.'))
  items.push(oddOneOut('m6-piante', 4, 'Quale non è una pianta o parte di pianta?', 'piante', 'bicchiere', ['foglia', 'rosa', 'albero'], 'Il bicchiere è un oggetto.'))
  items.push(oddOneOut('m6-strumenti-scuola', 4, 'Quale non è un oggetto scolastico?', 'oggetti scolastici', 'cucchiaio', ['matita', 'righello', 'gomma'], 'Il cucchiaio serve a tavola.'))
  items.push(oddOneOut('m6-mezzi', 5, 'Tre vanno su strada, uno vola: quale?', 'veicoli che vanno su strada', 'aereo', ['automobile', 'autobus', 'camion'], 'L\'aereo vola nel cielo.'))
  items.push(oddOneOut('m6-categorie-astratte', 6, 'Tre sono emozioni, una è un oggetto: quale?', 'emozioni', 'regalo', ['gioia', 'paura', 'rabbia'], 'Il regalo è un oggetto, non un\'emozione.'))
  items.push(oddOneOut('m6-relazioni', 6, 'Tre servono per mangiare, uno per pulire: quale?', 'oggetti per mangiare', 'scopa', ['cucchiaio', 'forchetta', 'piatto'], 'La scopa serve per pulire.'))
  items.push(oddOneOut('m6-numeri-tempo', 6, 'Tre indicano il passato o il presente, una il futuro: quale?', 'passato o presente', 'domani', ['ieri', 'oggi', 'adesso'], '"Domani" è futuro.'))

  // Categorizzazione (modulo 2)
  const cat = categorizeExercise(
    [
      { label: 'Animali', concepts: ['cane', 'gatto', 'mucca'].map((id) => requireConcept(id)) },
      { label: 'Frutta', concepts: ['mela', 'banana', 'pera'].map((id) => requireConcept(id)) },
    ],
    ['cane', 'gatto', 'mucca', 'mela', 'banana', 'pera'].map((id) => requireConcept(id)),
    1,
    'frutta-animali',
  )
  if (cat) items.push(cat)

  const cat2 = categorizeExercise(
    [
      { label: 'Vestiti', concepts: ['maglietta', 'pantaloni', 'scarpe'].map((id) => requireConcept(id)) },
      { label: 'Giocattoli', concepts: ['palla', 'bambola', 'puzzle'].map((id) => requireConcept(id)) },
    ],
    ['maglietta', 'pantaloni', 'scarpe', 'palla', 'bambola', 'puzzle'].map((id) => requireConcept(id)),
    2,
    'vestiti-giochi',
  )
  if (cat2) items.push(cat2)

  // Modulo 7 — Sinonimi (frasi contestuali)
  items.push(textChoice('m7', 'm7-felice', 4, 'Marco sorride e salta: è molto felice. Quale parola vuol dire quasi la stessa cosa?', 'contento', ['triste', 'stanco'], ['felice'], '"Contento" è molto vicino a "felice": entrambi indicano gioia.'))
  items.push(textChoice('m7', 'm7-veloce', 4, 'Il treno corre e arriva subito: è veloce. Quale parola assomiglia?', 'rapido', ['lento', 'pesante'], ['veloce'], '"Rapido" e "veloce" indicano la stessa cosa; "lento" è il contrario.'))
  items.push(textChoice('m7', 'm7-grande', 5, 'La montagna è molto grande, enorme. Quale parola assomiglia a "grande"?', 'enorme', ['piccolo', 'minuscolo'], ['grande'], '"Enorme" è ancora più grande.'))
  items.push(textChoice('m7', 'm7-parlare', 5, 'Le due amiche parlano per un\'ora. Quale parola assomiglia a "parlare"?', 'conversare', ['tacere', 'ascoltare'], ['parlare'], '"Conversare" vuol dire parlare insieme.'))
  items.push(textChoice('m7', 'm7-iniziare', 5, 'La storia comincia adesso. Quale parola vuol dire la stessa cosa di "comincia"?', 'inizia', ['finisce', 'continua'], ['iniziare', 'prima'], '"Iniziare" e "cominciare" sono sinonimi.'))
  items.push(textChoice('m7', 'm7-bello', 5, 'Che bel disegno! È proprio bello. Quale parola assomiglia?', 'gradevole', ['brutto', 'sporco'], ['bello', 'fiore'], 'Entrambe indicano qualcosa che piace.'))
  items.push(textChoice('m7', 'm7-paura', 6, 'Ha visto un\'ombra e ha provato paura. Quale parola è simile?', 'spavento', ['coraggio', 'gioia'], ['paura'], '"Spavento" è una paura forte.'))
  items.push(textChoice('m7', 'm7-casa', 6, 'Torno alla mia abitazione. Quale parola assomiglia a "abitazione"?', 'casa', ['scuola', 'strada'], ['casa'], '"Casa" e "abitazione" indicano il luogo dove si vive.'))
  items.push(textChoice('m7', 'm7-freddo', 6, 'L\'acqua del mare è gelida. Quale parola assomiglia a "gelida"?', 'molto fredda', ['molto calda', 'tiepida'], ['freddo'], '"Gelida" è un freddo molto intenso.'))
  items.push(textChoice('m7', 'm7-guardare', 6, 'Osservo il cielo. Che cosa faccio?', 'guardo con attenzione', ['tocco', 'ascolto'], ['guardare', 'ascoltare'], '"Osservare" vuol dire guardare con attenzione.'))
  items.push(textChoice('m7', 'm7-allegro', 6, 'Oggi sono allegro. Quale parola è simile?', 'felice', ['triste', 'arrabbiato'], ['felice'], 'Allegro e felice indicano gioia.'))
  items.push(textChoice('m7', 'm7-difficile', 6, 'Questo puzzle è complicato. Quale parola assomiglia?', 'difficile', ['facile', 'semplice'], ['difficile', 'grande'], 'Complicato e difficile sono sinonimi.'))
  items.push(textChoice('m7', 'm7-piccolo', 6, 'La formica è minuscola. Quale parola assomiglia?', 'molto piccola', ['molto grande', 'pesante'], ['piccolo'], '"Minuscola" è un piccolo estremo.'))
  items.push(textChoice('m7', 'm7-svelto', 6, 'Il gatto è scattante. Quale parola assomiglia?', 'svelto', ['lento', 'pigro'], ['veloce'], 'Scattante e svelto indicano movimento rapido.'))
  items.push(textChoice('m7', 'm7-silenzio', 6, 'In biblioteca c\'è silenzio. Quale espressione è simile?', 'nessun rumore', ['molto rumore', 'musica alta'], ['silenzioso'], 'Silenzio vuol dire assenza di rumore.'))
  items.push(textChoice('m7', 'm7-contento', 5, 'La bambina è contenta del regalo. Quale parola è simile?', 'felice', ['triste', 'noiosa'], ['felice'], 'Contenta e felice sono sinonimi.'))

  // Modulo 8 — Contrari
  items.push(textChoice('m8', 'm8-aperto', 2, 'Se una porta non è chiusa, è…', 'aperta', ['chiusa', 'grande'], ['aprire'], 'Aperto e chiuso sono contrari.'))
  items.push(textChoice('m8', 'm8-pieno', 2, 'Il bicchiere è colmo d\'acqua: è…', 'pieno', ['vuoto', 'freddo'], ['pieno'], 'Pieno e vuoto sono contrari.'))
  items.push(textChoice('m8', 'm8-caldo', 2, 'La minestra è calda. Il suo contrario è…', 'freddo', ['tiepido', 'buono'], ['caldo'], 'Caldo e freddo sono contrari.'))
  items.push(textChoice('m8', 'm8-grande', 2, 'L\'elefante è grande. Il contrario è…', 'piccolo', ['alto', 'pesante'], ['grande'], 'Grande e piccolo sono contrari.'))
  items.push(textChoice('m8', 'm8-sopra', 3, 'Il gatto è sopra il tavolo. Il contrario è…', 'sotto', ['accanto', 'dentro'], ['sopra'], 'Sopra e sotto sono contrari.'))
  items.push(textChoice('m8', 'm8-veloce', 3, 'La lepre è veloce. Il contrario è…', 'lenta', ['furba', 'grande'], ['veloce'], 'Veloce e lento sono contrari.'))
  items.push(textChoice('m8', 'm8-felice', 3, 'Oggi sono felice. Il contrario è…', 'triste', ['stanco', 'silenzioso'], ['felice'], 'Felice e triste sono contrari.'))
  items.push(textChoice('m8', 'm8-dentro', 3, 'La palla è dentro la scatola. Il contrario è…', 'fuori', ['vicino', 'sotto'], ['dentro'], 'Dentro e fuori sono contrari.'))
  items.push(textChoice('m8', 'm8-lungo', 4, 'Il serpente è lungo. Il contrario è…', 'corto', ['sottile', 'largo'], ['lungo'], 'Lungo e corto sono contrari.'))
  items.push(textChoice('m8', 'm8-pulito', 3, 'Le mani sono pulite. Il contrario è…', 'sporche', ['grandi', 'calde'], ['pulito'], 'Pulito e sporco sono contrari.'))
  items.push(textChoice('m8', 'm8-pesante', 4, 'Lo zaino è pesante. Il contrario è…', 'leggero', ['grande', 'duro'], ['pesante'], 'Pesante e leggero sono contrari.'))
  items.push(textChoice('m8', 'm8-davanti', 4, 'Mi metto davanti alla porta. Il contrario è…', 'dietro', ['sopra', 'accanto'], ['davanti'], 'Davanti e dietro sono contrari.'))
  items.push(textChoice('m8', 'm8-morbido', 3, 'Il cuscino è morbido. Il contrario è…', 'duro', ['grande', 'bianco'], ['morbido'], 'Morbido e duro sono contrari.'))
  items.push(textChoice('m8', 'm8-vicino', 4, 'La scuola è vicina. Il contrario è…', 'lontana', ['grande', 'chiusa'], ['vicino'], 'Vicino e lontano sono contrari.'))
  items.push(textChoice('m8', 'm8-prima', 4, 'Prima mi lavo le mani. Il contrario di "prima" è…', 'dopo', ['adesso', 'oggi'], ['prima'], 'Prima e dopo sono contrari.'))
  items.push(textChoice('m8', 'm8-rumoroso', 5, 'Il camion è rumoroso. Il contrario è…', 'silenzioso', ['veloce', 'grande'], ['rumoroso'], 'Rumoroso e silenzioso sono contrari.'))
  items.push(textChoice('m8', 'm8-pieno-vuoto', 5, 'Il piatto è vuoto. Il suo contrario è…', 'pieno', ['pulito', 'rotondo'], ['vuoto'], 'Vuoto e pieno sono contrari.'))
  items.push(textChoice('m8', 'm8-lento', 4, 'La tartaruga è lenta. Il contrario è…', 'veloce', ['piccola', 'verde'], ['lento'], 'Lento e veloce sono contrari.'))

  // Modulo 9 — Spazio (20 item, scene interattive)
  const spatialSpecs: [string, string, string, Level][] = [
    ['scatola', 'palla', 'dentro', 1],
    ['scatola', 'orsetto', 'dentro', 1],
    ['scatola', 'palla', 'sopra', 1],
    ['scatola', 'bambola', 'sotto', 1],
    ['tavolo', 'piatto', 'sopra', 2],
    ['tavolo', 'forchetta', 'sopra', 2],
    ['letto', 'orsetto', 'sopra', 2],
    ['sedia', 'zaino', 'sopra', 2],
    ['scatola', 'palla', 'davanti', 3],
    ['scatola', 'orsetto', 'dietro', 3],
    ['tavolo', 'cucchiaio', 'accanto', 3],
    ['scatola', 'palla', 'accanto', 3],
    ['tavolo', 'tazza', 'sopra', 3],
    ['scatola', 'puzzle', 'dentro', 2],
    ['letto', 'pigiama', 'sopra', 3],
    ['scatola', 'bambola', 'davanti', 4],
    ['tavolo', 'bicchiere', 'accanto', 4],
    ['scatola', 'palla', 'dietro', 4],
    ['sedia', 'gatto', 'sotto', 4],
    ['scatola', 'orsetto', 'sotto', 4],
  ]
  for (const [ref, obj, zone, level] of spatialSpecs) {
    items.push(spatialExercise(requireConcept(ref), requireConcept(obj), { id: zone, label: zone }, level))
  }

  // Modulo 10 — Tempo
  items.push(ordering('m10-giornata', 2, 'Metti in ordine le parti della giornata.', ['mattina', 'pomeriggio', 'sera', 'notte'], 'La giornata va dalla mattina alla notte.'))
  items.push(ordering('m10-ieri-oggi', 3, 'Metti in ordine dal passato al futuro.', ['ieri', 'oggi', 'domani'], 'Prima ieri, poi oggi, infine domani.'))
  items.push(ordering('m10-prima-dopo', 3, 'Metti in ordine: prima, adesso, dopo.', ['prima', 'adesso', 'dopo'], 'Il tempo scorre: prima, adesso, dopo.'))
  items.push(ordering('m10-routine', 2, 'Metti in ordine la mattina di Luca.', ['lavarsi', 'mangiare', 'giocare'], 'Prima si lava, poi mangia, poi gioca.'))
  items.push(ordering('m10-azione', 4, 'Metti in ordine: si apre la porta, si entra, si chiude.', ['aprire', 'camminare', 'chiudere'], 'Si apre, si entra camminando, si chiude.'))
  items.push(ordering('m10-sera', 2, 'Metti in ordine la sera.', ['giocare', 'mangiare', 'dormire'], 'Si gioca, si mangia, poi si dorme.'))
  items.push(ordering('m10-mattina', 3, 'Metti in ordine la mattina a casa.', ['lavarsi', 'mangiare', 'giocare'], 'Dopo il risveglio ci si lava e si mangia.'))
  items.push(ordering('m10-stagioni-giorno', 4, 'Metti in ordine la luce del giorno.', ['mattina', 'pomeriggio', 'sera'], 'Il sole sale e poi scende.'))
  items.push(ordering('m10-past-future', 5, 'Metti in ordine dal più lontano al più vicino nel passato.', ['ieri', 'oggi'], 'Ieri viene prima di oggi.'))
  items.push(ordering('m10-azione-2', 5, 'Metti in ordine la preparazione della tavola.', ['piatto', 'forchetta', 'tovaglia-finta'].filter((x) => x !== 'tovaglia-finta'), 'Prima il piatto, poi le posate.'))
  items.push(textChoice('m10', 'm10-prima-dopo-2', 3, 'Prima mi lavo i denti, poi dormo. Che cosa faccio per primo?', 'Mi lavo i denti', ['Dormo', 'Faccio colazione'], ['prima'], 'La parola "prima" indica la prima azione.'))
  items.push(textChoice('m10', 'm10-oggi', 3, 'Che giorno è quello in cui siamo adesso?', 'oggi', ['ieri', 'domani'], ['oggi'], '"Oggi" è il giorno presente.'))
  items.push(textChoice('m10', 'm10-domani', 4, 'Il giorno dopo oggi si chiama…', 'domani', ['ieri', 'adesso'], ['domani'], '"Domani" è il giorno successivo.'))
  items.push(textChoice('m10', 'm10-sera-quando', 4, 'Quando si cena?', 'la sera', ['la mattina', 'la notte'], ['sera'], 'La cena si fa la sera.'))
  items.push(textChoice('m10', 'm10-notte', 5, 'Quando dormiamo di solito?', 'la notte', ['la mattina', 'il pomeriggio'], ['notte'], 'La notte è il momento del riposo.'))
  items.push(textChoice('m10', 'm10-dopo-scuola', 5, 'Vado a scuola, poi torno a casa. Che cosa viene dopo la scuola?', 'tornare a casa', ['andare a scuola', 'svegliarsi'], ['dopo'], '"Dopo" indica l\'azione successiva.'))

  // Riconoscimento della parola scritta (ascoltabile) fra parole della stessa area
  items.push(labelChoice('m1', 'cane', 3, 'Quale parola corrisponde all\'immagine del cane?', 3))
  items.push(labelChoice('m1', 'automobile', 3, 'Quale parola corrisponde all\'immagine?', 3))
  items.push(labelChoice('m2', 'carota', 2, 'Quale parola indica la verdura?', 3))

  // Trova tutti gli elementi di una categoria: più risposte corrette accettate
  items.push(multiSelect('m2-animali', 'm2', 2, 'Trova tutti gli animali.', ['cane', 'gatto', 'mucca'], ['sedia', 'mela', 'automobile']))
  items.push(multiSelect('m2-frutta', 'm2', 2, 'Trova tutta la frutta.', ['mela', 'banana', 'pera'], ['pane', 'scarpe', 'cavallo']))
  items.push(multiSelect('m2-veicoli', 'm2', 3, 'Trova tutti i veicoli.', ['automobile', 'autobus', 'treno'], ['mela', 'torta', 'gatto']))
  items.push(multiSelect('m4-morbidi', 'm4', 3, 'Trova le cose morbide.', ['orsetto', 'asciugamano'], ['tavolo', 'pentola']))

  // Indovina dalla descrizione con indizi progressivi
  items.push(guessExercise('sedia', 2, 2))
  items.push(guessExercise('ombrello', 4, 3))
  items.push(guessExercise('tavolo', 3, 3))
  items.push(guessExercise('giardino', 4, 3))

  // Descrizione guidata con la mappa a sei domande
  items.push(describeExercise('bicicletta', 3))
  items.push(describeExercise('tavolo', 3))
  items.push(describeExercise('pane', 4))

  // Recupero lessicale con aiuti graduati
  items.push(recallExercise('tavolo', 3))
  items.push(recallExercise('finestra', 3))
  items.push(recallExercise('porta', 3))

  // Inferenze
  items.push(inferenceExercise('m17-scuola-zaino', 4, 'È mattina, Marta prende lo zaino e saluta la mamma. Dove va?', 'scuola', ['parco', 'mare'], 'Lo zaino e il saluto indicano che va a scuola.'))
  items.push(inferenceExercise('m17-giardino-fiori', 4, 'La nonna prende la forbice e i fiori sul tavolo. Che cosa farà?', 'giardino', ['scuola', 'strada'], 'I fiori e le forbici suggeriscono un lavoro in giardino.'))

  return items
}
