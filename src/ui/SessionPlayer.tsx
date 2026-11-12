import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Attempt } from '../engine/adaptive'
import type { ExOption, Exercise } from '../engine/exercise'
import {
  categorizeCorrect,
  isCorrectSelection,
  matchingPairsCorrect,
  orderedCorrect,
} from '../engine/exercise'
import { phonologicalCue, recallCueLadder, relationLabel, describeSlots } from '../engine/generator'
import {
  PHASES,
  analyseCategorize,
  analyseOrder,
  analysePair,
  analyseSelection,
  nextStepRecommendation,
  planSession,
  scaffoldsFor,
  sessionDidacticSummary,
  transferTask,
  workedExample,
  type ErrorAnalysis,
  type SessionPhase,
} from '../engine/pedagogy'
import { CONCEPT_BY_ID, getConcept, primaryImage, requireConcept } from '../data/lexicon'
import { CATEGORY_BY_ID } from '../data/categories'
import type { ChildProfile } from '../state/profile'
import { useStore } from '../state/store'
import { speak, stopSpeaking } from '../state/speech'
import { Btn, Feedback, Progress, SpeakButton, SpeakInline, useAutoSpeak, useScan } from './components'
import { Picture } from './Picture'
import { RELATION_LABELS } from '../engine/types'

interface Resolved {
  correct: boolean
  usedHint: boolean
  hintLevel: number
  modality: Attempt['modality']
}

interface ExerciseViewProps {
  exercise: Exercise
  profile: ChildProfile
  index: number
  total: number
  onResolved: (result: Resolved) => void
  onSkip: () => void
  onExit: () => void
  /** Fase didattica della sessione: decide aiuti, modello e tipo di feedback. */
  phase?: SessionPhase
}

function visibleOptions(exercise: Exercise, hidden: string[], max: number): ExOption[] {
  const options = exercise.options ?? []
  const filtered = options.filter((o) => !hidden.includes(o.id))
  const correct = new Set(exercise.correct)
  const kept: ExOption[] = []
  for (const option of filtered) {
    if (correct.has(option.id) || kept.length < max) kept.push(option)
  }
  return kept
}

export function ExerciseView({ exercise, profile, index, total, onResolved, onSkip, onExit, phase }: ExerciseViewProps) {
  const scaffolds = scaffoldsFor(phase ?? 'pratica-guidata')
  const { recordAttempt } = useStore()
  const [selected, setSelected] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [pendingLeft, setPendingLeft] = useState<string | null>(null)
  const [order, setOrder] = useState<string[]>([])
  const [placement, setPlacement] = useState<Record<string, string>>({})
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [slots, setSlots] = useState<Record<number, { choice: string; accepted?: boolean }>>({})
  const [placedZone, setPlacedZone] = useState<string | null>(null)
  const [hint, setHint] = useState(phase === 'modellamento' ? 1 : 0)
  const [hidden, setHidden] = useState<string[]>([])
  const [outcome, setOutcome] = useState<'correct' | 'retry' | null>(null)
  const [tries, setTries] = useState(0)
  const [showModel, setShowModel] = useState(phase === 'modellamento')
  const [analysis, setAnalysis] = useState<ErrorAnalysis | null>(null)
  const model = useMemo(() => workedExample(exercise), [exercise])
  const startedAt = useRef(Date.now())
  const recorded = useRef(false)
  const attemptsRef = useRef(0)

  const target = exercise.targetConceptId ? getConcept(exercise.targetConceptId) : undefined
  const promptText = `${exercise.prompt}${exercise.criterion ? ` Criterio: ${exercise.criterion}.` : ''}`
  const speechRate = profile.ttsRate
  const speechVolume = profile.ttsVolume

  useAutoSpeak(promptText, {
    enabled: profile.autoAudio,
    rate: speechRate,
    volume: speechVolume,
    voiceURI: null,
  })

  useEffect(() => () => stopSpeaking(), [])

  const record = useCallback(
    (result: Resolved) => {
      if (recorded.current) return
      recorded.current = true
      recordAttempt({
        id: `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        conceptIds: exercise.conceptIds.length ? exercise.conceptIds : [exercise.targetConceptId ?? ''],
        targetConceptId: exercise.targetConceptId,
        moduleId: exercise.moduleId,
        kind: exercise.kind,
        sessionId: `s-${startedAt.current.toString(36)}`,
        correct: result.correct,
        usedHint: result.usedHint,
        hintLevel: result.hintLevel,
        modality: result.modality,
        ms: Date.now() - startedAt.current,
        at: Date.now(),
        origin: exercise.origin,
        level: exercise.level,
      })
    },
    [exercise, recordAttempt],
  )

  const succeed = (hintLevel = hint) => {
    setOutcome('correct')
    record({ correct: true, usedHint: hintLevel > 0, hintLevel, modality: profile.scanMode ? 'keyboard' : 'tap' })
    if (profile.autoAudio) speak('Bravo!', { rate: speechRate, volume: speechVolume })
  }

  /**
   * L'errore produce sempre un'informazione didattica: che cosa hanno in comune
   * le due cose, in che cosa differiscono, quale indizio riprovare. Mai un
   * giudizio. Nella pratica autonoma non si tolgono alternative: si toglie
   * solo la difficoltà di troppo, e solo nella pratica guidata.
   */
  const failWith = (next: ErrorAnalysis) => {
    attemptsRef.current += 1
    setTries((t) => t + 1)
    setAnalysis(next)
    setOutcome('retry')
    if (!recorded.current) {
      record({ correct: false, usedHint: attemptsRef.current > 1 || hint > 0, hintLevel: hint, modality: profile.scanMode ? 'keyboard' : 'tap' })
    }
    if (profile.autoAudio) {
      speak(`${next.headline}. ${next.explanation}`, { rate: speechRate, volume: speechVolume })
    }
    if (scaffolds.eliminateDistractors && !hidden.length && (exercise.options?.length ?? 0) > 2) {
      const wrong = (exercise.options ?? []).filter((o) => !exercise.correct.includes(o.id) && !hidden.includes(o.id))
      if (wrong.length > 1) setHidden((prev) => [...prev, wrong[0].id])
    }
    setHint((h) => Math.max(h, 1))
    if (scaffolds.fullModelAfterRetry && attemptsRef.current >= 2) setShowModel(true)
  }

  const fail = (selectedIds: string[] = []) => failWith(analyseSelection(exercise, selectedIds))

  const showNextHint = () => {
    const next = Math.min(hint + 1, 6)
    setHint(next)
    if (next >= 3) setShowModel(true)
    const cue = exercise.cue ?? target?.features?.[0]
    if (cue && profile.autoAudio) speak(cue, { rate: speechRate, volume: speechVolume })
  }

  // ---------------- Scelta semplice (immagine / parola / intruso) ----------------
  const options = useMemo(
    () => visibleOptions(exercise, hidden, Math.max(profile.alternatives, exercise.correct.length)),
    [exercise, hidden, profile.alternatives],
  )

  const scanIndex = useScan(
    profile.scanMode && (exercise.kind === 'choose-image' || exercise.kind === 'choose-label' || exercise.kind === 'odd-one-out'),
    options.length,
    (i) => {
      const option = options[i]
      if (option) chooseSingle(option.id)
    },
  )

  function chooseSingle(optionId: string) {
    if (outcome === 'correct') return
    setSelected([optionId])
    if (exercise.correct.includes(optionId)) {
      succeed()
    } else {
      fail([optionId])
    }
  }

  // ---------------- Rendering per tipo ----------------
  const promptConcept = exercise.conceptIds[0] ? getConcept(exercise.conceptIds[0]) : undefined
  const showLabels = profile.showText && profile.symbolLabels
  const phaseInfo = phase ? PHASES[phase] : undefined

  // Intestazione didattica comune a tutti i tipi: dice in quale fase siamo e
  // perché, prima della consegna. La stessa frase è ascoltabile.
  const phaseBanner = phaseInfo ? (
    <div className={`phase-banner phase-banner--${phaseInfo.id}`}>
      <div className="phase-banner__text">
        <span className="phase-banner__label">{phaseInfo.label}</span>
        <p>{phaseInfo.childCue}</p>
      </div>
      <SpeakInline
        text={`${phaseInfo.label}. ${phaseInfo.childCue}`}
        rate={speechRate}
        volume={speechVolume}
        label="Ascolta che cosa facciamo adesso"
      />
    </div>
  ) : null

  const header = (
    <div className="exercise__header">
      <Progress value={index} total={total} label="Avanzamento della sessione" />
      <div className="exercise__tools">
        <SpeakButton text={promptText} rate={speechRate} volume={speechVolume} />
        <Btn variant="ghost" size="sm" onClick={onExit} ariaLabel="Esci dalla sessione">
          Esci
        </Btn>
      </div>
    </div>
  )

  // L'esempio svolto è visibile nella fase di dimostrazione, prima delle
  // alternative; dopo un errore ricompare come modello completo.
  const modelPanel = showModel ? (
    <div className="worked-example">
      <h3>{model.title}</h3>
      <ol className="worked-example__steps">
        {model.steps.map((step, stepIndex) => (
          <li key={stepIndex}>{step}</li>
        ))}
      </ol>
      {model.answer && (
        <p className="worked-example__answer">
          La risposta è <strong>{model.answer}</strong>.
        </p>
      )}
      <SpeakButton
        text={`${model.title}. ${model.steps.join(' ')}`}
        rate={speechRate}
        volume={speechVolume}
        label="Ascolta il ragionamento"
        size="sm"
      />
    </div>
  ) : null

  const hintPanel = (
    <div className="exercise__hints">
      {hint > 0 && exercise.cue && <p className="hint-text">Indizio: {exercise.cue}</p>}
      {tries > 0 && <Btn variant="secondary" size="sm" onClick={showNextHint}>Mostrami un altro indizio</Btn>}
      {phase !== 'modellamento' && modelPanel}
    </div>
  )

  const footer = (
    <div className="exercise__footer">
      {outcome === 'retry' && (
        <Feedback status="retry">
          {analysis ? (
            <div className="error-analysis">
              <p className="error-analysis__headline">{analysis.headline}</p>
              <p>{analysis.explanation}</p>
            </div>
          ) : (
            <p>Riguardiamo insieme, con calma.</p>
          )}
          {hintPanel}
        </Feedback>
      )}
      {outcome === 'correct' && (
        <Feedback status="correct">
          <p>
            {exercise.explanation ?? 'Hai trovato la risposta!'}
            {exercise.cue ? ` ${exercise.cue}` : ''}
          </p>
        </Feedback>
      )}
      <div className="exercise__actions">
        {outcome === 'correct' && (
          <Btn variant="primary" size="lg" onClick={() => onResolved({ correct: true, usedHint: hint > 0 || tries > 0, hintLevel: hint, modality: 'tap' })}>
            Avanti
          </Btn>
        )}
        {!outcome && (
          <>
            <Btn variant="secondary" onClick={showNextHint}>
              Aiuto
            </Btn>
            <Btn variant="ghost" onClick={onSkip}>
              Passa
            </Btn>
          </>
        )}
        {outcome === 'correct' && exercise.explanation && (
          <SpeakButton
            text={exercise.explanation}
            rate={speechRate}
            volume={speechVolume}
            label="Ascolta la spiegazione"
            size="sm"
          />
        )}
        {outcome === 'retry' && (
          <Btn variant="secondary" size="lg" onClick={() => setOutcome(null)}>
            Riprova
          </Btn>
        )}
      </div>
    </div>
  )

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'r' || e.key === 'R') speak(promptText, { rate: speechRate, volume: speechVolume })
      if (e.key === 'h' || e.key === 'H') showNextHint()
      const n = Number(e.key)
      if (Number.isFinite(n) && n >= 1 && n <= 9) {
        const option = options[n - 1]
        if (option) {
          e.preventDefault()
          chooseSingle(option.id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (exercise.kind === 'choose-image' || exercise.kind === 'odd-one-out') {
    return (
      <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
        {header}
        {phaseBanner}
        <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
          {exercise.prompt}
        </h2>
        {phase === 'modellamento' && modelPanel}
        {exercise.criterion && <p className="exercise__criterion">Criterio: {exercise.criterion}</p>}
        <div className={`picture-grid picture-grid--${Math.min(options.length, 6)}`}>
          {options.map((option, i) => {
            const concept = option.conceptId ? getConcept(option.conceptId) : undefined
            const isCorrect = exercise.correct.includes(option.id)
            return (
              <div className="picture-item" key={option.id}>
                <Picture
                  src={option.image}
                  alt={concept?.definition ?? option.label ?? 'Immagine'}
                  label={option.label ?? concept?.lemma}
                  showLabel={showLabels}
                  size={options.length <= 3 ? 'lg' : 'md'}
                  selected={selected.includes(option.id)}
                  state={
                    (outcome === 'correct' && isCorrect) || (phase === 'modellamento' && isCorrect)
                      ? 'correct'
                      : outcome === 'retry' && selected.includes(option.id)
                        ? 'wrong'
                        : 'neutral'
                  }
                  scanned={scanIndex === i}
                  onClick={() => chooseSingle(option.id)}
                  badge={<span className="picture__key" aria-hidden="true">{i + 1}</span>}
                />
                <SpeakInline
                  className="picture-item__speak"
                  text={`${option.label ?? concept?.lemma ?? 'Immagine'}. ${concept?.definition ?? ''}`.trim()}
                  rate={speechRate}
                  volume={speechVolume}
                  label={`Ascolta ${option.label ?? concept?.lemma ?? 'l\'immagine'}`}
                />
              </div>
            )
          })}
        </div>
        {footer}
      </section>
    )
  }

  if (exercise.kind === 'choose-label') {
    const labelOptions = exercise.options ?? []
    const asImages = !profile.showText && labelOptions.every((o) => o.image)
    return (
      <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
        {header}
        {phaseBanner}
        <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
          {exercise.prompt}
        </h2>
        {phase === 'modellamento' && modelPanel}
        {promptConcept && exercise.moduleId !== 'm7' && exercise.moduleId !== 'm8' && (
          <div className="exercise__prompt-image">
            <Picture
              src={primaryImage(promptConcept)}
              alt={promptConcept.definition}
              label={promptConcept.lemma}
              showLabel={false}
              size="hero"
            />
          </div>
        )}
        {asImages ? (
          <div className="picture-grid picture-grid--3">
            {labelOptions
              .filter((o) => !hidden.includes(o.id))
              .map((option, i) => {
                const optionConcept = option.conceptId ? getConcept(option.conceptId) : undefined
                return (
                  <div className="picture-item" key={option.id}>
                    <Picture
                      src={option.image}
                      alt={option.label ?? ''}
                      label={option.label}
                      showLabel={false}
                      selected={selected.includes(option.id)}
                      state={
                        (outcome === 'correct' || phase === 'modellamento') && exercise.correct.includes(option.id)
                          ? 'correct'
                          : outcome === 'retry' && selected.includes(option.id)
                            ? 'wrong'
                            : 'neutral'
                      }
                      scanned={scanIndex === i}
                      onClick={() => chooseSingle(option.id)}
                    />
                    <SpeakInline
                      className="picture-item__speak"
                      text={`${option.label ?? ''}. ${optionConcept?.definition ?? ''}`.trim()}
                      rate={speechRate}
                      volume={speechVolume}
                      label={`Ascolta ${option.label ?? 'la risposta'}`}
                    />
                  </div>
                )
              })}
          </div>
        ) : (
          <>
          <div className="actions-row">
            <SpeakButton
              text={labelOptions.map((o) => o.label).filter(Boolean).join('. ')}
              rate={speechRate}
              volume={speechVolume}
              label="Ascolta le risposte possibili"
              size="sm"
            />
          </div>
          <div className="label-grid">
            {labelOptions
              .filter((o) => !hidden.includes(o.id))
              .map((option) => {
                const isCorrect = exercise.correct.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`label-option ${selected.includes(option.id) ? 'is-selected' : ''} ${
                      (outcome === 'correct' || phase === 'modellamento') && isCorrect
                        ? 'is-correct'
                        : outcome === 'retry' && selected.includes(option.id)
                          ? 'is-wrong'
                          : ''
                    }`}
                    onClick={() => {
                      chooseSingle(option.id)
                      if (option.label) speak(option.label, { rate: speechRate, volume: speechVolume })
                    }}
                    aria-label={`Risposta: ${option.label}`}
                  >
                    <span className="label-option__text">{option.label}</span>
                  </button>
                )
              })}
          </div>
          </>
        )}
        {footer}
      </section>
    )
  }

  if (exercise.kind === 'multi-select') {
    const toggle = (id: string) => {
      if (outcome === 'correct') return
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }
    return (
      <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
        {header}
        {phaseBanner}
        <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
          {exercise.prompt}
        </h2>
        {phase === 'modellamento' && modelPanel}
        <p className="exercise__hint-line">Puoi scegliere più di una risposta, poi tocca “Conferma”.</p>
        <div className="picture-grid picture-grid--4">
          {(exercise.options ?? [])
            .filter((o) => !hidden.includes(o.id))
            .map((option) => {
              const concept = option.conceptId ? getConcept(option.conceptId) : undefined
              return (
                <div className="picture-item" key={option.id}>
                  <Picture
                    src={option.image}
                    alt={concept?.definition ?? option.label ?? ''}
                    label={option.label ?? concept?.lemma}
                    showLabel={showLabels}
                    selected={selected.includes(option.id)}
                    state={outcome === 'correct' && exercise.correct.includes(option.id) ? 'correct' : 'neutral'}
                    onClick={() => toggle(option.id)}
                  />
                  <SpeakInline
                    className="picture-item__speak"
                    text={`${option.label ?? concept?.lemma ?? 'Immagine'}. ${concept?.definition ?? ''}`.trim()}
                    rate={speechRate}
                    volume={speechVolume}
                    label={`Ascolta ${option.label ?? concept?.lemma ?? 'l\'immagine'}`}
                  />
                </div>
              )
            })}
        </div>
        <div className="exercise__actions">
          <Btn
            variant="primary"
            size="lg"
            disabled={!selected.length || outcome === 'correct'}
            onClick={() => {
              if (isCorrectSelection(exercise, selected)) succeed()
              else fail(selected)
            }}
          >
            Conferma
          </Btn>
        </div>
        {footer}
      </section>
    )
  }

  if (exercise.kind === 'pair-match') {
    const pairs = exercise.pairs ?? []
    const right = pairs.map((p) => p.right)
    const chooseLeft = (id: string) => setPendingLeft(id)
    const chooseRight = (rightId: string) => {
      if (!pendingLeft) return
      setMapping((prev) => ({ ...prev, [pendingLeft]: rightId }))
      setPendingLeft(null)
      const expected = pairs.find((p) => p.left.id === pendingLeft)?.right.id
      if (expected !== rightId) {
        failWith(analysePair(exercise, pendingLeft, rightId))
      }
    }
    const all = pairs.length > 0 && pairs.every((p) => mapping[p.left.id])
    return (
      <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
        {header}
        {phaseBanner}
        <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
          {exercise.prompt}
        </h2>
        {phase === 'modellamento' && modelPanel}
        <p className="exercise__hint-line">Tocca un'immagine a sinistra, poi la sua compagna a destra.</p>
        <div className="pair-columns">
          <div className="pair-column" role="group" aria-label="Prima colonna">
            {pairs.map((p) => (
              <button
                key={p.left.id}
                type="button"
                className={`pair-item ${pendingLeft === p.left.id ? 'is-active' : ''} ${mapping[p.left.id] ? 'is-matched' : ''}`}
                onClick={() => chooseLeft(p.left.id)}
                aria-pressed={pendingLeft === p.left.id}
              >
                <Picture src={p.left.image} alt={p.left.label ?? ''} label={p.left.label} showLabel={showLabels} size="sm" />
                <span className="pair-item__link" aria-hidden="true">
                  {mapping[p.left.id] ? '→' : '•'}
                </span>
              </button>
            ))}
          </div>
          <div className="pair-column" role="group" aria-label="Seconda colonna">
            {right.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`pair-item ${Object.values(mapping).includes(r.id) ? 'is-used' : ''}`}
                onClick={() => chooseRight(r.id)}
              >
                <Picture src={r.image} alt={r.label ?? ''} label={r.label} showLabel={showLabels} size="sm" />
              </button>
            ))}
          </div>
        </div>
        <div className="exercise__actions">
          <Btn
            variant="primary"
            size="lg"
            disabled={!all}
            onClick={() => {
              if (matchingPairsCorrect(exercise, mapping)) {
                succeed()
              } else {
                const wrong = pairs.find((p) => mapping[p.left.id] !== p.right.id)
                failWith(wrong ? analysePair(exercise, wrong.left.id, mapping[wrong.left.id] ?? '') : analyseSelection(exercise, []))
              }
            }}
          >
            Conferma
          </Btn>
          <Btn variant="ghost" onClick={onSkip}>
            Passa
          </Btn>
        </div>
        {footer}
      </section>
    )
  }

  if (exercise.kind === 'ordering' || exercise.kind === 'sentence-build') {
    const tokens = exercise.kind === 'sentence-build' ? exercise.sentence?.tokens ?? [] : exercise.options ?? []
    const remaining = tokens.filter((t) => !order.includes(t.id))
    const sequence = exercise.sequence ?? exercise.sentence?.correctOrder ?? []
    return (
      <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
        {header}
        {phaseBanner}
        <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
          {exercise.prompt}
        </h2>
        {phase === 'modellamento' && modelPanel}
        <div className="sequence" aria-live="polite" aria-label="Sequenza scelta">
          {order.length === 0 && <span className="sequence__placeholder">Tocca i simboli per metterli in ordine.</span>}
          {order.map((id) => {
            const token = tokens.find((t) => t.id === id)
            return (
              <button
                key={id}
                type="button"
                className="token token--placed"
                onClick={() => setOrder((prev) => prev.filter((x) => x !== id))}
                aria-label={`Rimuovi ${token?.label ?? ''}`}
              >
                {token?.image && <img src={token.image} alt="" />}
                <span>{token?.label}</span>
              </button>
            )
          })}
        </div>
        <div className="token-row" role="group" aria-label="Simboli disponibili">
          {remaining.map((token) => (
            <button key={token.id} type="button" className="token" onClick={() => setOrder((prev) => [...prev, token.id])}>
              {token.image && <img src={token.image} alt="" />}
              <span>{token.label}</span>
            </button>
          ))}
        </div>
        <div className="exercise__actions">
          <Btn
            variant="primary"
            size="lg"
            disabled={order.length !== sequence.length}
            onClick={() => {
              if (orderedCorrect(exercise, order)) succeed()
              else failWith(analyseOrder(exercise, order))
            }}
          >
            Conferma
          </Btn>
          <Btn variant="ghost" onClick={() => setOrder([])}>
            Ricomincia
          </Btn>
        </div>
        {footer}
      </section>
    )
  }

  if (exercise.kind === 'categorize') {
    const items = exercise.options ?? []
    const bins = exercise.bins ?? []
    const unplaced = items.filter((i) => !placement[i.id])
    const place = (binId: string) => {
      if (!activeItem) return
      setPlacement((prev) => ({ ...prev, [activeItem]: binId }))
      setActiveItem(null)
    }
    return (
      <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
        {header}
        {phaseBanner}
        <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
          {exercise.prompt}
        </h2>
        {phase === 'modellamento' && modelPanel}
        <div className="categorize">
          <div className="categorize__items" role="group" aria-label="Elementi da collocare">
            {unplaced.map((item) => (
              <Picture
                key={item.id}
                src={item.image}
                alt={item.label ?? ''}
                label={item.label}
                showLabel={showLabels}
                selected={activeItem === item.id}
                onClick={() => setActiveItem(item.id)}
                size="sm"
              />
            ))}
          </div>
          <div className="categorize__bins">
            {bins.map((bin) => (
              <button
                key={bin.id}
                type="button"
                className="bin"
                onClick={() => place(bin.id)}
                disabled={!activeItem}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain')
                  if (id) setPlacement((prev) => ({ ...prev, [id]: bin.id }))
                }}
              >
                <span className="bin__label">{bin.label}</span>
                <span className="bin__contents">
                  {bin.accepts
                    .filter((id) => placement[id] === bin.id)
                    .map((id) => {
                      const option = items.find((i) => i.id === id)
                      return (
                        <span key={id} className="bin__chip">
                          {option?.image && <img src={option.image} alt="" />}
                          <span>{option?.label}</span>
                        </span>
                      )
                    })}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="exercise__actions">
          <Btn
            variant="primary"
            size="lg"
            disabled={Object.keys(placement).length !== items.length}
            onClick={() => {
              if (categorizeCorrect(exercise, placement)) succeed()
              else failWith(analyseCategorize(exercise, placement, items))
            }}
          >
            Conferma
          </Btn>
          <Btn variant="ghost" onClick={() => { setPlacement({}); setActiveItem(null) }}>
            Ricomincia
          </Btn>
        </div>
        {footer}
      </section>
    )
  }

  if (exercise.kind === 'spatial-place') {
    const scene = exercise.scene
    const ref = scene ? requireConcept(scene.referenceConceptId) : undefined
    const obj = scene ? requireConcept(scene.objectConceptId) : undefined
    return (
      <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
        {header}
        {phaseBanner}
        <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
          {exercise.prompt}
        </h2>
        {phase === 'modellamento' && modelPanel}
        <div className="spatial-scene" role="group" aria-label="Scena da completare">
          <div className="spatial-scene__reference">
            {ref && <img src={primaryImage(ref)} alt={ref.definition} />}
            <span>{ref?.lemma}</span>
          </div>
          {scene?.zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className={`spatial-zone ${placedZone === zone.id ? 'is-placed' : ''}`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
              onClick={() => {
                setPlacedZone(zone.id)
                if (zone.id === scene.correctZone) {
                  succeed()
                } else {
                  failWith({
                    kind: 'fuori-tema',
                    headline: 'Guardiamo la posizione',
                    explanation: `La richiesta era: «${exercise.prompt}» Riascoltala e prova un'altra zona.`,
                    cue: obj ? `${obj.lemma}: ${obj.definition}` : undefined,
                    targetLemma: obj?.lemma,
                  })
                }
              }}
              aria-label={`Posizione ${zone.label}`}
              aria-pressed={placedZone === zone.id}
            >
              {placedZone === zone.id && obj && <img src={primaryImage(obj)} alt={obj.lemma} />}
              <span className="spatial-zone__label">{zone.label}</span>
            </button>
          ))}
        </div>
        {footer}
      </section>
    )
  }

  if (exercise.kind === 'open-recall') {
    const concept = target ?? (exercise.conceptIds[0] ? requireConcept(exercise.conceptIds[0]) : undefined)
    const cues = concept ? recallCueLadder(concept) : []
    const showAlternatives = hint >= 4
    return (
      <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
        {header}
        {phaseBanner}
        <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
          {exercise.prompt}
        </h2>
        {concept && (
          <div className="recall">
            <Picture src={primaryImage(concept)} alt={concept.definition} label={concept.lemma} size="hero" />
            <div className="recall__cues">
              <SpeakButton
                text={[`${concept.lemma}. ${concept.definition}`, ...cues].join(' ')}
                rate={speechRate}
                volume={speechVolume}
                label="Ascolta la parola e gli indizi"
              />
              {hint > 0 && cues.slice(0, Math.min(hint, cues.length)).map((cue, i) => (
                <p key={i} className="hint-text">
                  {cue}
                </p>
              ))}
              {hint >= 5 && concept && <p className="hint-text">La parola inizia con: {phonologicalCue(concept)}</p>}
              {hint >= 6 && <p className="model-text"><strong>Modello:</strong> {concept.lemma}. {concept.definition}</p>}
              {showAlternatives && concept && (
                <div className="picture-grid picture-grid--3">
                  {(exercise.options ?? []).map((option) => (
                    <Picture
                      key={option.id}
                      src={option.image}
                      alt={option.label ?? ''}
                      label={option.label}
                      showLabel={showLabels}
                      size="sm"
                      onClick={() => {
                        if (option.conceptId === concept.id) {
                          setHint((h) => Math.max(6, h))
                          succeed(Math.max(5, hint))
                        } else {
                          fail([option.id])
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="exercise__self-assessment">
          <p className="exercise__hint-line">
            Hai trovato la parola? Puoi rispondere parlando, con un gesto o con i simboli. L'adulto o il bambino scelgono:
          </p>
          <Btn variant="primary" size="lg" onClick={() => succeed(hint)}>
            L'ho detto da solo
          </Btn>
          <Btn variant="secondary" size="lg" onClick={() => { setHint((h) => Math.max(2, h)); succeed(2) }}>
            Con un aiuto
          </Btn>
          <Btn variant="ghost" size="lg" onClick={() => { showNextHint(); setOutcome('retry') }}>
            Non ancora
          </Btn>
        </div>
        {footer}
      </section>
    )
  }

  // ---------------- open-describe ----------------
  const slotsData = exercise.describe?.length ? exercise.describe : target ? describeSlots(target) : []
  const acceptedCount = Object.values(slots).filter((s) => s.accepted).length
  return (
    <section className="exercise" aria-labelledby={`ex-${exercise.id}`}>
      {header}
      {phaseBanner}
      <h2 className="exercise__prompt" id={`ex-${exercise.id}`}>
        {exercise.prompt}
      </h2>
      <div className="describe">
        {target && (
          <div className="describe__object">
            <Picture src={primaryImage(target)} alt={target.definition} label={target.lemma} size="hero" showLabel={profile.showText} />
            <p>{target.definition}</p>
            <SpeakButton
              text={`${target.lemma}. ${target.definition}. ${slotsData.map((slot) => slot.question).join(' ')}`}
              rate={speechRate}
              volume={speechVolume}
              label="Ascolta la descrizione e le domande"
              size="sm"
            />
          </div>
        )}
        <div className="describe__slots">
          {slotsData.map((slot, slotIndex) => {
            const state = slots[slotIndex]
            return (
              <div key={slot.question} className={`describe__slot ${state?.accepted ? 'is-accepted' : ''}`}>
                <h3>{slot.question}</h3>
                <p className="describe__help">{slot.help}</p>
                {slot.options.length > 0 ? (
                  <div className="describe__options">
                    {slot.options.map((option) => {
                      const chosen = state?.choice === option.id
                      const isMatch = slot.correct.includes(option.id)
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`describe__option ${chosen ? 'is-chosen' : ''} ${chosen && isMatch ? 'is-correct' : ''} ${chosen && !isMatch ? 'is-manual' : ''}`}
                          onClick={() =>
                            setSlots((prev) => ({
                              ...prev,
                              [slotIndex]: { choice: option.id, accepted: isMatch },
                            }))
                          }
                          aria-pressed={chosen}
                        >
                          {option.image && <img src={option.image} alt="" />}
                          <span>{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="describe__open">Risposta libera: verbale, gestuale o con la barra dei simboli.</p>
                )}
                <div className="describe__slot-actions">
                  <Btn
                    variant={state?.accepted ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSlots((prev) => ({ ...prev, [slotIndex]: { choice: state?.choice ?? 'adult', accepted: true } }))}
                  >
                    {state?.accepted ? 'Accettata' : 'Accetta la risposta'}
                  </Btn>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="exercise__actions">
        <Btn
          variant="primary"
          size="lg"
          onClick={() => {
            const totalSlots = Math.max(1, slotsData.length)
            const ok = acceptedCount / totalSlots >= 0.5
            setOutcome(ok ? 'correct' : 'retry')
            setHint(2)
            record({ correct: ok, usedHint: true, hintLevel: 2, modality: 'adult-confirmed' })
            if (!ok) setTries((t) => t + 1)
          }}
        >
          Concludi descrizione
        </Btn>
        <Btn variant="ghost" onClick={onSkip}>
          Passa
        </Btn>
      </div>
      {footer}
    </section>
  )
}

export interface PlaylistResult {
  completed: number
  correct: number
  aided: number
  skipped: number
  concepts: string[]
}

export function ExercisePlayer({
  exercises,
  startWithModel,
  onComplete,
  onExit,
  onCurrentWord,
}: {
  exercises: Exercise[]
  /** Mini-lezione da scheda parola: si parte dalla dimostrazione. */
  startWithModel?: boolean
  onComplete: (result: PlaylistResult) => void
  onExit: () => void
  onCurrentWord?: (word?: string) => void
}) {
  const { activeProfile } = useStore()
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<PlaylistResult>({ completed: 0, correct: 0, aided: 0, skipped: 0, concepts: [] })
  const current = exercises[index]
  // L'impalcatura didattica è calcolata una volta: non cambia mentre il bambino
  // lavora, così la fase non "salta" dopo una risposta.
  const plan = useMemo(() => planSession(exercises, { startWithModel }), [exercises, startWithModel])
  const phase = plan[index]?.phase

  // La barra CAA può pronunciare e inserire nella frase la parola in gioco.
  useEffect(() => {
    const concept = current?.targetConceptId ? CONCEPT_BY_ID.get(current.targetConceptId) : undefined
    onCurrentWord?.(concept?.lemma)
    return () => onCurrentWord?.(undefined)
  }, [current?.id, current?.targetConceptId, onCurrentWord])

  if (!activeProfile) {
    return (
      <div className="panel">
        <p>Seleziona un profilo per iniziare.</p>
        <Btn onClick={onExit}>Torna indietro</Btn>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="panel">
        <h2>Sessione conclusa</h2>
        <p>Hai completato {result.completed} attività.</p>
        <Btn onClick={() => onComplete(result)}>Vedi il riepilogo</Btn>
      </div>
    )
  }

  const next = (patch: Partial<PlaylistResult>) => {
    const merged: PlaylistResult = {
      ...result,
      ...patch,
      completed: result.completed + 1,
      concepts: [...new Set([...result.concepts, ...current.conceptIds])],
    }
    if (index + 1 >= exercises.length) {
      onComplete(merged)
    } else {
      setResult(merged)
      setIndex((i) => i + 1)
    }
  }

  return (
    <ExerciseView
      key={`${current.id}-${index}`}
      exercise={current}
      profile={activeProfile}
      index={index + 1}
      total={exercises.length}
      onResolved={(r) =>
        next({
          correct: result.correct + (r.correct ? 1 : 0),
          aided: result.aided + (r.usedHint ? 1 : 0),
        })
      }
      onSkip={() => next({ skipped: result.skipped + 1 })}
      onExit={onExit}
      phase={phase}
    />
  )
}

/** Riepilogo leggibile di una sessione. */
export function SessionSummaryView({
  result,
  onRestart,
  onHome,
}: {
  result: PlaylistResult
  onRestart: () => void
  onHome: () => void
}) {
  const { stats, activeProfile } = useStore()
  const toReview = result.concepts
    .map((id) => stats.get(id))
    .filter((s) => s && s.streak === 0)
    .map((s) => CONCEPT_BY_ID.get(s!.conceptId)?.lemma)
    .filter(Boolean)

  const allStats = [...stats.values()]
  const thresholds = {
    sessions: activeProfile?.masterySessions ?? 2,
    kinds: activeProfile?.masteryKinds ?? 3,
    accuracy: activeProfile?.masteryAccuracy ?? 0.75,
    independent: 3,
  }
  const sessionStats = result.concepts
    .map((id) => stats.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
  const didactic = sessionDidacticSummary(result.concepts, allStats)
  const transfer = transferTask(result.concepts)
  // Il prossimo passo guarda le parole della sessione, non l'intero archivio:
  // è una proposta vicina a ciò che il bambino ha appena fatto.
  const nextStep = nextStepRecommendation(sessionStats.length ? sessionStats : allStats, thresholds)

  return (
    <div className="panel session-summary">
      <h2>Bene! Sessione conclusa</h2>
      <p className="session-summary__lead">
        {result.completed} attività svolte, {didactic.total} parole incontrate
        {didactic.fresh > 0 ? ` (${didactic.fresh} nuove)` : ''}. Non è un voto: è il punto da cui ripartire.
      </p>
      <ul className="summary-stats">
        <li>
          <strong>{result.correct}</strong> risposte trovate
        </li>
        <li>
          <strong>{result.aided}</strong> con un aiuto
        </li>
        <li>
          <strong>{result.skipped}</strong> saltate
        </li>
      </ul>

      {toReview.length > 0 && (
        <div className="summary-review">
          <h3>Da riprendere con calma</h3>
          <p>{toReview.join(', ')}</p>
        </div>
      )}

      {result.concepts.length > 0 && (
        <div className="summary-words">
          <h3>Le parole di oggi</h3>
          <p className="muted">Tocca una parola per riascoltarla. Puoi farlo anche domani, senza fretta.</p>
          <ul className="summary-words__list">
            {result.concepts.slice(0, 12).map((id) => {
              const concept = CONCEPT_BY_ID.get(id)
              if (!concept) return null
              return (
                <li key={id} className="summary-word">
                  <span className="summary-word__lemma">{concept.lemma}</span>
                  <SpeakInline
                    text={`${concept.lemma}. ${concept.definition}`}
                    rate={activeProfile?.ttsRate}
                    volume={activeProfile?.ttsVolume}
                    label={`Ascolta ${concept.lemma}`}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="summary-transfer">
        <h3>{transfer.title}</h3>
        <p className="muted">
          Il transfer è la parte più importante: la parola serve se serve fuori dallo schermo.
        </p>
        <ol>
          {transfer.tasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ol>
        <SpeakButton
          text={`${transfer.title}. ${transfer.tasks.join(' ')}`}
          rate={activeProfile?.ttsRate}
          volume={activeProfile?.ttsVolume}
          label="Ascolta le attività da fare fuori dallo schermo"
          size="sm"
        />
      </div>

      {nextStep && (
        <div className="summary-next">
          <h3>Prossimo passo: {nextStep.title}</h3>
          <p>{nextStep.why}</p>
        </div>
      )}

      <div className="exercise__actions">
        <Btn variant="primary" size="lg" onClick={onHome}>
          Torna al menu
        </Btn>
        <Btn variant="secondary" size="lg" onClick={onRestart}>
          Un'altra sessione
        </Btn>
      </div>
    </div>
  )
}

export function ConceptRelationList({ conceptId }: { conceptId: string }) {
  const concept = getConcept(conceptId)
  if (!concept) return null
  return (
    <ul className="relation-list">
      <li>
        <span className="relation-tag">è un tipo di</span> {CATEGORY_BY_ID.get(concept.category)?.label}
      </li>
      {concept.relations.map((r, i) => (
        <li key={`${r.type}-${r.target}-${i}`}>
          <span className="relation-tag">{RELATION_LABELS[r.type] ?? relationLabel(r.type)}</span>{' '}
          {CONCEPT_BY_ID.get(r.target)?.lemma ?? CATEGORY_BY_ID.get(r.target)?.label ?? r.target}
          {r.note ? <em> — {r.note}</em> : null}
        </li>
      ))}
    </ul>
  )
}
