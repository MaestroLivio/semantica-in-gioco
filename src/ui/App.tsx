import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { Btn, Modal } from './components'
import { CommunicationBar } from './CommunicationBar'
import { UpdateNotice } from './UpdateNotice'
import type { Navigate, Route } from './routes'
import { Home } from './screens/Home'
import { ChildHome } from './screens/ChildHome'
import { SessionScreen } from './screens/SessionScreen'
import { Teacher } from './screens/Teacher'
import { Explore } from './screens/Explore'
import { Atlas } from './screens/Atlas'
import { Stories } from './screens/Stories'
import { Maps } from './screens/Maps'
import { Settings } from './screens/Settings'
import { About } from './screens/About'
import { setSpeechPreferences } from '../state/speech'
import { setUpdatesBusy } from '../state/updates'
import { LANGUAGES, useI18n } from '../i18n'

export function App() {
  const { activeProfile, global, ready, storageError } = useStore()
  const { t, language, setLanguage, htmlLang } = useI18n()
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [pinPrompt, setPinPrompt] = useState(false)
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [showCaa, setShowCaa] = useState(false)
  const [caaWord, setCaaWord] = useState<string | undefined>(undefined)

  const navigate = useCallback<Navigate>((next) => {
    if (next.name === 'teacher' && global.adultPin) {
      setPinPrompt(true)
      setPinError(null)
      setPinValue('')
      return
    }
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [global.adultPin])

  // La barra CAA è disponibile durante l'esercizio, come richiesto.
  useEffect(() => {
    setShowCaa(route.name === 'session' || route.name === 'stories' || route.name === 'explore')
  }, [route.name])

  // Un aggiornamento pronto non deve chiudere l'app a metà di una sessione.
  useEffect(() => {
    setUpdatesBusy(route.name === 'session')
  }, [route.name])

  // Preferenze audio del profilo: il motore vocale viene scelto qui una volta
  // sola, invece che in ogni schermata. I campi nuovi hanno un valore di
  // riserva per i profili creati prima di questa versione.
  useEffect(() => {
    if (!activeProfile) return
    setSpeechPreferences({
      engine: activeProfile.ttsEngine ?? 'auto',
      rate: activeProfile.ttsRate,
      slowRate: activeProfile.ttsSlowRate ?? 0.65,
      volume: activeProfile.ttsVolume,
      repeat: activeProfile.ttsRepeat ?? 0,
      pauseBeforeMs: activeProfile.ttsPauseBeforeMs ?? 0,
      pauseAfterMs: activeProfile.ttsPauseAfterMs ?? 0,
      repeatTargetOnly: activeProfile.ttsRepeatTargetOnly ?? false,
      readFeedback: activeProfile.ttsReadFeedback ?? true,
      sounds: activeProfile.decorativeSounds,
    })
  }, [activeProfile])

  // La lingua dell'interfaccia è anche la lingua dichiarata all'HTML: serve a
  // screen reader e correttori, e mantiene coerente l'attributo lang.
  useEffect(() => {
    document.documentElement.lang = htmlLang
  }, [htmlLang])

  // Modalità "solo maiuscole": applicata alla radice del documento così vale anche per
  // i livelli sovrapposti e per i testi fuori dal contenitore principale.
  useEffect(() => {
    document.documentElement.classList.toggle('is-uppercase', Boolean(activeProfile?.uppercase))
    return () => document.documentElement.classList.remove('is-uppercase')
  }, [activeProfile?.uppercase])

  const rootClass = useMemo(() => {
    const classes = ['app']
    if (activeProfile?.highContrast) classes.push('is-contrast')
    if (activeProfile?.reducedMotion) classes.push('is-reduced-motion')
    if (activeProfile?.visualMode === 'essenziale') classes.push('is-essential')
    if (activeProfile?.scanMode) classes.push('is-scan')
    return classes.join(' ')
  }, [activeProfile])

  if (!ready) {
    return (
      <div className="boot">
        <h1>Semantica in Gioco</h1>
        <p>{t('app.boot')}</p>
      </div>
    )
  }

  const confirmPin = () => {
    if (pinValue === global.adultPin) {
      setPinPrompt(false)
      setRoute({ name: 'teacher' })
    } else {
      setPinError(t('pin.error'))
    }
  }

  return (
    <div className={rootClass}>
      <a className="skip-link" href="#main">
        {t('app.skipLink')}
      </a>
      <header className="app-header">
        <button className="brand" type="button" onClick={() => navigate({ name: activeProfile ? 'child' : 'home' })}>
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="40" height="40" role="img" aria-label="">
              <rect x="2" y="2" width="44" height="44" rx="12" fill="#f6f2e9" stroke="#25304a" strokeWidth="2" />
              <path d="M24 12v10M24 24l-8 8M24 24l8 8M24 24v10" stroke="#25304a" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="12" r="4" fill="#3f7d6e" />
              <circle cx="15" cy="33" r="3.4" fill="#e2a03f" />
              <circle cx="33" cy="33" r="3.4" fill="#5b7fb8" />
            </svg>
          </span>
          <span className="brand__text">
            <strong>Semantica in Gioco</strong>
            <small>{t('app.tagline')}</small>
          </span>
        </button>

        <nav className="app-nav" aria-label={t('app.nav.main')}>
          <span className="lang-switch" role="group" aria-label={t('app.language')}>
            {LANGUAGES.map((entry) => (
              <Btn
                key={entry.id}
                variant={language === entry.id ? 'secondary' : 'ghost'}
                size="sm"
                ariaLabel={`${t('app.language.change')}: ${entry.label}`}
                title={entry.label}
                onClick={() => setLanguage(entry.id)}
              >
                {entry.id.toUpperCase()}
              </Btn>
            ))}
          </span>
          {activeProfile && (
            <span className="profile-chip" style={{ borderColor: activeProfile.color }}>
              <span className="profile-chip__dot" style={{ background: activeProfile.color }} aria-hidden="true" />
              {activeProfile.nickname}
            </span>
          )}
          {activeProfile && (
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => navigate({ name: 'settings' })}
              ariaLabel={t('app.nav.accessibility')}
            >
              {t('app.nav.accessibility')}
            </Btn>
          )}
          <Btn variant="ghost" size="sm" onClick={() => navigate({ name: 'about' })} ariaLabel={t('app.nav.info')}>
            {t('app.nav.info')}
          </Btn>
          <Btn variant="secondary" size="sm" onClick={() => navigate({ name: 'teacher' })} ariaLabel={t('app.nav.adults')}>
            {t('app.nav.adults')}
          </Btn>
        </nav>
      </header>

      <UpdateNotice />

      {storageError && (
        <div className="alert" role="alert">
          {storageError} {t('app.storage.error')}
        </div>
      )}

      <main id="main" className="app-main">
        {route.name === 'home' && <Home onNavigate={navigate} />}
        {route.name === 'child' && <ChildHome onNavigate={navigate} />}
        {route.name === 'session' && (
          <SessionScreen
            request={route.request}
            label={route.label}
            fixed={route.exercises}
            onExit={() => navigate({ name: 'child' })}
            onRestart={() => navigate({ name: 'session', request: route.request, label: route.label })}
            onNavigate={navigate}
            onCurrentWord={setCaaWord}
          />
        )}
        {route.name === 'teacher' && <Teacher onNavigate={navigate} />}
        {route.name === 'explore' && <Explore envId={route.envId} onNavigate={navigate} />}
        {route.name === 'atlas' && <Atlas onNavigate={navigate} />}
        {route.name === 'stories' && <Stories storyId={route.storyId} onNavigate={navigate} />}
        {route.name === 'maps' && <Maps mapId={route.mapId} onNavigate={navigate} />}
        {route.name === 'settings' && <Settings onNavigate={navigate} />}
        {route.name === 'about' && <About onNavigate={navigate} />}
      </main>

      {showCaa && (
        <CommunicationBar
          currentWord={caaWord}
          rate={activeProfile?.ttsRate}
          volume={activeProfile?.ttsVolume}
          showLabels={activeProfile ? activeProfile.showText : true}
        />
      )}

      <footer className="app-footer">
        <p>{t('app.footer.disclaimer')}</p>
        <p className="muted">{t('app.footer.privacy')}</p>
      </footer>

      <Modal open={pinPrompt} onClose={() => setPinPrompt(false)} title={t('pin.title')}>
        <p>{t('pin.prompt')}</p>
        <label className="field">
          <span>{t('pin.label')}</span>
          <input
            type="password"
            inputMode="numeric"
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmPin()
            }}
            autoFocus
          />
        </label>
        {pinError && (
          <p className="error-text" role="alert">
            {pinError}
          </p>
        )}
        <div className="exercise__actions">
          <Btn onClick={confirmPin}>{t('pin.enter')}</Btn>
          <Btn variant="ghost" onClick={() => setPinPrompt(false)}>
            {t('pin.cancel')}
          </Btn>
        </div>
        <p className="muted">{t('pin.note')}</p>
      </Modal>
    </div>
  )
}
