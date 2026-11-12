// Normalizzazione del testo italiano per la sintesi vocale.
// Il testo mostrato al bambino non viene mai modificato: questa funzione
// produce solo la stringa da pronunciare (numeri, sigle, simboli, omografi).

export interface PronunciationEntry {
  /** Parola scritta, confrontata come parola intera. */
  word: string
  /** Forma usata solo per la sintesi (accenti o riscrittura fonetica). */
  spoken: string
  /** Se presente, l'entry si applica solo quando questo contesto compare. */
  context?: string
}

/**
 * Dizionario predefinito: esempi volutamente pochi e verificabili, pensati per
 * essere modificati dall'adulto. Non è una trascrizione fonetica completa:
 * il phonemizer del modello ha il proprio lessico e queste sostituzioni
 * servono a disambiguare gli omografi più frequenti nelle attività.
 */
export const DEFAULT_PRONUNCIATION: PronunciationEntry[] = [
  { word: 'pesca', spoken: 'pèsca', context: 'andare a|vado a|andiamo a|gita di' },
  { word: 'botte', spoken: 'bótte', context: 'di vino|di legno|una botte' },
  { word: 'ancora', spoken: 'àncora', context: 'gettare|della nave|sollevare' },
  { word: 'principi', spoken: 'princìpi', context: 'regola|regole|della fisica|fondamentale' },
]

const UNITS = [
  'zero',
  'uno',
  'due',
  'tre',
  'quattro',
  'cinque',
  'sei',
  'sette',
  'otto',
  'nove',
  'dieci',
  'undici',
  'dodici',
  'tredici',
  'quattordici',
  'quindici',
  'sedici',
  'diciassette',
  'diciotto',
  'diciannove',
]

const TENS: [number, string][] = [
  [90, 'novanta'],
  [80, 'ottanta'],
  [70, 'settanta'],
  [60, 'sessanta'],
  [50, 'cinquanta'],
  [40, 'quaranta'],
  [30, 'trenta'],
  [20, 'venti'],
]

function under100(n: number): string {
  if (n < 20) return UNITS[n]
  for (const [value, word] of TENS) {
    if (n >= value) {
      const rest = n - value
      if (rest === 0) return word
      // venti/trenta… perdono la vocale finale davanti a "uno" e "otto".
      const base = rest === 1 || rest === 8 ? word.slice(0, -1) : word
      if (rest === 3) return `${base}tré`
      const tail = rest === 1 ? 'uno' : rest === 8 ? 'otto' : UNITS[rest]
      return base + tail
    }
  }
  return UNITS[n] ?? String(n)
}

function under1000(n: number): string {
  if (n < 100) return under100(n)
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const head = hundreds === 1 ? 'cento' : `${UNITS[hundreds]}cento`
  return rest ? `${head} ${under100(rest)}` : head
}

function under1e6(n: number): string {
  if (n < 1000) return under1000(n)
  const thousands = Math.floor(n / 1000)
  const rest = n % 1000
  const head = thousands === 1 ? 'mille' : `${under1000(thousands)}mila`
  return rest ? `${head} ${under1000(rest)}` : head
}

/** Numero cardinale in italiano, fino alle centinaia di milioni. */
export function numberToItalian(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value < 0) return `meno ${numberToItalian(-value)}`
  if (!Number.isInteger(value)) {
    const [int, dec] = String(value).split('.')
    const digits = dec.split('').map((d) => UNITS[Number(d)]).join(' ')
    return `${numberToItalian(Number(int))} virgola ${digits}`
  }
  if (value < 1_000_000) return under1e6(value)
  if (value < 1_000_000_000) {
    const millions = Math.floor(value / 1_000_000)
    const rest = value % 1_000_000
    const head = millions === 1 ? 'un milione' : `${under1e6(millions)} milioni`
    return rest ? `${head} ${under1e6(rest)}` : head
  }
  return String(value)
}

function decimalsToItalian(integerPart: string, decimalPart: string): string {
  const digits = decimalPart
    .split('')
    .map((d) => UNITS[Number(d)] ?? d)
    .join(' ')
  return `${under1e6(Number(integerPart))} virgola ${digits}`
}

/** Legge un numero scritto, distinguendo migliaia (1.234) e decimali (3,5). */
function readNumber(raw: string): string {
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    return under1e6(Number(raw.replace(/\./g, '')))
  }
  if (raw.includes(',')) {
    const [int, dec] = raw.split(',')
    return decimalsToItalian(int, dec)
  }
  if (raw.includes('.')) {
    const [int, dec] = raw.split('.')
    if (dec.length === 3 && int.length <= 3) return under1e6(Number(int + dec))
    return decimalsToItalian(int, dec)
  }
  const value = Number(raw)
  return Number.isNaN(value) ? raw : under1e6(value)
}

/** Sigle e abbreviazioni frequenti. Le più specifiche vanno per prime. */
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bsig\.ra\b/gi, 'signora'],
  [/\bsig\.\b/gi, 'signor'],
  [/\becc\./gi, 'eccetera'],
  [/\bes\./gi, 'per esempio'],
  [/\bn\.\s*(?=\d)/gi, 'numero '],
  [/\bart\.\s*(?=\d)/gi, 'articolo '],
  [/\bpag\.\s*(?=\d)/gi, 'pagina '],
]

/** Unità di misura: vengono lette solo quando seguono un numero. */
const MEASURES: [RegExp, string][] = [
  [/(\d)\s*kg\b/gi, '$1 chili'],
  [/(\d)\s*km\b/gi, '$1 chilometri'],
  [/(\d)\s*cm\b/gi, '$1 centimetri'],
  [/(\d)\s*mm\b/gi, '$1 millimetri'],
  [/(\d)\s*ml\b/gi, '$1 millilitri'],
  [/(\d)\s*g\b/gi, '$1 grammi'],
  [/(\d)\s*m\b/gi, '$1 metri'],
  [/(\d)\s*h\b/gi, '$1 ore'],
  [/(\d)\s*min\b/gi, '$1 minuti'],
]

const SYMBOLS: [RegExp, string][] = [
  [/€/g, ' euro'],
  [/%/g, ' per cento'],
  [/×/g, ' per '],
  [/\+/g, ' più '],
  [/=/g, ' uguale '],
  [/&/g, ' e '],
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Applica il dizionario di pronuncia. Il contesto è valutato sull'intero testo
 * della frase: è una euristica, non un'analisi grammaticale.
 */
export function applyPronunciation(text: string, entries: PronunciationEntry[] = DEFAULT_PRONUNCIATION): string {
  let output = text
  for (const entry of entries) {
    if (!entry.word || !entry.spoken) continue
    const word = entry.word.trim()
    if (!word) continue
    if (entry.context) {
      let applies = false
      try {
        applies = new RegExp(entry.context, 'i').test(output)
      } catch {
        applies = false
      }
      if (!applies) continue
    }
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi')
    output = output.replace(pattern, (match) => (match[0] === match[0].toUpperCase() ? capitalize(entry.spoken) : entry.spoken))
  }
  return output
}

/**
 * Trasforma il testo scritto nella frase da pronunciare.
 * - numeri, decimali, migliaia → parole
 * - sigle e unità di misura → parole
 * - simboli → parole
 * - omografi → forma disambiguata (solo per la sintesi)
 * Il testo restituito non contiene mai marcature visibili all'utente.
 */
export function normalizeForSpeech(
  input: string,
  options: { pronunciation?: PronunciationEntry[]; addFinalStop?: boolean } = {},
): string {
  if (!input) return ''
  let text = input.replace(/\s+/g, ' ').trim()
  if (!text) return ''

  // Caratteri non pronunciabili: emoji, simboli decorativi, markdown leggero.
  text = text.replace(/[*_`~]/g, ' ').replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}]/gu, ' ')

  for (const [pattern, replacement] of ABBREVIATIONS) text = text.replace(pattern, replacement)
  for (const [pattern, replacement] of MEASURES) text = text.replace(pattern, replacement)
  for (const [pattern, replacement] of SYMBOLS) text = text.replace(pattern, replacement)

  text = text.replace(/\d+(?:[.,]\d+)*/g, (match) => readNumber(match))
  text = applyPronunciation(text, options.pronunciation ?? DEFAULT_PRONUNCIATION)
  text = text.replace(/\s+/g, ' ').trim()

  // Punteggiatura: nessuno spazio prima, uno dopo.
  text = text.replace(/\s+([,.!?;:])/g, '$1').replace(/([,;:])(?=\S)/g, '$1 ').trim()

  // Pause tra frasi consecutive senza punteggiatura finale: "Ciao Marco"
  // pronunciato di seguito risulta più comprensibile con una chiusura.
  const addFinalStop = options.addFinalStop ?? true
  if (addFinalStop && !/[.!?…]$/.test(text) && text.includes(' ')) text = `${text}.`

  return text.replace(/\s+/g, ' ').trim()
}
