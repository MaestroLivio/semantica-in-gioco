import { useEffect, useState } from 'react'
import { useStore } from '../state/store'
import { Btn, Card, Range, Segmented, Toggle } from './components'
import {
  audioCacheStats,
  clearAudioCache,
  neuralInstalled,
  prepareSpeech,
  reinstallNeuralVoice,
  speak,
  speechStatus,
  subscribeSpeech,
  NEURAL_LICENSE,
  NEURAL_MODEL_BYTES,
  NEURAL_VOICE_ID,
  type EngineStatus,
} from '../state/speech'
import type { ChildProfile } from '../state/profile'
import { useI18n, type StringKey } from '../i18n'

function formatBytes(bytes: number): string {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`
}

const STATE_KEYS: Record<EngineStatus['state'], StringKey> = {
  idle: 'voice.state.idle',
  loading: 'voice.state.loading',
  ready: 'voice.state.ready',
  error: 'voice.state.error',
  unavailable: 'voice.state.unavailable',
}

const KIND_KEYS: Record<EngineStatus['kind'], StringKey> = {
  neural: 'voice.kind.neural',
  recorded: 'voice.kind.recorded',
  system: 'voice.kind.system',
}

export function SpeechPanel() {
  const { activeProfile, updateProfile } = useStore()
  const { t, language } = useI18n()
  const [status, setStatus] = useState<EngineStatus>(() => speechStatus())
  const [installed, setInstalled] = useState(() => neuralInstalled())
  const [cache, setCache] = useState({ count: 0, bytes: 0 })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => subscribeSpeech(setStatus), [])

  const refreshCache = () => {
    void audioCacheStats().then(setCache)
  }

  useEffect(() => {
    refreshCache()
  }, [])

  if (!activeProfile) return null

  const set = <K extends keyof ChildProfile>(key: K, value: ChildProfile[K]) =>
    updateProfile({ ...activeProfile, [key]: value })

  const install = async () => {
    setBusy(true)
    setNotice(null)
    const ok = await prepareSpeech('neural')
    setInstalled(neuralInstalled())
    setBusy(false)
    setNotice(ok ? t('voice.installOk') : t('voice.installKo'))
    refreshCache()
  }

  const removeModel = async () => {
    setBusy(true)
    await reinstallNeuralVoice()
    setInstalled(false)
    setBusy(false)
    setNotice(t('voice.removed'))
    refreshCache()
  }

  return (
    <Card>
      <h2>{t('voice.title')}</h2>
      <p className="muted">{t('voice.intro', { size: formatBytes(NEURAL_MODEL_BYTES) })}</p>

      <dl className="speech-status" aria-live="polite">
        <div>
          <dt>{t('voice.engineInUse')}</dt>
          <dd>
            {t(KIND_KEYS[status.kind])} · {t(STATE_KEYS[status.state])}
          </dd>
        </div>
        <div>
          <dt>{t('voice.voice')}</dt>
          <dd>{status.voiceLabel}</dd>
        </div>
        <div>
          <dt>{t('voice.model')}</dt>
          <dd>
            {NEURAL_VOICE_ID} ({installed ? t('voice.installed') : t('voice.notInstalled')})
          </dd>
        </div>
        <div>
          <dt>{t('voice.licence')}</dt>
          <dd>{NEURAL_LICENSE}</dd>
        </div>
        <div>
          <dt>{t('voice.offline')}</dt>
          <dd>{status.offlineReady ? t('voice.offline.yes') : t('voice.offline.no')}</dd>
        </div>
        <div>
          <dt>{t('voice.cache')}</dt>
          <dd>
            {cache.count} {t('voice.sentences')} · {formatBytes(cache.bytes)}
          </dd>
        </div>
      </dl>

      {status.message && (
        <p className="muted" role="status">
          {status.message}
        </p>
      )}
      {typeof status.progress === 'number' && status.state === 'loading' && (
        <p className="muted" role="status">
          {t('voice.preparing', { percent: Math.round(status.progress * 100) })}
        </p>
      )}
      {notice && (
        <p className="muted" role="status">
          {notice}
        </p>
      )}

      <Segmented
        label={t('voice.engine')}
        value={activeProfile.ttsEngine}
        onChange={(value) => set('ttsEngine', value)}
        options={[
          { value: 'auto', label: t('voice.engine.auto'), hint: t('voice.engine.auto.hint') },
          { value: 'neural', label: t('voice.engine.neural') },
          { value: 'recorded', label: t('voice.engine.recorded') },
          { value: 'system', label: t('voice.engine.system') },
        ]}
      />

      <div className="actions-row">
        <Btn onClick={install} disabled={busy}>
          {installed ? t('voice.verify') : t('voice.install')}
        </Btn>
        <Btn
          variant="secondary"
          onClick={() => speak(t('settings.tryVoice.text'), { rate: activeProfile.ttsRate })}
        >
          {t('settings.tryVoice')}
        </Btn>
        <Btn
          variant="secondary"
          onClick={() => speak(t('voice.trySlow.text'), { rate: activeProfile.ttsSlowRate })}
        >
          {t('voice.trySlow')}
        </Btn>
        <Btn variant="ghost" onClick={removeModel} disabled={busy}>
          {t('voice.remove')}
        </Btn>
        <Btn variant="ghost" onClick={() => void clearAudioCache().then(refreshCache)}>
          {t('voice.clearCache')}
        </Btn>
      </div>

      <Range
        label={t('voice.slowRate')}
        min={0.5}
        max={0.9}
        step={0.05}
        value={activeProfile.ttsSlowRate}
        onChange={(value) => set('ttsSlowRate', value)}
        format={(value) => `${value.toFixed(2)}×`}
      />
      <Segmented
        label={t('voice.repeats')}
        value={activeProfile.ttsRepeat}
        onChange={(value) => set('ttsRepeat', value)}
        options={[
          { value: 0, label: t('voice.repeats.once') },
          { value: 1, label: t('voice.repeats.twice') },
          { value: 2, label: t('voice.repeats.thrice') },
        ]}
      />
      <Range
        label={t('voice.pauseBefore')}
        min={0}
        max={3000}
        step={250}
        value={activeProfile.ttsPauseBeforeMs}
        onChange={(value) => set('ttsPauseBeforeMs', value)}
        format={(value) => (value ? `${(value / 1000).toFixed(2)} s` : t('voice.none'))}
      />
      <Range
        label={t('voice.pauseAfter')}
        min={0}
        max={3000}
        step={250}
        value={activeProfile.ttsPauseAfterMs}
        onChange={(value) => set('ttsPauseAfterMs', value)}
        format={(value) => (value ? `${(value / 1000).toFixed(2)} s` : t('voice.none'))}
      />
      <Toggle
        label={t('voice.repeatTarget')}
        hint={t('voice.repeatTarget.hint')}
        checked={activeProfile.ttsRepeatTargetOnly}
        onChange={(value) => set('ttsRepeatTargetOnly', value)}
      />
      <Toggle
        label={t('voice.readFeedback')}
        hint={t('voice.readFeedback.hint')}
        checked={activeProfile.ttsReadFeedback}
        onChange={(value) => set('ttsReadFeedback', value)}
      />
      <p className="muted" aria-live="polite">
        {language === 'en' ? 'Language: British English' : 'Lingua: italiano'} · {NEURAL_LICENSE}
      </p>
    </Card>
  )
}
