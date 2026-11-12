import type { Concept } from '../engine/types'
import { CONCEPT_BY_ID, primaryImage } from '../data/lexicon'
import { semanticCard } from '../engine/pedagogy'
import { Btn, SpeakButton, SpeakInline } from './components'
import { Picture } from './Picture'

/**
 * Scheda parola: la fase di insegnamento prima della verifica.
 * Immagine, definizione, caratteristiche semantiche e un esempio, tutti
 * ascoltabili. Non produce punteggi: si legge, si ascolta, si commenta.
 */
export function WordCard({
  concept,
  rate,
  volume,
  showLabels = true,
  onStart,
  startLabel = 'Adesso proviamo',
  compact = false,
}: {
  concept: Concept
  rate?: number
  volume?: number
  showLabels?: boolean
  onStart?: () => void
  startLabel?: string
  compact?: boolean
}) {
  // L'esempio è già mostrato in evidenza sotto la griglia: non si ripete.
  const rows = semanticCard(concept).filter((row) => row.label !== 'Un esempio')
  const example = concept.examples[0]
  const spoken = [
    concept.lemma,
    concept.definition,
    ...rows.map((row) => `${row.label}: ${row.value}`),
    example,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <section className={`word-card ${compact ? 'word-card--compact' : ''}`} aria-labelledby={`word-${concept.id}`}>
      <div className="word-card__hero">
        <Picture
          src={primaryImage(concept)}
          alt={concept.definition}
          label={concept.lemma}
          showLabel={showLabels}
          size={compact ? 'lg' : 'hero'}
        />
        <div className="word-card__text">
          <p className="eyebrow">Scheda parola</p>
          <h2 id={`word-${concept.id}`}>{concept.lemma}</h2>
          <p className="word-card__definition">{concept.definition}</p>
          <div className="word-card__audio">
            <SpeakButton text={spoken} rate={rate} volume={volume} label="Ascolta tutta la scheda" size="sm" />
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <dl className="word-card__grid">
          {rows.map((row) => (
            <div className="word-card__row" key={row.label}>
              <dt>
                {row.label}
                <SpeakInline
                  text={`${row.label}: ${row.value}`}
                  rate={rate}
                  volume={volume}
                  label={`Ascolta: ${row.label}`}
                />
              </dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {example && (
        <p className="word-card__example">
          <span className="relation-tag">Un esempio</span> «{example}»
        </p>
      )}

      {concept.relations.length > 0 && (
        <p className="word-card__links">
          <span className="muted">Parole collegate: </span>
          {concept.relations.slice(0, 4).map((relation, index) => (
            <span key={`${relation.type}-${relation.target}-${index}`} className="word-chip word-chip--small">
              {CONCEPT_BY_ID.get(relation.target)?.lemma ?? relation.target}
            </span>
          ))}
        </p>
      )}

      {onStart && (
        <div className="word-card__actions">
          <Btn variant="primary" size="lg" onClick={onStart}>
            {startLabel}
          </Btn>
        </div>
      )}
    </section>
  )
}
