import { useEffect, useState } from 'react'
import { useStore } from '../../state/store'
import { Btn, Card, Range, Segmented, Toggle } from '../components'
import { listVoices, hasItalianVoice, speak } from '../../state/speech'
import { SpeechPanel } from '../SpeechPanel'
import type { Navigate } from '../routes'
import type { ChildProfile } from '../../state/profile'
import { LANGUAGES, useI18n } from '../../i18n'

export function Settings({ onNavigate }: { onNavigate: Navigate }) {
  const { activeProfile, updateProfile } = useStore()
  const { t, language, setLanguage } = useI18n()
  const [voices, setVoices] = useState(listVoices())

  useEffect(() => {
    const timer = window.setInterval(() => setVoices(listVoices()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!activeProfile) {
    return (
      <div className="page">
        <p>{t('settings.noProfile')}</p>
        <Btn onClick={() => onNavigate({ name: 'home' })}>{t('about.back')}</Btn>
      </div>
    )
  }

  const set = <K extends keyof ChildProfile>(key: K, value: ChildProfile[K]) =>
    updateProfile({ ...activeProfile, [key]: value })
  const italian = hasItalianVoice()

  return (
    <div className="page page--settings">
      <h1>{t('settings.title')}</h1>
      <p className="muted">{t('settings.intro', { name: activeProfile.nickname })}</p>

      {!italian && (
        <div className="alert" role="alert">
          <strong>{t('settings.voiceMissing.title')}</strong> {t('settings.voiceMissing.body')}
        </div>
      )}

      <div className="settings-grid">
        <Card>
          <h2>{t('settings.section.language')}</h2>
          <Segmented
            label={t('app.language')}
            value={language}
            onChange={setLanguage}
            options={LANGUAGES.map((entry) => ({ value: entry.id, label: entry.label }))}
          />
          <p className="muted">{t('settings.language.note')}</p>
        </Card>

        <Card>
          <h2>{t('settings.section.communication')}</h2>
          <Segmented
            label={t('settings.communicationMode')}
            value={activeProfile.communicationMode}
            onChange={(v) => set('communicationMode', v)}
            options={[
              { value: 'touch', label: t('settings.mode.touch') },
              { value: 'caa', label: t('settings.mode.caa') },
              { value: 'verbale', label: t('settings.mode.verbal') },
              { value: 'misto', label: t('settings.mode.mixed') },
            ]}
          />
          <Toggle
            label={t('settings.showText')}
            hint={t('settings.showText.hint')}
            checked={activeProfile.showText}
            onChange={(v) => set('showText', v)}
          />
          <Toggle
            label={t('settings.symbolLabels')}
            hint={t('settings.symbolLabels.hint')}
            checked={activeProfile.symbolLabels}
            onChange={(v) => set('symbolLabels', v)}
          />
          <Segmented
            label={t('settings.alternatives')}
            value={activeProfile.alternatives}
            onChange={(v) => set('alternatives', v)}
            options={[
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
              { value: 6, label: '6' },
            ]}
          />
          <Toggle
            label={t('settings.scan')}
            hint={t('settings.scan.hint')}
            checked={activeProfile.scanMode}
            onChange={(v) => set('scanMode', v)}
          />
          <Segmented
            label={t('settings.motor')}
            value={activeProfile.motorMode}
            onChange={(v) => set('motorMode', v)}
            options={[
              { value: 'tap', label: t('settings.motor.tap') },
              { value: 'drag', label: t('settings.motor.drag') },
              { value: 'both', label: t('settings.motor.both') },
            ]}
          />
        </Card>

        <Card>
          <h2>{t('settings.section.appearance')}</h2>
          <Segmented
            label={t('settings.visualMode')}
            value={activeProfile.visualMode}
            onChange={(v) => set('visualMode', v)}
            options={[
              { value: 'essenziale', label: t('settings.visual.essential') },
              { value: 'standard', label: t('settings.visual.standard') },
              { value: 'esplorazione', label: t('settings.visual.exploration') },
            ]}
          />
          <p className="muted">{t('settings.visual.note')}</p>
          <Toggle
            label={t('settings.highContrast')}
            checked={activeProfile.highContrast}
            onChange={(v) => set('highContrast', v)}
          />
          <Toggle
            label={t('settings.reducedMotion')}
            checked={activeProfile.reducedMotion}
            onChange={(v) => set('reducedMotion', v)}
          />
          <Toggle
            label={t('settings.uppercase')}
            hint={t('settings.uppercase.hint')}
            checked={activeProfile.uppercase}
            onChange={(v) => set('uppercase', v)}
          />
          <Segmented
            label={t('settings.sessionLength')}
            value={activeProfile.sessionLength}
            onChange={(v) => set('sessionLength', v)}
            options={[
              { value: 5, label: `5 ${t('settings.activities')}` },
              { value: 8, label: `8 ${t('settings.activities')}` },
              { value: 12, label: `12 ${t('settings.activities')}` },
            ]}
          />
        </Card>

        <Card>
          <h2>{t('settings.section.audio')}</h2>
          <Range
            label={t('settings.rate')}
            min={0.6}
            max={1.2}
            step={0.05}
            value={activeProfile.ttsRate}
            onChange={(v) => set('ttsRate', v)}
            format={(v) => `${v.toFixed(2)}×`}
          />
          <Range
            label={t('settings.volume')}
            min={0}
            max={1}
            step={0.1}
            value={activeProfile.ttsVolume}
            onChange={(v) => set('ttsVolume', v)}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="muted">
            {t('settings.voices', { count: voices.length })}
            {italian ? t('settings.voices.withItalian') : t('settings.voices.withoutItalian')}
            {t('settings.voices.note')}
          </p>
          <div className="actions-row">
            <Btn
              variant="secondary"
              onClick={() =>
                speak(t('settings.tryVoice.text'), {
                  rate: activeProfile.ttsRate,
                  volume: activeProfile.ttsVolume,
                })
              }
            >
              {t('settings.tryVoice')}
            </Btn>
          </div>
          <Toggle
            label={t('settings.autoAudio')}
            checked={activeProfile.autoAudio}
            onChange={(v) => set('autoAudio', v)}
          />
          <Toggle
            label={t('settings.decorativeSounds')}
            hint={t('settings.decorativeSounds.hint')}
            checked={activeProfile.decorativeSounds}
            onChange={(v) => set('decorativeSounds', v)}
          />
        </Card>

        <SpeechPanel />

        <Card>
          <h2>{t('settings.section.learning')}</h2>
          <Toggle
            label={t('settings.autoAdaptive')}
            hint={t('settings.autoAdaptive.hint')}
            checked={activeProfile.autoAdaptive}
            onChange={(v) => set('autoAdaptive', v)}
          />
          <Segmented
            label={t('settings.cues')}
            value={activeProfile.cues}
            onChange={(v) => set('cues', v)}
            options={[
              { value: 'nessuno', label: t('settings.cues.none') },
              { value: 'leggeri', label: t('settings.cues.light') },
              { value: 'completi', label: t('settings.cues.full') },
            ]}
          />
          <Range
            label={t('settings.masterySessions')}
            min={1}
            max={4}
            value={activeProfile.masterySessions}
            onChange={(v) => set('masterySessions', v)}
          />
          <Range
            label={t('settings.masteryKinds')}
            min={1}
            max={5}
            value={activeProfile.masteryKinds}
            onChange={(v) => set('masteryKinds', v)}
          />
          <Range
            label={t('settings.masteryAccuracy')}
            min={0.5}
            max={1}
            step={0.05}
            value={activeProfile.masteryAccuracy}
            onChange={(v) => set('masteryAccuracy', v)}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="muted">{t('settings.mastery.note')}</p>
        </Card>
      </div>

      <div className="actions-row">
        <Btn onClick={() => onNavigate({ name: 'child' })}>{t('settings.backToActivities')}</Btn>
        <Btn variant="secondary" onClick={() => onNavigate({ name: 'teacher' })}>
          {t('settings.toAdults')}
        </Btn>
      </div>
    </div>
  )
}
