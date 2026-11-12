import { useEffect, useState } from 'react'
import { CORE_WORDS, buildPhrase, coreWordLabel, coreWordSpeech } from '../data/caa'
import { speak } from '../state/speech'
import { Btn } from './components'
import { useI18n } from '../i18n'

interface CommunicationBarProps {
  /** Parola corrente utile da aggiungere alla frase (es. il concetto dell'esercizio). */
  currentWord?: string
  onCommunicate?: (phrase: string) => void
  rate?: number
  volume?: number
  voiceURI?: string | null
  showLabels?: boolean
}

/**
 * Barra comunicativa sempre disponibile. Funziona anche senza saper leggere:
 * ogni simbolo ha audio e la frase composta può essere pronunciata dal sistema.
 */
export function CommunicationBar({
  currentWord,
  onCommunicate,
  rate,
  volume,
  voiceURI,
  showLabels = true,
}: CommunicationBarProps) {
  const { t, language } = useI18n()
  const [open, setOpen] = useState(false)
  const [phrase, setPhrase] = useState<string[]>([])
  const [pressed, setPressed] = useState<string | null>(null)

  useEffect(() => {
    if (!pressed) return
    const timer = window.setTimeout(() => setPressed(null), 220)
    return () => window.clearTimeout(timer)
  }, [pressed])

  const addWord = (id: string, speech: string) => {
    setPhrase((prev) => (prev.length >= 8 ? [...prev.slice(1), id] : [...prev, id]))
    setPressed(id)
    speak(speech, { rate, volume, voiceURI })
  }

  const spoken = buildPhrase(phrase, currentWord, language)

  return (
    <div className={`caa-bar ${open ? 'is-open' : ''}`}>
      <div className="caa-bar__toggle">
        <Btn
          variant="secondary"
          size="sm"
          ariaLabel={open ? t('caa.close') : t('caa.open')}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('caa.hide') : t('caa.show')}
        </Btn>
        {!open && currentWord && (
          <Btn
            variant="ghost"
            size="sm"
            ariaLabel={t('caa.repeatWord', { word: currentWord })}
            onClick={() => speak(currentWord, { rate, volume, voiceURI })}
          >
            {currentWord}
          </Btn>
        )}
      </div>

      {open && (
        <>
          <div className="caa-bar__words" role="group" aria-label={t('caa.words')}>
            {CORE_WORDS.map((word) => (
              <button
                key={word.id}
                type="button"
                className={`caa-word ${pressed === word.id ? 'is-pressed' : ''}`}
                onClick={() => addWord(word.id, coreWordSpeech(word, language))}
                aria-label={`${coreWordLabel(word, language)}. ${t('caa.add')}.`}
              >
                <span className="caa-word__symbol" aria-hidden={!word.image}>
                  {word.image ? (
                    <img src={word.image} alt="" loading="lazy" />
                  ) : (
                    <span className="caa-word__fallback">{coreWordLabel(word, language).slice(0, 1)}</span>
                  )}
                </span>
                {showLabels && <span className="caa-word__label">{coreWordLabel(word, language)}</span>}
              </button>
            ))}
            {currentWord && (
              <button
                type="button"
                className="caa-word caa-word--concept"
                onClick={() => {
                  setPressed('concept')
                  setPhrase((prev) => (prev.length >= 8 ? [...prev.slice(1), currentWord] : [...prev, currentWord]))
                  speak(currentWord, { rate, volume, voiceURI })
                }}
                aria-label={`${currentWord}. ${t('caa.add')}.`}
              >
                <span className="caa-word__symbol caa-word__fallback" aria-hidden="true">
                  {currentWord.slice(0, 1).toUpperCase()}
                </span>
                {showLabels && <span className="caa-word__label">{currentWord}</span>}
              </button>
            )}
          </div>

          <div className="caa-bar__phrase" aria-live="polite">
            <span className="caa-bar__phrase-label">{t('caa.phrase')}</span>
            <span className="caa-bar__phrase-text">{spoken || '—'}</span>
            <Btn
              variant="primary"
              size="sm"
              disabled={!phrase.length && !currentWord}
              onClick={() => {
                speak(spoken, { rate, volume, voiceURI })
                onCommunicate?.(spoken)
              }}
              ariaLabel={t('caa.speakAria')}
            >
              {t('caa.speak')}
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              disabled={!phrase.length}
              onClick={() => setPhrase((prev) => prev.slice(0, -1))}
              ariaLabel={t('caa.deleteLast')}
              icon="back"
            >
              {t('caa.delete')}
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              disabled={!phrase.length}
              onClick={() => setPhrase([])}
              ariaLabel={t('caa.clearAria')}
            >
              {t('caa.clear')}
            </Btn>
          </div>
        </>
      )}
    </div>
  )
}
