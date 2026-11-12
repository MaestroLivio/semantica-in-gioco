import { Btn } from './components'
import { useI18n } from '../i18n'
import { useUpdates } from '../state/updates'

/**
 * Avviso non invasivo quando un aggiornamento è in download o pronto.
 * Non copre il contenuto: durante un esercizio il bambino continua a lavorare.
 */
export function UpdateNotice() {
  const { t } = useI18n()
  const { state, install } = useUpdates()

  if (!state) return null
  if (state.status !== 'downloading' && state.status !== 'ready' && state.status !== 'installing') return null

  const version = state.version ?? ''
  const text =
    state.status === 'downloading'
      ? t('update.downloading', { version, progress: state.progress })
      : state.status === 'installing'
        ? t('update.installing')
        : t('update.ready', { version })

  return (
    <div className="update-notice" role="status" aria-live="polite">
      <p>{text}</p>
      {state.status === 'ready' && (
        <Btn size="sm" onClick={() => void install()}>
          {t('update.install')}
        </Btn>
      )}
    </div>
  )
}
