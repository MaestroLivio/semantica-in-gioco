import { Btn, Card } from '../components'
import { CONCEPTS } from '../../data/lexicon'
import { STORIES } from '../../data/stories'
import { SEMANTIC_MAPS } from '../../data/maps'
import { ENVIRONMENTS } from '../../data/environments'
import { EXERCISE_BANK } from '../../data/bank'
import { CATEGORIES } from '../../data/categories'
import type { Navigate } from '../routes'
import { useI18n } from '../../i18n'

export function About({ onNavigate }: { onNavigate: Navigate }) {
  const { t } = useI18n()

  return (
    <div className="page page--about">
      <h1>{t('about.title')}</h1>

      <Card>
        <h2>{t('about.what.title')}</h2>
        <p>{t('about.what.body')}</p>
        <p>
          <strong>{t('about.what.disclaimer')}</strong>
        </p>
      </Card>

      <Card>
        <h2>{t('about.content.title')}</h2>
        <ul className="plain-list">
          <li>{t('about.content.concepts', { count: CONCEPTS.length })}</li>
          <li>{t('about.content.categories', { count: CATEGORIES.length })}</li>
          <li>{t('about.content.exercises', { count: EXERCISE_BANK.length })}</li>
          <li>{t('about.content.stories', { count: STORIES.length })}</li>
          <li>{t('about.content.maps', { count: SEMANTIC_MAPS.length })}</li>
          <li>{t('about.content.environments', { count: ENVIRONMENTS.length })}</li>
          <li>{t('about.content.structure')}</li>
        </ul>
        <p className="muted">{t('about.content.note')}</p>
      </Card>

      <Card>
        <h2>{t('about.languageContent.title')}</h2>
        <p>{t('about.languageContent.body')}</p>
      </Card>

      <Card>
        <h2>{t('about.pictograms.title')}</h2>
        <p>{t('about.pictograms.body')}</p>
        <ul className="plain-list">
          <li>{t('about.pictograms.attribution')}</li>
          <li>{t('about.pictograms.nonCommercial')}</li>
          <li>{t('about.pictograms.shareAlike')}</li>
          <li>{t('about.pictograms.local')}</li>
        </ul>
        <p className="muted">{t('about.pictograms.personal')}</p>
      </Card>

      <Card>
        <h2>{t('about.privacy.title')}</h2>
        <ul className="plain-list">
          <li>{t('about.privacy.local')}</li>
          <li>{t('about.privacy.noTracking')}</li>
          <li>{t('about.privacy.noAuth')}</li>
          <li>{t('about.privacy.export')}</li>
          <li>{t('about.privacy.minimal')}</li>
          <li>{t('about.privacy.sync')}</li>
        </ul>
      </Card>

      <Card>
        <h2>{t('about.limits.title')}</h2>
        <ul className="plain-list">
          <li>{t('about.limits.speechRecognition')}</li>
          <li>{t('about.limits.tts')}</li>
          <li>{t('about.limits.generated')}</li>
          <li>{t('about.limits.pin')}</li>
        </ul>
      </Card>

      <div className="actions-row">
        <Btn onClick={() => onNavigate({ name: 'home' })}>{t('about.back')}</Btn>
        <Btn variant="secondary" onClick={() => onNavigate({ name: 'teacher' })}>
          {t('about.adults')}
        </Btn>
      </div>
    </div>
  )
}
