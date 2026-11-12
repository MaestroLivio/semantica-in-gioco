import stimuli from './stimuli.json'
import { pictogramUrl } from './lexicon'

type StimulusEntry = { pictogram?: number }
const STIMULI = stimuli as Record<string, StimulusEntry>

/** Lingua dei testi dell'interfaccia (i contenuti lessicali sono separati). */
export type UiLanguage = 'it' | 'en'

export interface CoreWord {
  id: string
  label: string
  labelEn: string
  category: 'richiesta' | 'rifiuto' | 'regolazione' | 'emozione' | 'informazione'
  image?: string
  speech: string
  speechEn: string
}

function img(key: string): string | undefined {
  const entry = STIMULI[key]
  return entry?.pictogram ? pictogramUrl(entry.pictogram) : undefined
}

/**
 * Nove parole funzionali sempre disponibili, anche dentro gli esercizi.
 * `speech` è la forma pronunciata in italiano, `speechEn` quella inglese:
 * la barra CAA deve essere usabile anche quando l'interfaccia è in inglese.
 */
export const CORE_WORDS: CoreWord[] = [
  { id: 'caa-voglio', label: 'Voglio', labelEn: 'I want', category: 'richiesta', image: img('caa-voglio'), speech: 'Voglio', speechEn: 'I want' },
  { id: 'caa-non-voglio', label: 'Non voglio', labelEn: "I don't want", category: 'rifiuto', image: img('caa-non-voglio'), speech: 'Non voglio', speechEn: "I don't want" },
  { id: 'caa-ancora', label: 'Ancora', labelEn: 'More', category: 'richiesta', image: img('caa-ancora'), speech: 'Ancora', speechEn: 'More' },
  { id: 'caa-basta', label: 'Basta', labelEn: 'Stop', category: 'rifiuto', image: img('caa-basta'), speech: 'Basta', speechEn: 'Stop' },
  { id: 'caa-aiuto', label: 'Aiuto', labelEn: 'Help', category: 'richiesta', image: img('caa-aiuto'), speech: 'Aiuto', speechEn: 'Help' },
  { id: 'caa-non-so', label: 'Non so', labelEn: "I don't know", category: 'informazione', image: img('caa-non-so'), speech: 'Non so', speechEn: "I don't know" },
  { id: 'caa-mi-piace', label: 'Mi piace', labelEn: 'I like it', category: 'emozione', image: img('caa-mi-piace'), speech: 'Mi piace', speechEn: 'I like it' },
  { id: 'caa-non-mi-piace', label: 'Non mi piace', labelEn: "I don't like it", category: 'emozione', image: img('caa-non-mi-piace'), speech: 'Non mi piace', speechEn: "I don't like it" },
  { id: 'caa-ripeti', label: 'Ripeti', labelEn: 'Repeat', category: 'regolazione', image: img('caa-ripeti'), speech: 'Ripeti', speechEn: 'Repeat' },
]

export const CORE_WORD_BY_ID = new Map(CORE_WORDS.map((w) => [w.id, w]))

export function coreWordLabel(word: CoreWord, language: UiLanguage): string {
  return language === 'en' ? word.labelEn : word.label
}

export function coreWordSpeech(word: CoreWord, language: UiLanguage): string {
  return language === 'en' ? word.speechEn : word.speech
}

/** Frasi rapide che combinano una parola funzionale con il concetto corrente. */
export function buildPhrase(words: string[], subject?: string, language: UiLanguage = 'it'): string {
  const parts = words.map((id) => {
    const word = CORE_WORD_BY_ID.get(id)
    return word ? coreWordSpeech(word, language) : id
  })
  if (subject) parts.push(subject)
  return parts.join(' ')
}
