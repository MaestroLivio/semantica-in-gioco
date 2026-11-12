import { useMemo, useState } from 'react'
import { STORIES, STORY_BY_ID } from '../../data/stories'
import { CONCEPT_BY_ID, primaryImage } from '../../data/lexicon'
import { useStore } from '../../state/store'
import { Btn, Card, Feedback, SpeakButton, SpeakInline, useAutoSpeak } from '../components'
import { Picture } from '../Picture'
import { speak } from '../../state/speech'
import type { Navigate } from '../routes'
import type { Concept, Level } from '../../engine/types'

function StoryThumb({ src, alt }: { src?: string; alt: string }) {
  if (!src) return null
  return (
    <span className="story-thumb">
      <img src={src} alt={alt} loading="lazy" />
    </span>
  )
}

const KIND_LABELS = {
  explicit: 'Domanda esplicita',
  inferential: 'Inferenza',
  sequence: 'Sequenza',
  vocabulary: 'Lessico',
} as const

export function Stories({ storyId, onNavigate }: { storyId?: string; onNavigate: Navigate }) {
  const { activeProfile, addNote } = useStore()
  const [selected, setSelected] = useState<string | null>(storyId ?? null)
  const [levelFilter, setLevelFilter] = useState<Level | 'tutte'>('tutte')
  const story = selected ? STORY_BY_ID.get(selected) : undefined

  const list = useMemo(
    () => (levelFilter === 'tutte' ? STORIES : STORIES.filter((s) => s.level === levelFilter)),
    [levelFilter],
  )

  if (story) {
    return (
      <StoryReader
        storyId={story.id}
        onBack={() => setSelected(null)}
        rate={activeProfile?.ttsRate}
        volume={activeProfile?.ttsVolume}
        autoAudio={activeProfile?.autoAudio}
        onNote={(text) => {
          if (activeProfile) addNote({ profileId: activeProfile.id, text, moduleId: 'm20' })
        }}
      />
    )
  }

  return (
    <div className="page page--stories">
      <header className="section__head">
        <div>
          <h1>Storie e significati</h1>
          <p className="muted">
            Microstorie illustrate con domande esplicite e inferenziali. Le parole chiave possono essere riutilizzate dopo
            la lettura.
          </p>
        </div>
        <SpeakButton
          text="Storie e significati. Scegli una storia illustrata. Dopo la lettura trovi domande con immagini per capire insieme."
          rate={activeProfile?.ttsRate}
          volume={activeProfile?.ttsVolume}
          label="Ascolta come funziona questa sezione"
        />
      </header>

      <div className="filter-row" role="group" aria-label="Filtra per livello">
        {(['tutte', 2, 3, 4, 5, 6] as (Level | 'tutte')[]).map((l) => (
          <button
            key={String(l)}
            type="button"
            className={`filter-chip ${levelFilter === l ? 'is-active' : ''}`}
            onClick={() => setLevelFilter(l)}
            aria-pressed={levelFilter === l}
          >
            {l === 'tutte' ? 'Tutte' : `Livello ${l}`}
          </button>
        ))}
      </div>

      <div className="story-grid">
        {list.map((s) => {
          const cover = CONCEPT_BY_ID.get(s.reuse[0] ?? s.keyWords[0] ?? '')
          return (
            <Card key={s.id} as="article" className="story-card">
              {cover && (
                <Picture src={primaryImage(cover)} alt="" label={cover.lemma} size="md" className="story-card__cover" />
              )}
              <h2>{s.title}</h2>
              <p className="muted">
                Livello {s.level} · {s.ageBand} · {s.panels.length} scene
              </p>
              <p>{s.panels[0]?.text}</p>
              <div className="story-card__actions">
                <Btn onClick={() => setSelected(s.id)}>Leggi la storia</Btn>
                <SpeakInline
                  text={`${s.title}. ${s.panels[0]?.text ?? ''}`}
                  rate={activeProfile?.ttsRate}
                  volume={activeProfile?.ttsVolume}
                  label={`Ascolta la presentazione di ${s.title}`}
                />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="actions-row">
        <Btn variant="ghost" onClick={() => onNavigate({ name: 'child' })}>
          Torna al menu
        </Btn>
      </div>
    </div>
  )
}

function StoryReader({
  storyId,
  onBack,
  rate,
  volume,
  autoAudio,
  onNote,
}: {
  storyId: string
  onBack: () => void
  rate?: number
  volume?: number
  autoAudio?: boolean
  onNote: (text: string) => void
}) {
  const story = STORY_BY_ID.get(storyId)
  const [panel, setPanel] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showQuestions, setShowQuestions] = useState(false)

  const current = story?.panels[panel]
  useAutoSpeak(current?.text, { enabled: Boolean(autoAudio), rate, volume })

  if (!story || !current) return null

  const isLast = panel === story.panels.length - 1
  const answered = Object.keys(answers).length
  const correct = story.questions.filter((q, i) => answers[i] !== undefined && q.options[answers[i]]?.correct).length

  return (
    <div className="page page--story-reader">
      <div className="story-reader__head">
        <Btn variant="ghost" onClick={onBack}>
          ← Tutte le storie
        </Btn>
        <h1>{story.title}</h1>
        <SpeakButton text={`${story.title}. ${current.text}`} rate={rate} volume={volume} label="Ascolta la scena" />
      </div>

      <div className="story-panels">
        {story.panels.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`story-panel-dot ${i === panel ? 'is-active' : ''}`}
            onClick={() => setPanel(i)}
            aria-label={`Vai alla scena ${i + 1}`}
            aria-current={i === panel}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card className="story-panel">
        <p className="story-panel__text">{current.text}</p>
        <div className="story-panel__pictures">
          {current.conceptIds.map((id, i) => {
            const concept = CONCEPT_BY_ID.get(id)
            if (!concept) return null
            return (
              <Picture
                key={`${id}-${i}`}
                src={primaryImage(concept)}
                alt={concept.definition}
                label={concept.lemma}
                size="md"
                showLabel
              />
            )
          })}
        </div>
        <div className="actions-row">
          <Btn variant="secondary" onClick={() => setPanel((p) => Math.max(0, p - 1))} disabled={panel === 0}>
            Scena precedente
          </Btn>
          {!isLast ? (
            <Btn onClick={() => setPanel((p) => Math.min(story.panels.length - 1, p + 1))}>Scena successiva</Btn>
          ) : (
            <Btn onClick={() => setShowQuestions(true)}>Domande sulla storia</Btn>
          )}
        </div>
      </Card>

      {showQuestions && (
        <>
          <Card className="story-recap">
            <div className="story-recap__head">
              <h2>Rivediamo la storia</h2>
              <SpeakButton
                text={story.panels.map((p) => p.text).join(' ')}
                rate={rate}
                volume={volume}
                label="Ascolta tutta la storia"
              />
            </div>
            <p className="muted">Tocca una scena per riascoltarla e rivedere le immagini.</p>
            <div className="story-recap__grid">
              {story.panels.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className="story-recap__scene"
                  onClick={() => {
                    setPanel(i)
                    setShowQuestions(false)
                    speak(p.text, { rate, volume })
                  }}
                  aria-label={`Scena ${i + 1}: ${p.text}`}
                >
                  <span className="story-recap__pictures">
                    {p.conceptIds.slice(0, 3).map((id) => {
                      const concept = CONCEPT_BY_ID.get(id)
                      if (!concept) return null
                      return <StoryThumb key={id} src={primaryImage(concept)} alt={concept.lemma} />
                    })}
                  </span>
                  <span className="story-recap__label">Scena {i + 1}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="story-questions">
            <h2>Capiamo insieme</h2>
            <p className="muted">
              Domande esplicite e inferenziali. Ogni risposta ha un'immagine quando aiuta a capire. Se la risposta non è
              univoca, discutine con l'adulto: l'obiettivo è il ragionamento, non il punteggio.
            </p>
            {story.questions.map((q, qi) => {
              const chosen = answers[qi]
              const chosenOption = chosen !== undefined ? q.options[chosen] : undefined
              const feedbackText = chosenOption?.correct
                ? q.explanation ?? 'Sì, è così.'
                : `Riguardiamo la storia. ${q.explanation ?? ''}`.trim()
              return (
                <fieldset key={qi} className="question">
                  <legend>
                    <span className="question__kind">{KIND_LABELS[q.kind]}</span>
                    <span className="question__text">{q.text}</span>
                    <SpeakInline
                      text={q.text}
                      rate={rate}
                      volume={volume}
                      label={`Ascolta la domanda ${qi + 1}`}
                    />
                  </legend>
                  <div className="question__options">
                    {q.options.map((opt, oi) => {
                      const isChosen = chosen === oi
                      const concepts = (opt.conceptIds ?? [])
                        .map((id) => CONCEPT_BY_ID.get(id))
                        .filter((c): c is Concept => Boolean(c))
                        .slice(0, 3)
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          className={`story-option ${isChosen ? (opt.correct ? 'is-correct' : 'is-wrong') : ''}`}
                          onClick={() => {
                            setAnswers((prev) => ({ ...prev, [qi]: oi }))
                            speak(opt.label, { rate, volume })
                          }}
                          aria-pressed={isChosen}
                        >
                          {concepts.length > 0 && (
                            <span className="story-option__pictures" aria-hidden="true">
                              {concepts.map((concept) => (
                                <StoryThumb key={concept.id} src={primaryImage(concept)} alt={concept.lemma} />
                              ))}
                            </span>
                          )}
                          <span className="story-option__label">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  {chosen !== undefined && (
                    <Feedback status={chosenOption?.correct ? 'correct' : 'retry'}>
                      <div className="feedback__row">
                        <span>{feedbackText}</span>
                        <SpeakButton text={feedbackText} rate={rate} volume={volume} label="Ascolta la spiegazione" size="sm" />
                      </div>
                    </Feedback>
                  )}
                </fieldset>
              )
            })}
            <p className="muted" aria-live="polite">
              Risposte date: {answered} su {story.questions.length}
              {answered === story.questions.length ? ` · ${correct} corrette` : ''}
            </p>

            <h3>Parole da riusare</h3>
            <div className="word-row">
              {story.reuse.map((id) => {
                const concept = CONCEPT_BY_ID.get(id)
                if (!concept) return null
                return (
                  <button
                    key={id}
                    type="button"
                    className="word-chip word-chip--button"
                    onClick={() => speak(`${concept.lemma}. ${concept.definition}`, { rate, volume })}
                    aria-label={`Ascolta ${concept.lemma}: ${concept.definition}`}
                  >
                    <StoryThumb src={primaryImage(concept)} alt={concept.definition} />
                    <span>{concept.lemma}</span>
                  </button>
                )
              })}
            </div>
            <div className="actions-row">
              <Btn
                variant="secondary"
                onClick={() =>
                  onNote(`Storia "${story.title}": ${answered}/${story.questions.length} domande, ${correct} corrette. Parole: ${story.reuse.join(', ')}.`)
                }
              >
                Salva osservazione
              </Btn>
              <Btn variant="ghost" onClick={onBack}>
                Torna alle storie
              </Btn>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
