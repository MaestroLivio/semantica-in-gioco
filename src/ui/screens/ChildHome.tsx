import { useMemo, useState } from 'react'
import { useStore, reviewItemsFromStats } from '../../state/store'
import { MODULES, moduleTitleIn } from '../../data/modules'
import { ENVIRONMENTS } from '../../data/environments'
import { STORIES } from '../../data/stories'
import { SEMANTIC_MAPS } from '../../data/maps'
import { CONCEPT_BY_ID, primaryImage } from '../../data/lexicon'
import { buildReviewQueue } from '../../engine/srs'
import { statusOf } from '../../engine/adaptive'
import { conceptOfTheDay, nextStepRecommendation } from '../../engine/pedagogy'
import { conceptLesson } from '../../engine/generator'
import type { Level } from '../../engine/types'
import type { SessionRequest } from '../../engine/session'
import { Btn, Card, Modal, SpeakInline } from '../components'
import { speak } from '../../state/speech'
import { Picture } from '../Picture'
import { WordCard } from '../WordCard'
import type { Navigate } from '../routes'
import { useI18n } from '../../i18n'

export function ChildHome({ onNavigate }: { onNavigate: Navigate }) {
  const { activeProfile, stats, sessions } = useStore()
  const { t, language } = useI18n()
  const [moduleForLevel, setModuleForLevel] = useState<string | null>(null)
  const [level, setLevel] = useState<Level>(2)
  const [wordOfDayOpen, setWordOfDayOpen] = useState(false)
  // Menu a gruppi: una sola area aperta per volta, così la home resta corta.
  const [openGroup, setOpenGroup] = useState<'words' | 'relations' | 'labs' | 'world'>('words')

  const dueList = useMemo(() => {
    if (!activeProfile) return []
    const items = reviewItemsFromStats(stats, activeProfile.reviewIntervals)
    return buildReviewQueue(items, [...stats.values()], Date.now(), 10)
  }, [activeProfile, stats])

  // Il prossimo passo didattico: una sola proposta, con la ragione scritta.
  const nextStep = useMemo(
    () =>
      activeProfile
        ? nextStepRecommendation([...stats.values()], {
            sessions: activeProfile.masterySessions,
            kinds: activeProfile.masteryKinds,
            accuracy: activeProfile.masteryAccuracy,
            independent: activeProfile.masteryIndependent,
          })
        : null,
    [activeProfile, stats],
  )

  const wordOfDay = useMemo(
    () => (activeProfile ? conceptOfTheDay(activeProfile.id) : undefined),
    [activeProfile?.id],
  )

  if (!activeProfile) {
    return (
      <div className="page">
        <h1>{t('child.noProfile.title')}</h1>
        <p>{t('child.noProfile.body')}</p>
        <Btn onClick={() => onNavigate({ name: 'home' })}>{t('about.back')}</Btn>
      </div>
    )
  }

  const discovered = [...stats.values()].filter((s) => s.exposures > 0)
  const moduleStats = (moduleId: string) => [...stats.values()].filter((s) => s.modules.includes(moduleId))

  const startModule = (moduleId: string, chosenLevel: Level) => {
    const module = MODULES.find((m) => m.id === moduleId)
    if (!module) return
    if (moduleId === 'm19') {
      onNavigate({ name: 'maps' })
      return
    }
    if (moduleId === 'm20') {
      onNavigate({ name: 'stories' })
      return
    }
    const request: SessionRequest = {
      moduleIds: [moduleId],
      level: chosenLevel,
      count: activeProfile.sessionLength,
      mode: 'misto',
    }
    onNavigate({ name: 'session', request, label: moduleTitleIn(module, language) })
  }

  const startNextStep = () => {
    if (!activeProfile || !nextStep) return
    onNavigate({
      name: 'session',
      request: {
        moduleIds: nextStep.moduleIds,
        level: nextStep.level,
        count:
          nextStep.action === 'riprendere'
            ? Math.min(activeProfile.sessionLength, Math.max(3, nextStep.conceptIds.length))
            : activeProfile.sessionLength,
        mode: nextStep.mode,
        targetConceptIds: nextStep.conceptIds,
      },
      label: nextStep.title,
    })
  }

  const startReview = () => {
    if (!dueList.length) return
    onNavigate({
      name: 'session',
      request: {
        moduleIds: ['m1', 'm2', 'm5', 'm15'],
        level: 3,
        count: Math.min(activeProfile.sessionLength, dueList.length),
        mode: 'ripasso',
        targetConceptIds: dueList.map((d) => d.conceptId),
      },
      label: t('child.review.label'),
    })
  }

  return (
    <div className="page page--child">
      <section className="child-hero" aria-labelledby="child-title">
        <div>
          <p className="eyebrow">{t('child.greeting', { name: activeProfile.nickname })}</p>
          <div className="heading-with-speak">
            <h1 id="child-title">{t('child.title')}</h1>
            <SpeakInline
              text={t('child.summary', {
                name: activeProfile.nickname,
                words: discovered.length,
                sessions: sessions.length,
              })}
              rate={activeProfile.ttsRate}
              volume={activeProfile.ttsVolume}
              label={t('child.listenSummary')}
            />
          </div>
          <p className="muted">
            {t('child.stats', { words: discovered.length, sessions: sessions.length })}
            {dueList.length > 0 ? t('child.stats.due', { count: dueList.length }) : ''}
          </p>
        </div>
        <div className="child-hero__actions">
          {dueList.length > 0 && (
            <Btn variant="secondary" size="lg" onClick={startReview}>
              {t('child.review', { count: dueList.length })}
            </Btn>
          )}
          <Btn variant="ghost" size="lg" onClick={() => onNavigate({ name: 'atlas' })}>
            {t('child.atlas')}
          </Btn>
        </div>
      </section>

      {(nextStep || wordOfDay) && (
        <div className="pedagogy-grid">
          {nextStep && (
            <Card className="next-step-card">
              <p className="eyebrow">Il prossimo passo</p>
              <h2>{nextStep.title}</h2>
              <p>{nextStep.why}</p>
              <div className="actions-row">
                <Btn variant="primary" size="lg" onClick={startNextStep}>
                  Iniziamo da qui
                </Btn>
                <Btn variant="ghost" onClick={() => onNavigate({ name: 'atlas' })}>
                  Guarda l'atlante
                </Btn>
              </div>
            </Card>
          )}
          {wordOfDay && (
            <Card className="word-of-day">
              <p className="eyebrow">Una parola da scoprire</p>
              <div className="word-of-day__body">
                <Picture
                  src={primaryImage(wordOfDay)}
                  alt={wordOfDay.definition}
                  label={wordOfDay.lemma}
                  showLabel={false}
                  size="md"
                />
                <div>
                  <h2>{wordOfDay.lemma}</h2>
                  <p className="muted">{wordOfDay.definition}</p>
                </div>
              </div>
              <div className="actions-row">
                <Btn variant="secondary" onClick={() => setWordOfDayOpen(true)}>
                  Scopri la parola
                </Btn>
                <SpeakInline
                  text={`${wordOfDay.lemma}. ${wordOfDay.definition}`}
                  rate={activeProfile.ttsRate}
                  volume={activeProfile.ttsVolume}
                  label={`Ascolta ${wordOfDay.lemma}`}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {dueList.length > 0 && (
        <Card className="review-strip">
          <h2>{t('child.reviewCard.title')}</h2>
          <div className="review-strip__words">
            {dueList.slice(0, 6).map((item) => {
              const concept = CONCEPT_BY_ID.get(item.conceptId)
              if (!concept) return null
              return (
                <button
                  key={item.conceptId}
                  type="button"
                  className="word-chip word-chip--button"
                  onClick={() =>
                    speak(`${concept.lemma}. ${concept.definition}`, {
                      rate: activeProfile.ttsRate,
                      volume: activeProfile.ttsVolume,
                    })
                  }
                  aria-label={t('child.reviewCard.listen', {
                    word: concept.lemma,
                    definition: concept.definition,
                  })}
                >
                  {concept.lemma}
                </button>
              )
            })}
          </div>
          <Btn variant="secondary" onClick={startReview}>
            {t('child.reviewCard.restart')}
          </Btn>
        </Card>
      )}

      <section aria-labelledby="menu-title" className="section">
        <div className="section__head">
          <h2 id="menu-title">{t('child.menu.title')}</h2>
          <p className="muted">{t('child.menu.note')}</p>
        </div>
        <div className="menu-grid">
          <Card className="menu-group">
            <button
              type="button"
              className="menu-group__head"
              aria-expanded={openGroup === 'words'}
              aria-controls="menu-words"
              onClick={() => setOpenGroup(openGroup === 'words' ? 'relations' : 'words')}
            >
              <div>
                <h3>{t('child.menu.words.title')}</h3>
                <p className="muted">{t('child.menu.words.note')}</p>
              </div>
              <span className="menu-group__count">{MODULES.filter((m) => m.number <= 8).length}</span>
            </button>
            {openGroup === 'words' && (
              <div id="menu-words" className="menu-group__body">
                <ul className="menu-list">
                  {MODULES.filter((module) => module.number <= 8).map((module) => {
                    const mStats = moduleStats(module.id)
                    const consolidati = mStats.filter((s) => statusOf(s) === 'consolidato').length
                    const title = moduleTitleIn(module, language)
                    return (
                      <li key={module.id} className="menu-item">
                        <span className="menu-item__number" aria-hidden="true">{module.number}</span>
                        <div className="menu-item__text">
                          <strong>{title}</strong>
                          <span className="muted">
                            {t('child.module.levels', { from: module.levels[0], to: module.levels[module.levels.length - 1] })}
                            {mStats.length > 0 ? t('child.module.consolidated', { count: consolidati }) : ''}
                          </span>
                        </div>
                        <Btn
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setModuleForLevel(module.id)
                            setLevel(module.levels[0])
                          }}
                          ariaLabel={t('child.module.startAria', { title })}
                        >
                          {t('child.module.play')}
                        </Btn>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </Card>

          <Card className="menu-group">
            <button
              type="button"
              className="menu-group__head"
              aria-expanded={openGroup === 'relations'}
              aria-controls="menu-relations"
              onClick={() => setOpenGroup(openGroup === 'relations' ? 'words' : 'relations')}
            >
              <div>
                <h3>{t('child.menu.relations.title')}</h3>
                <p className="muted">{t('child.menu.relations.note')}</p>
              </div>
              <span className="menu-group__count">{MODULES.filter((m) => m.number >= 9 && m.number <= 18).length}</span>
            </button>
            {openGroup === 'relations' && (
              <div id="menu-relations" className="menu-group__body">
                <ul className="menu-list">
                  {MODULES.filter((module) => module.number >= 9 && module.number <= 18).map((module) => {
                    const mStats = moduleStats(module.id)
                    const consolidati = mStats.filter((s) => statusOf(s) === 'consolidato').length
                    const title = moduleTitleIn(module, language)
                    return (
                      <li key={module.id} className="menu-item">
                        <span className="menu-item__number" aria-hidden="true">{module.number}</span>
                        <div className="menu-item__text">
                          <strong>{title}</strong>
                          <span className="muted">
                            {t('child.module.levels', { from: module.levels[0], to: module.levels[module.levels.length - 1] })}
                            {mStats.length > 0 ? t('child.module.consolidated', { count: consolidati }) : ''}
                          </span>
                        </div>
                        <Btn
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setModuleForLevel(module.id)
                            setLevel(module.levels[0])
                          }}
                          ariaLabel={t('child.module.startAria', { title })}
                        >
                          {t('child.module.play')}
                        </Btn>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </Card>

          <Card className="menu-group">
            <button
              type="button"
              className="menu-group__head"
              aria-expanded={openGroup === 'labs'}
              aria-controls="menu-labs"
              onClick={() => setOpenGroup(openGroup === 'labs' ? 'words' : 'labs')}
            >
              <div>
                <h3>{t('child.menu.labs.title')}</h3>
                <p className="muted">{t('child.menu.labs.note')}</p>
              </div>
              <span className="menu-group__count">{STORIES.length + SEMANTIC_MAPS.length}</span>
            </button>
            {openGroup === 'labs' && (
              <div id="menu-labs" className="menu-group__body">
                <div className="menu-links">
                  <button type="button" className="menu-link-card" onClick={() => onNavigate({ name: 'stories' })}>
                    <strong>{t('child.stories.title')}</strong>
                    <span>{t('child.stories.body', { count: STORIES.length })}</span>
                  </button>
                  <button type="button" className="menu-link-card" onClick={() => onNavigate({ name: 'maps' })}>
                    <strong>{t('child.maps.title')}</strong>
                    <span>{t('child.maps.body', { count: SEMANTIC_MAPS.length })}</span>
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card className="menu-group">
            <button
              type="button"
              className="menu-group__head"
              aria-expanded={openGroup === 'world'}
              aria-controls="menu-world"
              onClick={() => setOpenGroup(openGroup === 'world' ? 'words' : 'world')}
            >
              <div>
                <h3>{t('child.menu.world.title')}</h3>
                <p className="muted">{t('child.menu.world.note')}</p>
              </div>
              <span className="menu-group__count">{ENVIRONMENTS.length + 1}</span>
            </button>
            {openGroup === 'world' && (
              <div id="menu-world" className="menu-group__body">
                <div className="menu-links">
                  <button type="button" className="menu-link-card" onClick={() => onNavigate({ name: 'atlas' })}>
                    <strong>{t('child.atlas')}</strong>
                    <span>{t('child.menu.world.atlas')}</span>
                  </button>
                  {ENVIRONMENTS.map((env) => (
                    <button
                      key={env.id}
                      type="button"
                      className="menu-link-card"
                      onClick={() => {
                        speak(`${env.title}. ${env.description}`, {
                          rate: activeProfile.ttsRate,
                          volume: activeProfile.ttsVolume,
                        })
                        onNavigate({ name: 'explore', envId: env.id })
                      }}
                    >
                      <strong>{env.title}</strong>
                      <span>{env.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="section quick-access" aria-label={t('child.quickAccess')}>
        <Btn variant="ghost" onClick={() => onNavigate({ name: 'settings' })}>
          {t('child.settings')}
        </Btn>
        <Btn variant="ghost" onClick={() => onNavigate({ name: 'home' })}>
          {t('child.switchProfile')}
        </Btn>
      </section>

      <Modal open={wordOfDayOpen && Boolean(wordOfDay)} onClose={() => setWordOfDayOpen(false)} title="Una parola da scoprire" wide>
        {wordOfDay && (
          <WordCard
            concept={wordOfDay}
            rate={activeProfile.ttsRate}
            volume={activeProfile.ttsVolume}
            showLabels={activeProfile.showText}
            onStart={() => {
              setWordOfDayOpen(false)
              // Lezione costruita sul concetto scelto: immagine, parola, recupero.
              // Non passa dalla banca, così la parola del giorno è davvero quella.
              const lesson = conceptLesson(wordOfDay.id, 2)
              onNavigate({
                name: 'session',
                request: {
                  moduleIds: ['m1'],
                  level: 2,
                  count: lesson.length || 3,
                  mode: 'nuovi',
                  targetConceptIds: [wordOfDay.id],
                },
                label: `Conosciamo «${wordOfDay.lemma}»`,
                exercises: lesson.length ? lesson : undefined,
              })
            }}
            startLabel={`Giochiamo con «${wordOfDay.lemma}»`}
          />
        )}
      </Modal>

      <Modal open={Boolean(moduleForLevel)} onClose={() => setModuleForLevel(null)} title={t('child.level.title')}>
        <p className="muted">{t('child.level.note')}</p>
        <div className="level-grid">
          {([1, 2, 3, 4, 5, 6] as Level[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`level-option ${level === l ? 'is-active' : ''}`}
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
            >
              {t(`child.level.${l}`)}
            </button>
          ))}
        </div>
        <div className="actions-row">
          <Btn
            size="lg"
            onClick={() => {
              if (moduleForLevel) startModule(moduleForLevel, level)
              setModuleForLevel(null)
            }}
          >
            {t('child.level.start')}
          </Btn>
          <Btn variant="ghost" onClick={() => setModuleForLevel(null)}>
            {t('common.cancel')}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
