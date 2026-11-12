import { useMemo } from 'react'
import { useStore } from '../../state/store'
import { CONCEPT_BY_ID } from '../../data/lexicon'
import { moduleTitle } from '../../data/modules'
import { statusOf, summarize, type ConceptStatus } from '../../engine/adaptive'
import { nextStepRecommendation } from '../../engine/pedagogy'
import { Btn, Card, EmptyState, Progress } from '../components'

const STATUS_LABELS: Record<ConceptStatus, string> = {
  nuovo: 'Nuova',
  'in-apprendimento': 'In apprendimento',
  'in-consolidamento': 'In consolidamento',
  consolidato: 'Consolidata',
  'da-ripassare': 'Da riprendere',
}

function download(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '')
          return /[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
        })
        .join(';'),
    )
    .join('\n')
}

/**
 * Dashboard dei progressi. Le dimensioni restano separate: comprensione
 * recettiva, competenza espressiva, profondità semantica e autonomia non
 * vengono fuse in un unico punteggio.
 */
export function Dashboard() {
  const { activeProfile, attempts, stats, sessions } = useStore()

  const summary = useMemo(() => summarize([...stats.values()]), [stats])
  const nextStep = useMemo(
    () =>
      activeProfile
        ? nextStepRecommendation([...stats.values()], {
            sessions: activeProfile.masterySessions,
            kinds: activeProfile.masteryKinds,
            accuracy: activeProfile.masteryAccuracy,
            independent: 3,
          })
        : null,
    [activeProfile, stats],
  )

  const dimensions = useMemo(() => {
    const receptive = attempts.filter((a) =>
      ['choose-image', 'choose-label', 'multi-select', 'odd-one-out', 'spatial-place', 'ordering', 'categorize', 'pair-match', 'sentence-build'].includes(a.kind),
    )
    const expressive = attempts.filter((a) => a.kind === 'open-recall' || a.kind === 'open-describe')
    const depth = attempts.filter((a) =>
      ['m2', 'm4', 'm5', 'm14', 'm19', 'm6', 'm18'].includes(a.moduleId),
    )
    const ratio = (list: typeof attempts) => (list.length ? list.filter((a) => a.correct).length / list.length : 0)
    const aided = attempts.length ? attempts.filter((a) => a.usedHint).length / attempts.length : 0
    return {
      receptive: ratio(receptive),
      expressive: ratio(expressive),
      depth: ratio(depth),
      autonomy: 1 - aided,
      receptiveCount: receptive.length,
      expressiveCount: expressive.length,
      depthCount: depth.length,
      attempts: attempts.length,
    }
  }, [attempts])

  const byModule = useMemo(() => {
    const map = new Map<string, { total: number; correct: number; aided: number }>()
    for (const a of attempts) {
      const entry = map.get(a.moduleId) ?? { total: 0, correct: 0, aided: 0 }
      entry.total++
      if (a.correct) entry.correct++
      if (a.usedHint) entry.aided++
      map.set(a.moduleId, entry)
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total)
  }, [attempts])

  if (!activeProfile) {
    return <EmptyState title="Nessun profilo attivo">Seleziona un profilo nella scheda Profili.</EmptyState>
  }

  if (!attempts.length) {
    return (
      <EmptyState title="Nessun dato ancora">
        <p>Avvia una sessione per {activeProfile.nickname}: qui compariranno i progressi, senza punteggi unici.</p>
      </EmptyState>
    )
  }

  const level = activeProfile
  const conceptRows = [...stats.values()].sort((a, b) => b.exposures - a.exposures)

  const exportConcepts = () => {
    const rows: (string | number)[][] = [
      ['concetto', 'stato', 'presentazioni', 'corrette', 'errate', 'autonome', 'con_aiuto', 'sessioni_diverse', 'attivita_diverse'],
      ...conceptRows.map((s) => [
        CONCEPT_BY_ID.get(s.conceptId)?.lemma ?? s.conceptId,
        STATUS_LABELS[statusOf(s)],
        s.exposures,
        s.correct,
        s.incorrect,
        s.independent,
        s.assisted,
        s.sessions.length,
        s.kindsMastered.length,
      ]),
    ]
    download(`progressi-concetti-${activeProfile.nickname}.csv`, toCsv(rows))
  }

  const exportSessions = () => {
    const rows: (string | number)[][] = [
      ['data', 'attivita', 'corrette', 'con_aiuto', 'saltate'],
      ...sessions.map((s) => [
        new Date(s.startedAt).toLocaleString('it-IT'),
        s.exercises,
        s.correct,
        s.aided,
        s.skipped,
      ]),
    ]
    download(`sessioni-${activeProfile.nickname}.csv`, toCsv(rows))
  }

  const pct = (v: number) => `${Math.round(v * 100)}%`

  return (
    <div className="dashboard">
      <div className="dashboard__head">
        <h2>Progressi di {activeProfile.nickname}</h2>
        <div className="actions-row">
          <Btn variant="secondary" size="sm" onClick={exportConcepts}>
            Esporta concetti (CSV)
          </Btn>
          <Btn variant="secondary" size="sm" onClick={exportSessions}>
            Esporta sessioni (CSV)
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => window.print()}>
            Stampa / PDF
          </Btn>
        </div>
      </div>

      <div className="stat-grid">
        <Card className="stat">
          <span className="stat__value">{summary.presentati}</span>
          <span className="stat__label">Concetti presentati</span>
        </Card>
        <Card className="stat">
          <span className="stat__value">{summary.autonomi}</span>
          <span className="stat__label">Riconosciuti autonomamente</span>
        </Card>
        <Card className="stat">
          <span className="stat__value">{summary.conAiuto}</span>
          <span className="stat__label">Riconosciuti con aiuto</span>
        </Card>
        <Card className="stat">
          <span className="stat__value">{summary.inConsolidamento}</span>
          <span className="stat__label">In consolidamento</span>
        </Card>
        <Card className="stat">
          <span className="stat__value">{summary.daRipassare}</span>
          <span className="stat__label">Da riprendere</span>
        </Card>
        <Card className="stat">
          <span className="stat__value">{summary.consolidati}</span>
          <span className="stat__label">Consolidati</span>
        </Card>
      </div>

      <Card className="dimensions">
        <h3>Dimensioni separate</h3>
        <p className="muted">
          Nessun punteggio unico: ogni dimensione descrive un aspetto diverso della competenza. Le soglie di
          consolidamento sono {level.masterySessions} sessioni, {level.masteryKinds} tipi di attività e{' '}
          {pct(level.masteryAccuracy)} di accuratezza.
        </p>
        <div className="dimension-row">
          <span>Comprensione recettiva</span>
          <Progress value={Math.round(dimensions.receptive * dimensions.receptiveCount)} total={Math.max(1, dimensions.receptiveCount)} label="Comprensione recettiva" />
          <span>{pct(dimensions.receptive)}</span>
        </div>
        <div className="dimension-row">
          <span>Competenza espressiva</span>
          <Progress value={Math.round(dimensions.expressive * dimensions.expressiveCount)} total={Math.max(1, dimensions.expressiveCount)} label="Competenza espressiva" />
          <span>{pct(dimensions.expressive)}</span>
        </div>
        <div className="dimension-row">
          <span>Profondità semantica</span>
          <Progress value={Math.round(dimensions.depth * dimensions.depthCount)} total={Math.max(1, dimensions.depthCount)} label="Profondità semantica" />
          <span>{pct(dimensions.depth)}</span>
        </div>
        <div className="dimension-row">
          <span>Autonomia (senza aiuti)</span>
          <Progress value={Math.round(dimensions.autonomy * dimensions.attempts)} total={Math.max(1, dimensions.attempts)} label="Autonomia" />
          <span>{pct(dimensions.autonomy)}</span>
        </div>
        <p className="muted">
          I tempi di risposta non sono mostrati come misura: un bambino lento non viene penalizzato.
        </p>
      </Card>

      {nextStep && (
        <Card className="dashboard-next">
          <h3>Prossimo passo consigliato</h3>
          <p>
            <strong>{nextStep.title}.</strong> {nextStep.why}
          </p>
          <p className="muted">
            È una proposta didattica, non una prescrizione: l'ultima parola resta all'adulto che conosce il bambino.
          </p>
        </Card>
      )}

      <Card className="sessions-chart">
        <h3>Ultime sessioni</h3>
        <div className="bars">
          {sessions.slice(0, 8).reverse().map((s) => (
            <div key={s.id} className="bar">
              <div className="bar__stack" style={{ height: `${Math.min(100, s.exercises * 8)}%` }}>
                <span className="bar__correct" style={{ height: `${s.exercises ? (s.correct / s.exercises) * 100 : 0}%` }} />
                <span className="bar__aided" style={{ height: `${s.exercises ? (s.aided / s.exercises) * 100 : 0}%` }} />
              </div>
              <span className="bar__label">{new Date(s.startedAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          ))}
        </div>
        <p className="legend">
          <span className="legend__swatch legend__swatch--ok" /> corrette <span className="legend__swatch legend__swatch--aid" /> con aiuto
        </p>
      </Card>

      <Card>
        <h3>Prestazioni per area</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Modulo</th>
              <th scope="col">Attività</th>
              <th scope="col">Corrette</th>
              <th scope="col">Con aiuto</th>
            </tr>
          </thead>
          <tbody>
            {byModule.map(([moduleId, data]) => (
              <tr key={moduleId}>
                <td>{moduleTitle(moduleId)}</td>
                <td>{data.total}</td>
                <td>{data.correct}</td>
                <td>{data.aided}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3>Concetti</h3>
        <table className="data-table data-table--concepts">
          <thead>
            <tr>
              <th scope="col">Parola</th>
              <th scope="col">Stato</th>
              <th scope="col">Presentazioni</th>
              <th scope="col">Autonome</th>
              <th scope="col">Con aiuto</th>
              <th scope="col">Contesti</th>
            </tr>
          </thead>
          <tbody>
            {conceptRows.map((s) => (
              <tr key={s.conceptId}>
                <td>{CONCEPT_BY_ID.get(s.conceptId)?.lemma ?? s.conceptId}</td>
                <td>
                  <span className={`status-pill status-pill--${statusOf(s)}`}>{STATUS_LABELS[statusOf(s)]}</span>
                </td>
                <td>{s.exposures}</td>
                <td>{s.independent}</td>
                <td>{s.assisted}</td>
                <td>
                  {s.sessions.length} sessioni · {s.kindsMastered.length} attività
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="muted print-note">
        Report generato da Semantica in Gioco il {new Date().toLocaleDateString('it-IT')} — dati locali, non clinici.
      </p>
    </div>
  )
}
