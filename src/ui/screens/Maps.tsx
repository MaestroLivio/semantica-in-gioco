import { useMemo, useState } from 'react'
import { SEMANTIC_MAPS, MAP_BY_ID } from '../../data/maps'
import { CONCEPT_BY_ID, primaryImage } from '../../data/lexicon'
import { RELATION_LABELS } from '../../engine/types'
import { CATEGORY_BY_ID } from '../../data/categories'
import { useStore } from '../../state/store'
import { Btn, Card, SpeakButton } from '../components'
import { speak } from '../../state/speech'
import { Picture } from '../Picture'
import type { Navigate } from '../routes'

/**
 * Mappa semantica: nodo centrale, relazioni tipizzate. La stessa informazione
 * è disponibile come elenco navigabile da tastiera (equivalente accessibile
 * della rappresentazione grafica).
 */
export function Maps({ mapId, onNavigate }: { mapId?: string; onNavigate: Navigate }) {
  const { activeProfile } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(mapId ?? SEMANTIC_MAPS[0]?.id ?? null)
  const [focusNode, setFocusNode] = useState<string | null>(null)
  const map = selectedId ? MAP_BY_ID.get(selectedId) : undefined
  const center = map ? CONCEPT_BY_ID.get(map.central) : undefined

  const positions = useMemo(() => {
    if (!map) return []
    const count = map.nodes.length
    return map.nodes.map((node, i) => {
      const angle = (i / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2
      return { node, x: 50 + Math.cos(angle) * 34, y: 50 + Math.sin(angle) * 34 }
    })
  }, [map])

  const nodeConcept = focusNode ? CONCEPT_BY_ID.get(focusNode) : undefined

  return (
    <div className="page page--maps">
      <header className="section__head">
        <div>
          <h1>Mappe e reti semantiche</h1>
          <p className="muted">
            Ogni collegamento ha un nome: «è un tipo di», «serve per», «può trovarsi in». Le relazioni non sono
            intercambiabili.
          </p>
        </div>
      </header>

      <label className="field field--inline">
        <span>Scegli una mappa</span>
        <select value={selectedId ?? ''} onChange={(e) => { setSelectedId(e.target.value); setFocusNode(null) }}>
          {SEMANTIC_MAPS.map((m) => (
            <option key={m.id} value={m.id}>
              {CONCEPT_BY_ID.get(m.central)?.lemma} · livello {m.level}
            </option>
          ))}
        </select>
      </label>

      {map && center && (
        <div className="map-layout">
          <Card className="map-canvas">
            <div className="map-graph" role="img" aria-label={`Mappa semantica di ${center.lemma} con ${map.nodes.length} collegamenti`}>
              <svg viewBox="0 0 100 100" className="map-graph__lines" aria-hidden="true">
                {positions.map(({ node, x, y }) => (
                  <line key={node.conceptId} x1="50" y1="50" x2={x} y2={y} />
                ))}
              </svg>
              <button
                type="button"
                className="map-node map-node--center"
                onClick={() => {
                  speak(`${center.lemma}. ${center.definition}`, {
                    rate: activeProfile?.ttsRate,
                    volume: activeProfile?.ttsVolume,
                  })
                  setFocusNode(center.id)
                }}
              >
                <img src={primaryImage(center)} alt="" />
                <span>{center.lemma}</span>
              </button>
              {positions.map(({ node, x, y }) => {
                const concept = CONCEPT_BY_ID.get(node.conceptId)
                if (!concept) return null
                return (
                  <button
                    key={node.conceptId}
                    type="button"
                    className={`map-node ${focusNode === node.conceptId ? 'is-active' : ''}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => {
                      speak(`${concept.lemma}: ${RELATION_LABELS[node.relation]} ${center.lemma}`, {
                        rate: activeProfile?.ttsRate,
                        volume: activeProfile?.ttsVolume,
                      })
                      setFocusNode(node.conceptId)
                    }}
                    aria-label={`${concept.lemma}: ${RELATION_LABELS[node.relation]}`}
                  >
                    <img src={primaryImage(concept)} alt="" />
                    <span>{concept.lemma}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="map-detail">
            <h2>
              {center.lemma} <span className="muted">({CATEGORY_BY_ID.get(center.category)?.label})</span>
            </h2>
            <p>{center.definition}</p>
            <SpeakButton
              text={`${center.lemma}. ${center.definition}. ${map.nodes
                .map((n) => `${RELATION_LABELS[n.relation]} ${CONCEPT_BY_ID.get(n.conceptId)?.lemma ?? ''}`)
                .join('. ')}`}
              rate={activeProfile?.ttsRate}
              volume={activeProfile?.ttsVolume}
              label="Ascolta la mappa"
            />
            <h3>Collegamenti</h3>
            <ul className="map-relations">
              <li>
                <span className="relation-tag">è un tipo di</span>{' '}
                {CATEGORY_BY_ID.get(center.category)?.label}
              </li>
              {map.nodes.map((node) => {
                const concept = CONCEPT_BY_ID.get(node.conceptId)
                if (!concept) return null
                return (
                  <li key={node.conceptId}>
                    <button type="button" className="relation-button" onClick={() => setFocusNode(node.conceptId)}>
                      <span className="relation-tag">{RELATION_LABELS[node.relation]}</span>
                      <span>{concept.lemma}</span>
                    </button>
                    {node.note && <em> — {node.note}</em>}
                  </li>
                )
              })}
            </ul>

            {nodeConcept && (
              <div className="map-node-detail">
                <h3>{nodeConcept.lemma}</h3>
                <Picture src={primaryImage(nodeConcept)} alt={nodeConcept.definition} label={nodeConcept.lemma} size="md" showLabel />
                <p>{nodeConcept.definition}</p>
                <SpeakButton
                  text={`${nodeConcept.lemma}. ${nodeConcept.definition}`}
                  rate={activeProfile?.ttsRate}
                  volume={activeProfile?.ttsVolume}
                  label={`Ascolta ${nodeConcept.lemma}`}
                  size="sm"
                />
                <div className="actions-row">
                  <Btn variant="secondary" size="sm" onClick={() => setFocusNode(null)}>
                    Chiudi
                  </Btn>
                  {SEMANTIC_MAPS.some((m) => m.central === nodeConcept.id) && (
                    <Btn size="sm" onClick={() => setSelectedId(`map-${nodeConcept.id}`)}>
                      Apri la sua mappa
                    </Btn>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="actions-row">
        <Btn variant="ghost" onClick={() => onNavigate({ name: 'child' })}>
          Torna al menu
        </Btn>
        <Btn variant="secondary" onClick={() => onNavigate({ name: 'atlas' })}>
          Il mio atlante
        </Btn>
      </div>
    </div>
  )
}
