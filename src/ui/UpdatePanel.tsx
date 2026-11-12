import { Btn, Card, Toggle } from './components'
import { useI18n, type StringKey } from '../i18n'
import { useUpdates, type UpdateState } from '../state/updates'

function statusText(state: UpdateState, t: (key: StringKey, vars?: Record<string, string | number>) => string) {
  const version = state.version ?? ''
  switch (state.status) {
    case 'checking':
      return t('update.checking')
    case 'up-to-date':
      return t('update.upToDate', { version: state.currentVersion })
    case 'available':
      return t('update.available', { version })
    case 'downloading':
      return t('update.downloading', { version, progress: state.progress })
    case 'ready':
      return t('update.ready', { version })
    case 'installing':
      return t('update.installing')
    case 'unsupported':
      return t('update.unsupported', { version, platform: state.platform, arch: state.arch })
    case 'error':
      return t('update.error', { message: state.error ?? '' })
    default:
      return t('update.idle')
  }
}

/**
 * Pannello per l'adulto: mostra la versione installata, permette di controllare
 * a mano e di scegliere se installare senza conferma all'avvio.
 * Nel browser (build statica) non compare: non c'è un installer da aprire.
 */
export function UpdatePanel() {
  const { t } = useI18n()
  const { bridge, state, autoInstall, check, install, toggleAutoInstall, openRelease } = useUpdates()

  if (!bridge) return null

  return (
    <Card>
      <h2>{t('update.title')}</h2>
      <p>{t('update.version', { version: state?.currentVersion ?? '—' })}</p>
      <p className="muted" aria-live="polite">
        {state ? statusText(state, t) : t('update.idle')}
      </p>
      <div className="actions-row">
        <Btn
          variant="secondary"
          onClick={() => void check()}
          disabled={state?.status === 'checking' || state?.status === 'downloading'}
        >
          {t('update.check')}
        </Btn>
        {state?.status === 'ready' && (
          <Btn onClick={() => void install()}>{t('update.install')}</Btn>
        )}
        {state?.notesUrl && (
          <Btn variant="ghost" onClick={() => openRelease(state.notesUrl)}>
            {t('update.notes')}
          </Btn>
        )}
      </div>
      <Toggle
        label={t('update.autoInstall')}
        hint={t('update.autoInstall.hint')}
        checked={autoInstall}
        onChange={(value) => void toggleAutoInstall(value)}
      />
    </Card>
  )
}
