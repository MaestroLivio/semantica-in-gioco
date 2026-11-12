// Accesso alle traduzioni. La lingua è una preferenza del dispositivo
// (GlobalSettings.language), non del singolo bambino: cambiarla non tocca
// profili, tentativi o contenuti.

import { useCallback, useMemo } from 'react'
import { useStore } from '../state/store'
import { LANGUAGES, STRINGS, type Language, type StringKey } from './strings'

export type { Language, StringKey }
export { LANGUAGES, STRINGS }

const FALLBACK: Language = 'it'

export function isLanguage(value: unknown): value is Language {
  return value === 'it' || value === 'en'
}

/** Traduce una chiave, sostituendo i segnaposto `{nome}`. */
export function translate(
  language: Language,
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  const entry = STRINGS[key]
  const template = entry?.[language] ?? entry?.[FALLBACK] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

export function languageMeta(language: Language) {
  return LANGUAGES.find((entry) => entry.id === language) ?? LANGUAGES[0]
}

export interface I18n {
  language: Language
  /** Codice BCP 47 per l'attributo lang dell'HTML. */
  htmlLang: string
  t: (key: StringKey, vars?: Record<string, string | number>) => string
  setLanguage: (language: Language) => void
}

/** Hook principale: legge la lingua dalle impostazioni globali dello store. */
export function useI18n(): I18n {
  const { global, updateGlobal } = useStore()
  const language: Language = isLanguage(global.language) ? global.language : FALLBACK

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  )

  const setLanguage = useCallback(
    (next: Language) => updateGlobal({ language: next }),
    [updateGlobal],
  )

  return useMemo(
    () => ({ language, htmlLang: languageMeta(language).htmlLang, t, setLanguage }),
    [language, t, setLanguage],
  )
}
