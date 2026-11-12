import { useMemo, useState } from 'react'
import { useStore } from '../../state/store'
import { CONCEPT_BY_ID, primaryImage, searchConcepts } from '../../data/lexicon'
import { statusOf, type ConceptStatus } from '../../engine/adaptive'
import { RELATION_LABELS } from '../../engine/types'
import { Btn, Card, EmptyState, Modal, Progress, SpeakInline } from '../components'
import { speak } from '../../state/speech'
import { Picture } from '../Picture'
import { WordCard } from '../WordCard'
import type { Navigate } from '../routes'

const STATUS_LABELS: Record<ConceptStatus, string> = {
  nuovo: 'Nuova parola',
  'in-apprendimento': 'In apprendimento',
  'in-consolidamento': 'In consolidamento',
  consolidato: 'Consolidata',
  'da-ripassare': 'Da riprendere',
}

export function Atlas({ onNavigate }: { onNavigate: Navigate }) {
  const { activeProfile, stats } = useStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const discovered = useMemo(() => {
    return [...stats.values()]
      .filter((s) => s.exposures > 0)
      .sort((a, b) => b.lastSeen - a.lastSeen)
  }, [stats])

  const concept = open ? CONCEPT_BY_ID.get(open) : undefined
  const filtered = query ? searchConcepts(query).filter((c) => stats.get(c.id)?.exposures) : []

  return (
    <div className="page page--atlas">
      <header className="section__head">
        <div>
          <p className="eyebrow">L'atlante dei significati</p>
          <div className="heading-with-speak">
            <h1>Le parole che ho scoperto</h1>
            <SpeakInline
              text={`L'atlante dei significati. Le parole che ho scoperto. ${discovered.length} parole incontrate.`}
              rate={activeProfile?.ttsRate}
              volume={activeProfile?.ttsVolume}
              label="Ascolta il riepilogo dell'atlante"
            />
          </div>
          <p className="muted">
            Ogni parola incontrata aggiunge un elemento all'atlante. Non è una classifica: conta la curiosità, non il
            punteggio.
          </p>
        </div>
        {activeProfile && (
          <div className="atlas-progress">
            <Progress
              value={discovered.filter((s) => statusOf(s) === 'consolidato').length}
              total={Math.max(discovered.length, 1)}
              label="Parole consolidate"
            />
            <p className="muted">
              {discovered.length} parole incontrate ·{' '}
              {discovered.filter((s) => statusOf(s) === 'consolidato').length} consolidate
            </p>
          </div>
        )}
      </header>

      <label className="field field--inline">
        <span>Cerca nell'atlante</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Es. cane, mela…" />
      </label>
      {query && (
        <div className="atlas-results">
          {filtered.length === 0 && <p className="muted">Nessuna parola incontrata corrisponde alla ricerca.</p>}
          {filtered.map((c) => (
            <button key={c.id} type="button" className="word-chip" onClick={() => setOpen(c.id)}>
              {c.lemma}
            </button>
          ))}
        </div>
      )}

      {discovered.length === 0 ? (
        <EmptyState title="L'atlante è ancora vuoto">
          <p>Scegli un'attività: le parole compariranno qui con lo stato di apprendimento.</p>
          <Btn onClick={() => onNavigate({ name: 'child' })}>Vai alle attività</Btn>
        </EmptyState>
      ) : (
        <div className="atlas-grid">
          {discovered.map((s) => {
            const c = CONCEPT_BY_ID.get(s.conceptId)
            if (!c) return null
            const status = statusOf(s)
            return (
              <Card key={s.conceptId} as="article" className={`atlas-item atlas-item--${status}`}>
                <button
                  type="button"
                  className="atlas-item__button"
                  onClick={() => {
                    speak(`${c.lemma}. ${c.definition}`, {
                      rate: activeProfile?.ttsRate,
                      volume: activeProfile?.ttsVolume,
                    })
                    setOpen(c.id)
                  }}
                >
                  <Picture src={primaryImage(c)} alt={c.definition} label={c.lemma} showLabel size="sm" />
                  <span className="atlas-item__info">
                    <strong>{c.lemma}</strong>
                    <span className={`status-pill status-pill--${status}`}>{STATUS_LABELS[status]}</span>
                    <span className="muted">
                      {s.independent} risposte autonome · {s.assisted} con aiuto
                    </span>
                  </span>
                </button>
              </Card>
            )
          })}
        </div>
      )}

      <div className="actions-row">
        <Btn variant="ghost" onClick={() => onNavigate({ name: 'child' })}>
          Torna al menu
        </Btn>
        <Btn variant="secondary" onClick={() => onNavigate({ name: 'maps' })}>
          Esplora le mappe
        </Btn>
      </div>

      <Modal open={Boolean(concept)} onClose={() => setOpen(null)} title={concept?.lemma ?? ''} wide>
        {concept && (
          <div className="concept-card">
            <WordCard
              concept={concept}
              rate={activeProfile?.ttsRate}
              volume={activeProfile?.ttsVolume}
              showLabels={activeProfile?.showText ?? true}
            />
            <ul className="relation-list">
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
                Apri la mappa
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
