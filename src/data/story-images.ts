import { CONCEPTS } from './lexicon'

// Le opzioni delle domande di comprensione sono etichette brevi ("La pioggia",
// "Il latte", "Cappotto, guanti e sciarpa"). Qui le colleghiamo ai concetti
// illustrati già presenti nell'archivio, così ogni domanda può mostrare le
// immagini senza duplicare dati dentro le storie.
//
// Le parole astratte (emozioni, idee, tempo verbale) restano senza immagine:
// un pittogramma sbagliato confonderebbe più di quanto aiuti.

const FUNCTION_WORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una',
  'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'a', 'al', 'alla', 'allo', 'ai', 'agli', 'alle',
  'del', 'della', 'dello', 'dei', 'delle', 'degli', 'nel', 'nella', 'nello', 'nei', 'nelle', 'negli',
  'sul', 'sulla', 'sullo', 'sui', 'sulle', 'sugli', 'dal', 'dalla', 'dallo', 'dai', 'dalle', 'dagli',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'quelli', 'quelle', 'suo', 'sua', 'loro',
  'che', 'chi', 'cosa', 'cose', 'non', 'più', 'piu', 'molto', 'poco', 'anche', 'come', 'dove', 'quando',
  'perché', 'perche', 'si', 'è', 'e', 'ed', 'o', 'sono', 'ha', 'hanno', 'fa', 'fanno', 'va', 'vanno',
  'può', 'puo', 'deve', 'senza', 'sopra', 'sotto', 'dentro', 'davanti', 'dietro', 'accanto', 'vicino',
  'ombra', 'testo', 'parola', 'parole', 'frase', 'storia', 'volta', 'modo', 'parte', 'insieme',
  'qualcosa', 'niente', 'tutto', 'tutti', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette',
])

const INDEX = new Map<string, string>()

for (const concept of CONCEPTS) {
  if (!concept.image?.pictogram) continue
  if (concept.pos === 'astratto') continue
  for (const key of [concept.lemma, concept.plural, ...(concept.forms ?? []), ...(concept.synonyms ?? [])]) {
    if (!key) continue
    const normalized = key.toLowerCase().trim()
    if (normalized && !INDEX.has(normalized)) INDEX.set(normalized, concept.id)
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .split(/[^a-zàèéìòù]+/)
    .filter(Boolean)
}

// Forme femminili e plurali degli aggettivi di colore: non sono lemmi a sé,
// ma nelle opzioni compaiono spesso ("Rossa", "Gialla", "Sono rosse").
const ADJECTIVE_FORMS: Record<string, string> = {
  rossa: 'rosso',
  rosse: 'rosso',
  rossi: 'rosso',
  gialla: 'giallo',
  gialle: 'giallo',
  gialli: 'giallo',
  bianca: 'bianco',
  bianche: 'bianco',
  bianchi: 'bianco',
  nera: 'nero',
  nere: 'nero',
  neri: 'nero',
  grigia: 'grigio',
  grigie: 'grigio',
  grigi: 'grigio',
}

/** Forme singolari semplici: copre i plurali irregolari più comuni delle storie. */
function singularForms(word: string): string[] {
  const forms = [word]
  if (word.endsWith('che')) forms.push(`${word.slice(0, -3)}ca`)
  else if (word.endsWith('chi')) forms.push(`${word.slice(0, -3)}co`)
  else if (word.endsWith('ghe')) forms.push(`${word.slice(0, -3)}ga`)
  else if (word.endsWith('ghi')) forms.push(`${word.slice(0, -3)}go`)
  else if (word.endsWith('i')) forms.push(`${word.slice(0, -1)}o`, `${word.slice(0, -1)}e`)
  else if (word.endsWith('e')) forms.push(`${word.slice(0, -1)}a`)
  return forms
}

function lookup(word: string): string | undefined {
  const direct = INDEX.get(word)
  if (direct) return direct
  const adjective = ADJECTIVE_FORMS[word]
  if (adjective) return INDEX.get(adjective)
  for (const candidate of singularForms(word)) {
    const id = INDEX.get(candidate)
    if (id) return id
  }
  return undefined
}

/**
 * Concetti illustrati che sostengono un'etichetta. Restituisce al massimo tre
 * immagini, in ordine di comparsa. Le frasi lunghe sono escluse: lì l'immagine
 * non aiuterebbe a scegliere e potrebbe anticipare la risposta.
 */
export function conceptsForOption(label: string): string[] {
  const words = tokenize(label)
  const content = words.filter((w) => !FUNCTION_WORDS.has(w))
  if (!content.length || content.length > 4) return []

  const found: string[] = []
  for (let i = 0; i < words.length && found.length < 3; i++) {
    for (let size = 3; size >= 1; size--) {
      const phrase = words.slice(i, i + size)
      if (phrase.length < size) continue
      if (phrase.every((w) => FUNCTION_WORDS.has(w))) continue
      const id = size === 1 ? lookup(phrase[0]) : INDEX.get(phrase.join(' '))
      if (id) {
        if (!found.includes(id)) found.push(id)
        i += size - 1
        break
      }
    }
  }
  return found
}
