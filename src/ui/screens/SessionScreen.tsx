import { useMemo, useState } from 'react'
import { useStore } from '../../state/store'
import { EXERCISE_BANK } from '../../data/bank'
import { composeSession, interleaveByModule, type SessionRequest } from '../../engine/session'
import type { Exercise } from '../../engine/exercise'
import type { Attempt } from '../../engine/adaptive'
import { requireConcept, primaryImage } from '../../data/lexicon'
import { ExercisePlayer, SessionSummaryView, type PlaylistResult } from '../SessionPlayer'
import { Btn, Card, SpeakInline } from '../components'
import { MODULE_BY_ID } from '../../data/modules'
import { shuffle } from '../../engine/generator'
import type { Navigate } from '../routes'

/** Esercizi costruiti dalle foto e dalle parole aggiunte dall'adulto. */
function buildCustomExercises(custom: { id: string; lemma: string; image: string; definition: string }[]): Exercise[] {
  if (custom.length < 2) return []
  return custom.map((target, index) => {
    const distractors = custom.filter((c) => c.id !== target.id).slice(0, 2)
    const options = shuffle(
      [
        { id: target.id, label: target.lemma, image: target.image, conceptId: target.id },
        ...distractors.map((d) => ({ id: d.id, label: d.lemma, image: d.image, conceptId: d.id })),
      ],
      `custom:${target.id}`,
    )
    return {
      id: `custom-${target.id}-${index}`,
      moduleId: 'm1',
      kind: 'choose-image',
      level: 2,
      prompt: `Tocca ${target.lemma}.`,
      conceptIds: [target.id],
      targetConceptId: target.id,
      options,
      correct: [target.id],
      explanation: target.definition,
      scoring: 'objective',
      origin: 'bank',
      alternatives: options.length,
    } satisfies Exercise
  })
}

export function SessionScreen({
  request,
  label,
  fixed,
  onExit,
  onRestart,
  onNavigate,
  onCurrentWord,
}: {
  request: SessionRequest
  label?: string
  /** Lezione costruita altrove (scheda parola): sostituisce la composizione. */
  fixed?: Exercise[]
  onExit: () => void
  onRestart: () => void
  onNavigate: Navigate
  onCurrentWord?: (word?: string) => void
}) {
  const { activeProfile, stats, customConcepts, saveSession } = useStore()
  const [result, setResult] = useState<PlaylistResult | null>(null)
  const startedAt = useMemo(() => Date.now(), [])

  const exercises = useMemo(() => {
    if (!activeProfile) return []
    if (fixed?.length) return fixed.slice(0, Math.max(1, request.count))
    const usableModules = request.moduleIds.filter((id) => id !== 'm19' && id !== 'm20')
    const withCustom = request.moduleIds.includes('custom')
    const bank: Exercise[] = [...EXERCISE_BANK]
    if (withCustom) bank.push(...buildCustomExercises(customConcepts))
    const baseRequest: SessionRequest = {
      ...request,
      moduleIds: usableModules.length ? usableModules : ['m1'],
      targetConceptIds:
        request.targetConceptIds ??
        (withCustom ? customConcepts.map((c) => c.id) : undefined),
    }
    const composed = composeSession(bank, baseRequest, [...stats.values()])
    return interleaveByModule(composed.exercises).slice(0, request.count)
    // La sessione viene costruita una sola volta: i tentativi non la modificano.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!activeProfile) {
    return (
      <div className="page">
        <p>Seleziona un profilo.</p>
        <Btn onClick={() => onNavigate({ name: 'home' })}>Torna all'inizio</Btn>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="page">
        <Card>
          <h1>Nessuna attività disponibile</h1>
          <p>
            Per questa combinazione non ci sono esercizi validi. Prova a scegliere un altro modulo o un livello diverso
            nell'area adulti.
          </p>
          <div className="actions-row">
            <Btn onClick={onExit}>Torna al menu</Btn>
            <Btn variant="secondary" onClick={() => onNavigate({ name: 'teacher' })}>
              Area adulti
            </Btn>
          </div>
        </Card>
      </div>
    )
  }

  const finish = (playlist: PlaylistResult) => {
    const attempts = playlist.completed
    void attempts
    saveSession({
      id: `sess-${startedAt.toString(36)}`,
      profileId: activeProfile.id,
      startedAt,
      endedAt: Date.now(),
      moduleIds: request.moduleIds,
      exercises: playlist.completed,
      correct: playlist.correct,
      aided: playlist.aided,
      skipped: playlist.skipped,
    })
    setResult(playlist)
  }

  if (result) {
    return (
      <div className="page">
        <SessionSummaryView result={result} onHome={onExit} onRestart={onRestart} />
      </div>
    )
  }

  // Guida didattica per l'adulto: sta accanto alla sessione, non davanti.
  // Non è un tutorial: sono le indicazioni che servono mentre il bambino lavora.
  const guidedModules = request.moduleIds
    .map((id) => MODULE_BY_ID.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .slice(0, 2)

  return (
    <div className="page page--session">
      <div className="session-banner">
        <span className="session-banner__label">{label ?? 'Sessione'}</span>
        <span className="muted">
          {exercises.length} attività · livello {request.level} · modalità {request.mode}
        </span>
      </div>

      <details className="adult-guide">
        <summary>Per l'adulto: come condurre questa sessione</summary>
        <div className="adult-guide__body">
          <p>
            La sessione segue quattro momenti: <strong>riscaldamento</strong> con una parola nota,{' '}
            <strong>dimostrazione</strong> in cui il ragionamento è esplicito, <strong>pratica guidata</strong> con aiuti
            disponibili e <strong>pratica autonoma</strong> senza riduzione automatica delle alternative. Chiude un
            compito da svolgere senza dispositivo.
          </p>
          {guidedModules.map((module) => (
            <div key={module.id} className="adult-guide__module">
              <div className="heading-with-speak">
                <h3>{module.title}</h3>
                <SpeakInline
                  text={`${module.title}. ${module.goal}`}
                  rate={activeProfile.ttsRate}
                  volume={activeProfile.ttsVolume}
                  label={`Ascolta l'obiettivo del modulo ${module.title}`}
                />
              </div>
              <p className="muted">{module.goal}</p>
              <ul>
                {module.guidance.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="muted">
            Non correggere la pronuncia e non togliere tempo: l'autonomia e l'aiuto sono registrati separatamente.
          </p>
        </div>
      </details>

      <ExercisePlayer
        exercises={exercises}
        startWithModel={Boolean(fixed?.length)}
        onComplete={finish}
        onExit={onExit}
        onCurrentWord={onCurrentWord}
      />
    </div>
  )
}

/** Utilità usata dai test e dalla dashboard: numero di tentativi registrabili. */
export type SessionAttempt = Attempt

export function exercisePreviewImage(exercise: Exercise): string | undefined {
  const id = exercise.conceptIds[0]
  if (!id) return undefined
  return primaryImage(requireConcept(id))
}
