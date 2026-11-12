import { describe, expect, it } from 'vitest'
import { CATEGORIES, CATEGORY_BY_ID } from './categories'
import { CONCEPTS, CONCEPT_BY_ID, validateLexicon } from './lexicon'
import { EXERCISE_BANK, REJECTED_EXERCISES, bankStats } from './bank'
import { MODULES } from './modules'
import { STORIES } from './stories'
import { SEMANTIC_MAPS } from './maps'
import { PATHS } from './paths'
import { ENVIRONMENTS } from './environments'
import { CORE_WORDS } from './caa'
import { RELATION_LABELS } from '../engine/types'

describe('archivio lessicale', () => {
  it('contiene almeno 250 concetti illustrati', () => {
    expect(CONCEPTS.length).toBeGreaterThanOrEqual(250)
  })

  it('ha almeno 20 categorie semantiche', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(20)
  })

  it('non ha relazioni o immagini mancanti', () => {
    expect(validateLexicon()).toEqual([])
  })

  it('ogni concetto ha lemma italiano, definizione e caratteristiche', () => {
    for (const concept of CONCEPTS) {
      expect(concept.lemma.trim().length).toBeGreaterThan(1)
      expect(concept.definition.trim().length).toBeGreaterThan(8)
      expect(concept.definition).not.toMatch(/lorem|TODO|segnaposto|placeholder/i)
      if (concept.pos !== 'spazio' && concept.pos !== 'tempo') {
        expect(concept.features.length).toBeGreaterThan(0)
      }
    }
  })

  it('usa nomi, verbi, aggettivi e parole dello spazio, del tempo e astratte', () => {
    const pos = new Set(CONCEPTS.map((c) => c.pos))
    for (const expected of ['nome', 'verbo', 'aggettivo', 'spazio', 'tempo', 'astratto']) {
      expect(pos.has(expected as never)).toBe(true)
    }
  })

  it('non confonde le relazioni: ogni tipo ha un\'etichetta distinta', () => {
    const labels = Object.values(RELATION_LABELS)
    expect(new Set(labels).size).toBe(labels.length)
    expect(RELATION_LABELS['part-of']).not.toBe(RELATION_LABELS['is-a'])
    expect(RELATION_LABELS['used-for']).not.toBe(RELATION_LABELS['used-with'])
  })

  it('distingue proprietà tipiche da proprietà universali (bicchiere, tazza)', () => {
    const tazza = CONCEPT_BY_ID.get('tazza')
    expect(tazza?.properties?.temperatura).toMatch(/può essere|calda|fredda/i)
  })

  it('segnala le ambiguità lessicali', () => {
    const ambigui = CONCEPTS.filter((c) => c.ambiguity)
    expect(ambigui.length).toBeGreaterThan(2)
    expect(ambigui.some((c) => c.id === 'penna')).toBe(true)
  })

  it('ogni concetto ha metadati di licenza', () => {
    for (const c of CONCEPTS) {
      expect(c.license).toContain('CC BY-NC-SA')
    }
  })
})

describe('banca degli esercizi', () => {
  it('contiene almeno 300 esercizi verificati', () => {
    expect(EXERCISE_BANK.length).toBeGreaterThanOrEqual(300)
  })

  it('non ha item scartati dalla validazione', () => {
    expect(REJECTED_EXERCISES).toEqual([])
  })

  it('copre i moduli 1-18 con più livelli e più tipi di risposta', () => {
    const stats = bankStats()
    for (const module of MODULES.filter((m) => m.number <= 18)) {
      expect(stats.byModule[module.id] ?? 0).toBeGreaterThan(3)
    }
    const kinds = new Set(EXERCISE_BANK.map((e) => e.kind))
    for (const kind of ['choose-image', 'choose-label', 'multi-select', 'pair-match', 'ordering', 'categorize', 'odd-one-out', 'spatial-place', 'sentence-build', 'open-recall', 'open-describe']) {
      expect(kinds.has(kind as never), `tipo mancante: ${kind}`).toBe(true)
    }
  })

  it('contiene consegne in italiano reale, senza testo segnaposto', () => {
    for (const ex of EXERCISE_BANK) {
      expect(ex.prompt.length).toBeGreaterThan(6)
      expect(ex.prompt).not.toMatch(/lorem|TODO|xxx|placeholder|coming soon/i)
      expect(/[.?!…]$/.test(ex.prompt)).toBe(true)
    }
  })

  it('ogni modulo della banca ha almeno tre livelli diversi', () => {
    const byModule = new Map<string, Set<number>>()
    for (const ex of EXERCISE_BANK) {
      const set = byModule.get(ex.moduleId) ?? new Set<number>()
      set.add(ex.level)
      byModule.set(ex.moduleId, set)
    }
    for (const module of MODULES.filter((m) => m.number <= 16)) {
      expect((byModule.get(module.id) ?? new Set()).size).toBeGreaterThanOrEqual(2)
    }
  })

  it('le consegne sulle azioni descrivono l\'azione invece di chiedere «chi»', () => {
    const actions = EXERCISE_BANK.filter((e) => e.moduleId === 'm11' && e.kind === 'choose-image')
    expect(actions.length).toBeGreaterThan(10)
    for (const ex of actions) {
      expect(ex.prompt, ex.id).toMatch(/Quale immagine mostra l'azione/)
      expect(ex.prompt, ex.id).not.toMatch(/^Chi /)
    }
  })

  it('le consegne spaziali usano articoli e preposizioni corretti', () => {
    const spatial = EXERCISE_BANK.filter((e) => e.kind === 'spatial-place')
    expect(spatial.length).toBeGreaterThan(10)
    for (const ex of spatial) {
      expect(ex.prompt, ex.id).toMatch(/^Metti (la|il|lo|l')/)
      expect(ex.prompt, ex.id).not.toMatch(/Metti [a-zà-ù]+ (dentro|sopra|sotto) [a-zà-ù]+\.$/)
    }
  })

  it('gli esercizi con più risposte corrette le dichiarano tutte', () => {
    const multi = EXERCISE_BANK.filter((e) => e.kind === 'multi-select')
    expect(multi.length).toBeGreaterThan(2)
    for (const ex of multi) {
      expect(ex.correct.length).toBeGreaterThan(0)
      for (const id of ex.correct) {
        expect(ex.options?.some((o) => o.id === id)).toBe(true)
      }
    }
  })
})

describe('storie', () => {
  it('ce ne sono almeno 20, con domande esplicite e inferenziali', () => {
    expect(STORIES.length).toBeGreaterThanOrEqual(20)
    const kinds = new Set(STORIES.flatMap((s) => s.questions.map((q) => q.kind)))
    expect(kinds.has('explicit')).toBe(true)
    expect(kinds.has('inferential')).toBe(true)
  })

  it('accompagna le domande di comprensione con immagini pertinenti', () => {
    for (const story of STORIES) {
      const illustrated = story.questions.filter(
        (q) => q.options.filter((o) => (o.conceptIds ?? []).length > 0).length >= 2,
      )
      expect(illustrated.length, `${story.id}: poche domande con immagini`).toBeGreaterThanOrEqual(2)
    }
  })

  it('ogni domanda ha una sola risposta corretta e concetti esistenti', () => {
    for (const story of STORIES) {
      expect(story.panels.length).toBeGreaterThanOrEqual(2)
      for (const id of story.keyWords) {
        expect(CONCEPT_BY_ID.has(id), `${story.id}: concetto ${id} inesistente`).toBe(true)
      }
      for (const q of story.questions) {
        expect(q.options.filter((o) => o.correct).length).toBe(1)
        expect(q.text.trim().endsWith('?')).toBe(true)
      }
      for (const word of story.reuse) {
        expect(CONCEPT_BY_ID.has(word), `${story.id}: parola da riusare inesistente: ${word}`).toBe(true)
      }
    }
  })
})

describe('mappe semantiche', () => {
  it('ce ne sono almeno 30 e ogni collegamento ha un tipo esplicito', () => {
    expect(SEMANTIC_MAPS.length).toBeGreaterThanOrEqual(30)
    for (const map of SEMANTIC_MAPS) {
      expect(map.nodes.length).toBeGreaterThanOrEqual(3)
      expect(CONCEPT_BY_ID.has(map.central)).toBe(true)
      for (const node of map.nodes) {
        expect(CONCEPT_BY_ID.has(node.conceptId), `${map.id}: nodo inesistente ${node.conceptId}`).toBe(true)
        expect(RELATION_LABELS[node.relation]).toBeTruthy()
      }
    }
  })

  it('non usa la stessa relazione per cose diverse', () => {
    const cane = SEMANTIC_MAPS.find((m) => m.central === 'cane')
    expect(cane).toBeTruthy()
    const types = new Set(cane!.nodes.map((n) => n.relation))
    expect(types.size).toBeGreaterThan(1)
  })
})

describe('percorsi e ambienti', () => {
  it('ci sono almeno 10 percorsi con sequenza e criteri osservativi', () => {
    expect(PATHS.length).toBeGreaterThanOrEqual(10)
    for (const path of PATHS) {
      expect(path.steps.length).toBeGreaterThanOrEqual(3)
      expect(path.observation.length).toBeGreaterThan(0)
      expect(path.generalization.length).toBeGreaterThan(0)
      for (const step of path.steps) {
        expect(MODULES.some((m) => m.id === step.moduleId)).toBe(true)
      }
    }
  })

  it('ci sono almeno 6 ambienti con hotspot validi e missioni', () => {
    expect(ENVIRONMENTS.length).toBeGreaterThanOrEqual(6)
    for (const env of ENVIRONMENTS) {
      expect(env.hotspots.length).toBeGreaterThan(3)
      expect(env.missions.length).toBeGreaterThan(0)
      for (const hotspot of env.hotspots) {
        expect(CONCEPT_BY_ID.has(hotspot.conceptId), `${env.id}: hotspot inesistente`).toBe(true)
      }
      for (const mission of env.missions) {
        expect(MODULES.some((m) => m.id === mission.moduleId)).toBe(true)
      }
    }
  })

  it('i 20 moduli sono definiti con obiettivi e indicazioni', () => {
    expect(MODULES.length).toBe(20)
    for (const module of MODULES) {
      expect(module.goal.length).toBeGreaterThan(20)
      expect(module.guidance.length).toBeGreaterThan(1)
      expect(module.levels.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('la barra CAA ha le nove parole funzionali richieste', () => {
    const labels = CORE_WORDS.map((w) => w.label)
    for (const label of ['Voglio', 'Non voglio', 'Ancora', 'Basta', 'Aiuto', 'Non so', 'Mi piace', 'Non mi piace', 'Ripeti']) {
      expect(labels).toContain(label)
    }
  })

  it('ogni categoria dell\'archivio è usata da almeno un concetto', () => {
    for (const category of CATEGORIES) {
      expect(CONCEPTS.some((c) => c.category === category.id), `categoria vuota: ${category.id}`).toBe(true)
      expect(CATEGORY_BY_ID.get(category.id)?.definition.length).toBeGreaterThan(10)
    }
  })
})
