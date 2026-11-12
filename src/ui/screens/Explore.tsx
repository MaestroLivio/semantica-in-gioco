import { useMemo, useState } from 'react'
import { ENVIRONMENTS } from '../../data/environments'
import { CONCEPT_BY_ID, getConcept, primaryImage } from '../../data/lexicon'
import { CATEGORY_BY_ID } from '../../data/categories'
import { RELATION_LABELS } from '../../engine/types'
import { useStore } from '../../state/store'
import { Btn, Card, Modal, SpeakButton, SpeakInline } from '../components'
import { speak } from '../../state/speech'
import { Picture } from '../Picture'
import type { EnvironmentId } from '../../engine/types'
import type { Navigate } from '../routes'

/**
 * Esplorazione libera: il bambino tocca gli oggetti, ascolta i nomi e scopre
 * caratteristiche e relazioni, senza valutazione. Le missioni aggiungono un
 * obiettivo semantico esplicito.
 */
export function Explore({ envId, onNavigate }: { envId?: EnvironmentId; onNavigate: Navigate }) {
  const { activeProfile } = useStore()
  const [current, setCurrent] = useState<EnvironmentId>(envId ?? 'casa')
  const [openConcept, setOpenConcept] = useState<string | null>(null)
  const environment = useMemo(() => ENVIRONMENTS.find((e) => e.id === current) ?? ENVIRONMENTS[0], [current])
  const concept = openConcept ? getConcept(openConcept) : undefined

  const startMission = (moduleId: string, level: number, title: string) => {
    onNavigate({
      name: 'session',
      request: {
        moduleIds: [moduleId],
        level: Math.min(6, Math.max(1, level)) as 1 | 2 | 3 | 4 | 5 | 6,
        count: activeProfile?.sessionLength ?? 6,
        mode: 'misto',
        targetConceptIds: environment.words,
      },
      label: title,
    })
  }

  return (
    <div className="page page--explore">
      <header className="section__head">
        <h1>Ambienti</h1>
        <p className="muted">
          Tocca gli oggetti per ascoltarne il nome e scoprire le relazioni. Nessuna risposta è sbagliata: qui si esplora.
        </p>
      </header>

      <div className="env-tabs" role="tablist" aria-label="Scegli un ambiente">
        {ENVIRONMENTS.map((env) => (
          <button
            key={env.id}
            type="button"
            role="tab"
            aria-selected={env.id === current}
            className={`env-tab ${env.id === current ? 'is-active' : ''}`}
            onClick={() => {
              setCurrent(env.id)
              speak(`${env.title}. ${env.description}`, {
                rate: activeProfile?.ttsRate,
                volume: activeProfile?.ttsVolume,
              })
            }}
          >
            {env.title}
          </button>
        ))}
      </div>

      <div className={`scene scene--${environment.id}`} role="group" aria-label={`Ambiente: ${environment.title}`}>
        <div className="scene__backdrop" aria-hidden="true">
          <span className="scene__sun" />
          <span className="scene__ground" />
        </div>
        {environment.hotspots.map((hotspot) => {
          const item = CONCEPT_BY_ID.get(hotspot.conceptId)
          if (!item) return null
          return (
            <button
              key={hotspot.conceptId}
              type="button"
              className="hotspot"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              onClick={() => {
                speak(`${item.lemma}. ${item.definition}`, {
                  rate: activeProfile?.ttsRate,
                  volume: activeProfile?.ttsVolume,
                })
                setOpenConcept(hotspot.conceptId)
              }}
              aria-label={`${item.lemma}. ${item.definition}`}
            >
              <img src={primaryImage(item)} alt="" loading="lazy" />
              <span className="hotspot__label">{item.lemma}</span>
            </button>
          )
        })}
      </div>

      <Card className="env-missions">
        <h2>Missioni di {environment.title.toLowerCase()}</h2>
        <p className="muted">Ogni missione ha un obiettivo semantico chiaro e una durata breve.</p>
        <ul className="mission-list">
          {environment.missions.map((mission) => (
            <li key={mission.id}>
              <div>
                <div className="heading-with-speak">
                  <h3>{mission.title}</h3>
                  <SpeakInline
                    text={`${mission.title}. ${mission.goal}. Attività: ${mission.tasks.join('. ')}`}
                    rate={activeProfile?.ttsRate}
                    volume={activeProfile?.ttsVolume}
                    label={`Ascolta la missione ${mission.title}`}
                  />
                </div>
                <p>{mission.goal}</p>
                <p className="muted">Attività: {mission.tasks.join(' · ')}</p>
              </div>
              <Btn variant="primary" onClick={() => startMission(mission.moduleId, mission.level, mission.title)}>
                Inizia la missione
              </Btn>
            </li>
          ))}
        </ul>
      </Card>

      <div className="actions-row">
        <Btn variant="ghost" onClick={() => onNavigate({ name: 'child' })}>
          Torna al menu
        </Btn>
      </div>

      <Modal open={Boolean(concept)} onClose={() => setOpenConcept(null)} title={concept?.lemma ?? 'Parola'}>
        {concept && (
          <div className="concept-card">
            <Picture src={primaryImage(concept)} alt={concept.definition} label={concept.lemma} size="hero" showLabel />
            <div className="concept-card__body">
              <p className="concept-card__definition">{concept.definition}</p>
              <SpeakButton
                text={`${concept.lemma}. ${concept.definition}. ${concept.features.join('. ')}`}
                rate={activeProfile?.ttsRate}
                volume={activeProfile?.ttsVolume}
                label={`Ascolta la descrizione di ${concept.lemma}`}
              />
              <h3>Caratteristiche</h3>
              <ul className="plain-list">
                {concept.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {concept.functions?.length ? (
                <>
                  <h3>A che cosa serve</h3>
                  <ul className="plain-list">
                    {concept.functions.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <h3>Relazioni</h3>
              <ul className="relation-list">
                <li>
                  <span className="relation-tag">è un tipo di</span>{' '}
                  {CATEGORY_BY_ID.get(concept.category)?.label ?? concept.category}
                </li>
                {concept.relations.map((r, i) => (
                  <li key={`${r.type}-${r.target}-${i}`}>
                    <span className="relation-tag">{RELATION_LABELS[r.type]}</span>{' '}
                    {CONCEPT_BY_ID.get(r.target)?.lemma ?? r.target}
                    {r.note ? <em> — {r.note}</em> : null}
                  </li>
                ))}
              </ul>
              <div className="actions-row">
                <Btn variant="secondary" onClick={() => onNavigate({ name: 'maps', mapId: `map-${concept.id}` })}>
                  Vedi la mappa
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
