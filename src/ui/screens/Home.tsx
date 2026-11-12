import { useState } from 'react'
import { useStore } from '../../state/store'
import { Btn, Card } from '../components'
import { Picture } from '../Picture'
import { CONCEPT_BY_ID, primaryImage } from '../../data/lexicon'
import type { Navigate } from '../routes'
import { useI18n, type StringKey } from '../../i18n'

const HERO_IDS = ['cane', 'mela', 'sedia', 'sole']

const MODE_KEYS: Record<string, StringKey> = {
  touch: 'settings.mode.touch',
  caa: 'settings.mode.caa',
  verbale: 'settings.mode.verbal',
  misto: 'settings.mode.mixed',
}

export function Home({ onNavigate }: { onNavigate: Navigate }) {
  const { profiles, addProfile, selectProfile, activeProfileId } = useStore()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(profiles.length === 0)

  return (
    <div className="page page--home">
      <section className="hero">
        <div className="hero__text">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>Semantica in Gioco</h1>
          <p className="hero__lead">{t('home.lead')}</p>
          <div className="hero__actions">
            {profiles.length > 0 && (
              <Btn
                variant="primary"
                size="lg"
                onClick={() => {
                  if (!activeProfileId && profiles[0]) selectProfile(profiles[0].id)
                  onNavigate({ name: 'child' })
                }}
              >
                {t('home.start')}
              </Btn>
            )}
            <Btn variant="secondary" size="lg" onClick={() => onNavigate({ name: 'teacher' })}>
              {t('home.adults')}
            </Btn>
          </div>
        </div>
        <div className="hero__art">
          <div className="hero__pictures" aria-hidden="true">
            {HERO_IDS.map((id, index) => {
              const concept = CONCEPT_BY_ID.get(id)
              if (!concept) return null
              return (
                <Picture
                  key={id}
                  src={primaryImage(concept)}
                  alt=""
                  size={index % 2 === 0 ? 'lg' : 'md'}
                  className={`hero__picture hero__picture--${index}`}
                />
              )
            })}
          </div>
        </div>
      </section>

      <section className="profiles" aria-labelledby="profiles-title">
        <h2 id="profiles-title">{t('home.profiles')}</h2>
        <p className="muted">{t('home.profiles.note')}</p>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={`profile-card ${activeProfileId === profile.id ? 'is-active' : ''}`}
              onClick={() => {
                selectProfile(profile.id)
                onNavigate({ name: 'child' })
              }}
            >
              <span className="profile-card__avatar" style={{ background: profile.color }} aria-hidden="true">
                {profile.nickname.slice(0, 1).toUpperCase()}
              </span>
              <span className="profile-card__name">{profile.nickname}</span>
              <span className="profile-card__meta">
                {profile.ageBand} {t('home.ageBand')} · {t(MODE_KEYS[profile.communicationMode] ?? 'settings.mode.touch')}
              </span>
            </button>
          ))}
          <button type="button" className="profile-card profile-card--new" onClick={() => setCreating(true)}>
            <span className="profile-card__avatar" aria-hidden="true">
              +
            </span>
            <span className="profile-card__name">{t('home.newProfile')}</span>
            <span className="profile-card__meta">{t('home.pseudonym')}</span>
          </button>
        </div>

        {creating && (
          <Card className="profile-form">
            <h3>{t('home.create.title')}</h3>
            <label className="field">
              <span>{t('home.create.label')}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('home.pseudonym')}
                maxLength={24}
                autoFocus
              />
            </label>
            <p className="muted">{t('home.create.note')}</p>
            <div className="actions-row">
              <Btn
                onClick={() => {
                  if (!name.trim()) return
                  addProfile(name)
                  setName('')
                  setCreating(false)
                  onNavigate({ name: 'child' })
                }}
                disabled={!name.trim()}
              >
                {t('home.create.submit')}
              </Btn>
              {profiles.length > 0 && (
                <Btn variant="ghost" onClick={() => setCreating(false)}>
                  {t('common.cancel')}
                </Btn>
              )}
            </div>
          </Card>
        )}
      </section>

      <section className="principles" aria-labelledby="principles-title">
        <h2 id="principles-title">{t('home.principles')}</h2>
        <div className="principle-grid">
          <Card className="principle">
            <h3>{t('home.principle.skill.title')}</h3>
            <p>{t('home.principle.skill.body')}</p>
          </Card>
          <Card className="principle">
            <h3>{t('home.principle.noSpeech.title')}</h3>
            <p>{t('home.principle.noSpeech.body')}</p>
          </Card>
          <Card className="principle">
            <h3>{t('home.principle.errors.title')}</h3>
            <p>{t('home.principle.errors.body')}</p>
          </Card>
          <Card className="principle">
            <h3>{t('home.principle.offline.title')}</h3>
            <p>{t('home.principle.offline.body')}</p>
          </Card>
        </div>
      </section>
    </div>
  )
}
