import { useMemo, useRef, useState } from 'react'
import { useStore } from '../../state/store'
import { MODULES } from '../../data/modules'
import { PATHS } from '../../data/paths'
import { CATEGORIES } from '../../data/categories'
import { CONCEPTS, CONCEPT_BY_ID } from '../../data/lexicon'
import { EXERCISE_BANK, REJECTED_EXERCISES } from '../../data/bank'
import { STORIES } from '../../data/stories'
import { SEMANTIC_MAPS } from '../../data/maps'
import { ENVIRONMENTS } from '../../data/environments'
import { CORE_WORDS } from '../../data/caa'
import type { Level } from '../../engine/types'
import type { SessionRequest } from '../../engine/session'
import { Btn, Card, EmptyState, Modal, Range, Segmented, Toggle } from '../components'
import { Dashboard } from './Dashboard'
import type { Navigate } from '../routes'

type Tab = 'profili' | 'sessione' | 'percorsi' | 'contenuti' | 'progressi' | 'dati'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profili', label: 'Profili' },
  { id: 'sessione', label: 'Sessione' },
  { id: 'percorsi', label: 'Percorsi' },
  { id: 'contenuti', label: 'Contenuti' },
  { id: 'progressi', label: 'Progressi' },
  { id: 'dati', label: 'Dati e report' },
]

async function fileToImage(file: File, maxSize = 512): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Lettura del file non riuscita'))
    reader.readAsDataURL(file)
  })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Immagine non valida'))
    img.src = dataUrl
  })
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function Teacher({ onNavigate }: { onNavigate: Navigate }) {
  const store = useStore()
  const [tab, setTab] = useState<Tab>('profili')
  const [pinDraft, setPinDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const active = store.activeProfile

  return (
    <div className="page page--teacher">
      <header className="section__head">
        <div>
          <p className="eyebrow">Area adulti</p>
          <h1>Insegnante, educatore, logopedista</h1>
          <p className="muted">
            Profili pseudonimi, sessioni rapide, percorsi, contenuti personalizzati e report. Tutti i dati restano su
            questo dispositivo.
          </p>
        </div>
        <Btn variant="ghost" onClick={() => onNavigate({ name: 'child' })}>
          Vai alla modalità bambino
        </Btn>
      </header>

      <nav className="tabs" role="tablist" aria-label="Sezioni dell'area adulti">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'profili' && <ProfilesTab />}

      {tab === 'sessione' && <SessionTab onNavigate={onNavigate} />}

      {tab === 'percorsi' && <PathsTab onNavigate={onNavigate} />}

      {tab === 'contenuti' && <ContentTab />}

      {tab === 'progressi' && (
        <div className="print-area">
          <Dashboard />
          <NotesTab />
        </div>
      )}

      {tab === 'dati' && (
        <div className="settings-grid">
          <Card>
            <h2>Backup e trasferimento</h2>
            <p className="muted">
              Esporta un file JSON con profili, tentativi, annotazioni, contenuti personalizzati e registrazioni. Il file
              contiene dati del bambino: conservalo in un luogo protetto.
            </p>
            <div className="actions-row">
              <Btn
                variant="secondary"
                onClick={async () => {
                  const json = await store.exportData()
                  const blob = new Blob([json], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `semantica-in-gioco-backup-${new Date().toISOString().slice(0, 10)}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Esporta backup JSON
              </Btn>
              <label className="btn btn--secondary btn--md file-button">
                Importa backup
                <input
                  type="file"
                  accept="application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const text = await file.text()
                    try {
                      const result = await store.importData(text)
                      window.alert(`Importate ${result.imported} voci.${result.skipped.length ? ` Non importate: ${result.skipped.length}.` : ''}`)
                    } catch (error) {
                      window.alert(error instanceof Error ? error.message : 'Importazione non riuscita.')
                    }
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <p className="muted">L'importazione aggiunge o sostituisce le voci con lo stesso identificativo.</p>
          </Card>

          <Card>
            <h2>Protezione dell'area adulti</h2>
            <p className="muted">
              Un PIN locale evita accessi accidentali. Non è una protezione crittografica dei dati: chi usa il dispositivo
              può comunque accedere ai file del browser.
            </p>
            <label className="field">
              <span>{store.global.adultPin ? 'Cambia PIN (4 cifre)' : 'Imposta un PIN (4 cifre)'}</span>
              <input
                value={pinDraft}
                inputMode="numeric"
                maxLength={4}
                onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
              />
            </label>
            <div className="actions-row">
              <Btn
                disabled={pinDraft.length !== 4}
                onClick={() => {
                  store.updateGlobal({ adultPin: pinDraft })
                  setPinDraft('')
                }}
              >
                Salva PIN
              </Btn>
              {store.global.adultPin && (
                <Btn variant="ghost" onClick={() => store.updateGlobal({ adultPin: null })}>
                  Rimuovi PIN
                </Btn>
              )}
            </div>
          </Card>

          <Card>
            <h2>Qualità dei contenuti</h2>
            <ul className="plain-list">
              <li>{CONCEPTS.length} concetti nell'archivio, tutti con pittogramma locale.</li>
              <li>{EXERCISE_BANK.length} esercizi validati nella banca curata.</li>
              <li>{REJECTED_EXERCISES.length} item esclusi dalla validazione.</li>
              <li>{STORIES.length} storie, {SEMANTIC_MAPS.length} mappe, {ENVIRONMENTS.length} ambienti.</li>
              <li>{CORE_WORDS.length} parole funzionali nella barra CAA.</li>
            </ul>
            {REJECTED_EXERCISES.length > 0 && (
              <details>
                <summary>Item esclusi (revisione consigliata)</summary>
                <ul className="plain-list">
                  {REJECTED_EXERCISES.slice(0, 40).map((issue, i) => (
                    <li key={`${issue.exerciseId}-${i}`}>
                      <code>{issue.exerciseId}</code>: {issue.problem}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <p className="muted">
              Gli esercizi generati automaticamente richiedono una revisione dell'adulto prima dell'uso: le attività con
              più risposte corrette le accettano tutte.
            </p>
          </Card>

          <Card>
            <h2>Zona pericolosa</h2>
            <p>
              La cancellazione elimina davvero profili, tentativi, foto personalizzate e registrazioni da questo
              dispositivo. Non è reversibile: esporta prima un backup.
            </p>
            <Btn variant="danger" onClick={() => setConfirmDelete('all')}>
              Elimina tutti i dati locali
            </Btn>
          </Card>
        </div>
      )}

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Conferma cancellazione">
        <p>
          Stai per eliminare {confirmDelete === 'all' ? 'tutti i dati locali dell\'app' : 'questo profilo e i suoi dati'}.
          L'operazione non può essere annullata.
        </p>
        <div className="actions-row">
          <Btn
            variant="danger"
            onClick={async () => {
              if (confirmDelete === 'all') await store.wipeData()
              else if (confirmDelete) store.deleteProfile(confirmDelete)
              setConfirmDelete(null)
            }}
          >
            Elimina definitivamente
          </Btn>
          <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>
            Annulla
          </Btn>
        </div>
      </Modal>

      {active && (
        <p className="muted teacher__footer">
          Profilo attivo: {active.nickname}. Le sessioni e i report si riferiscono a questo profilo.
        </p>
      )}
    </div>
  )
}

function ProfilesTab() {
  const store = useStore()
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const active = store.activeProfile

  const update = <K extends keyof NonNullable<typeof active>>(key: K, value: NonNullable<typeof active>[K]) => {
    if (!active) return
    store.updateProfile({ ...active, [key]: value })
  }

  return (
    <div className="teacher-grid">
      <Card>
        <h2>Profili</h2>
        <ul className="profile-list">
          {store.profiles.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`profile-row ${p.id === active?.id ? 'is-active' : ''}`}
                onClick={() => store.selectProfile(p.id)}
                aria-pressed={p.id === active?.id}
              >
                <span className="profile-row__dot" style={{ background: p.color }} aria-hidden="true" />
                <span className="profile-row__name">{p.nickname}</span>
                <span className="muted">{p.ageBand} · {p.communicationMode}</span>
              </button>
              <Btn variant="ghost" size="sm" onClick={() => setConfirm(p.id)} ariaLabel={`Elimina profilo ${p.nickname}`}>
                Elimina
              </Btn>
            </li>
          ))}
        </ul>
        <label className="field">
          <span>Nuovo profilo (pseudonimo)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Volpe verde" />
        </label>
        <Btn
          disabled={!name.trim()}
          onClick={() => {
            store.addProfile(name)
            setName('')
          }}
        >
          Crea profilo
        </Btn>
        <p className="muted">Usa pseudonimi: nessun nome reale, nessuna diagnosi, nessun dato sanitario.</p>
      </Card>

      <Card>
        <h2>Impostazioni del profilo</h2>
        {!active ? (
          <EmptyState title="Seleziona un profilo" />
        ) : (
          <>
            <label className="field">
              <span>Pseudonimo</span>
              <input value={active.nickname} maxLength={24} onChange={(e) => update('nickname', e.target.value)} />
            </label>
            <Segmented
              label="Fascia d'età (solo indicativa: i percorsi dipendono dalle competenze)"
              value={active.ageBand}
              onChange={(v) => update('ageBand', v)}
              options={[
                { value: '3-5', label: '3-5' },
                { value: '6-7', label: '6-7' },
                { value: '8-9', label: '8-9' },
                { value: '10-11', label: '10-11' },
              ]}
            />
            <Segmented
              label="Modalità comunicativa"
              value={active.communicationMode}
              onChange={(v) => update('communicationMode', v)}
              options={[
                { value: 'touch', label: 'Tocco' },
                { value: 'caa', label: 'CAA' },
                { value: 'verbale', label: 'Verbale' },
                { value: 'misto', label: 'Misto' },
              ]}
            />
            <Toggle label="Testo scritto visibile" checked={active.showText} onChange={(v) => update('showText', v)} />
            <Toggle label="Etichette sui simboli" checked={active.symbolLabels} onChange={(v) => update('symbolLabels', v)} />
            <Toggle label="Scansione assistita" checked={active.scanMode} onChange={(v) => update('scanMode', v)} />
            <Toggle label="Adattamento automatico" checked={active.autoAdaptive} onChange={(v) => update('autoAdaptive', v)} />
            <Segmented
              label="Alternative visive massime"
              value={active.alternatives}
              onChange={(v) => update('alternatives', v)}
              options={[
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 6, label: '6' },
              ]}
            />
            <Segmented
              label="Aiuti"
              value={active.cues}
              onChange={(v) => update('cues', v)}
              options={[
                { value: 'nessuno', label: 'Nessuno' },
                { value: 'leggeri', label: 'Leggeri' },
                { value: 'completi', label: 'Completi' },
              ]}
            />
            <Range
              label="Attività per sessione"
              min={3}
              max={16}
              value={active.sessionLength}
              onChange={(v) => update('sessionLength', v)}
            />
            <label className="field">
              <span>Obiettivi didattici (separati da virgola)</span>
              <input
                value={active.objectives.join(', ')}
                onChange={(e) => update('objectives', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="Aumentare il vocabolario della casa, recupero lessicale"
              />
            </label>
            <label className="field">
              <span>Parole su cui concentrarsi (separate da virgola)</span>
              <input
                value={active.focusVocabulary.join(', ')}
                onChange={(e) => update('focusVocabulary', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="ombrello, cucchiaio, frigorifero"
              />
            </label>
            <label className="field">
              <span>Interessi personali</span>
              <input
                value={active.interests.join(', ')}
                onChange={(e) => update('interests', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="dinosauri, treni, cucina"
              />
            </label>
            <label className="field">
              <span>Annotazioni per l'adulto</span>
              <textarea
                value={active.notesForAdult}
                onChange={(e) => update('notesForAdult', e.target.value)}
                rows={3}
                placeholder="Preferenze sensoriali, adattamenti motori, strategie utili…"
              />
            </label>
          </>
        )}
      </Card>

      <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Eliminare il profilo?">
        <p>Verranno eliminati anche i tentativi, le annotazioni e i contenuti personalizzati di questo profilo.</p>
        <div className="actions-row">
          <Btn
            variant="danger"
            onClick={() => {
              if (confirm) store.deleteProfile(confirm)
              setConfirm(null)
            }}
          >
            Elimina
          </Btn>
          <Btn variant="ghost" onClick={() => setConfirm(null)}>
            Annulla
          </Btn>
        </div>
      </Modal>
    </div>
  )
}

function SessionTab({ onNavigate }: { onNavigate: Navigate }) {
  const store = useStore()
  const active = store.activeProfile
  const [modules, setModules] = useState<string[]>(['m1'])
  const [level, setLevel] = useState<Level>(2)
  const [count, setCount] = useState(active?.sessionLength ?? 8)
  const [mode, setMode] = useState<SessionRequest['mode']>('misto')
  const [usePersonal, setUsePersonal] = useState(false)

  const toggleModule = (id: string) => {
    setModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const start = () => {
    if (!active) return
    const ids = [...modules]
    if (usePersonal && store.customConcepts.length >= 2) ids.push('custom')
    const request: SessionRequest = {
      moduleIds: ids.length ? ids : ['m1'],
      level,
      count,
      mode,
      targetConceptIds: active.focusVocabulary.length
        ? active.focusVocabulary
            .map((word) => CONCEPTS.find((c) => c.lemma.toLowerCase() === word.toLowerCase())?.id)
            .filter((id): id is string => Boolean(id))
        : undefined,
    }
    onNavigate({ name: 'session', request, label: 'Sessione personalizzata' })
  }

  return (
    <div className="teacher-grid">
      <Card>
        <h2>Sessione rapida</h2>
        <p className="muted">Seleziona un obiettivo e il numero di attività: la sessione parte in due passaggi.</p>
        {!active && <EmptyState title="Seleziona un profilo nella scheda Profili" />}
        <fieldset className="module-picker">
          <legend>Moduli</legend>
          <div className="module-picker__grid">
            {MODULES.map((m) => (
              <label key={m.id} className={`module-check ${modules.includes(m.id) ? 'is-checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={modules.includes(m.id)}
                  onChange={() => toggleModule(m.id)}
                />
                <span>
                  {m.number}. {m.title}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="muted">
          I moduli 19 e 20 si svolgono nelle sezioni «Mappe» e «Storie», pensate come laboratori di esplorazione.
        </p>
        <Segmented
          label="Livello di partenza"
          value={level}
          onChange={setLevel}
          options={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
            { value: 6, label: '6' },
          ]}
        />
        <Segmented
          label="Obiettivo della sessione"
          value={mode}
          onChange={(v) => setMode(v)}
          options={[
            { value: 'nuovi', label: 'Nuovi concetti' },
            { value: 'consolidamento', label: 'Consolidamento' },
            { value: 'ripasso', label: 'Ripasso' },
            { value: 'misto', label: 'Misto' },
          ]}
        />
        <Range label="Numero di attività" min={3} max={16} value={count} onChange={setCount} />
        <Toggle
          label="Includi il vocabolario personale (foto)"
          hint="Disponibile con almeno due immagini caricate."
          checked={usePersonal}
          onChange={setUsePersonal}
        />
        <div className="actions-row">
          <Btn size="lg" disabled={!active} onClick={start}>
            Avvia sessione
          </Btn>
        </div>
        {active && active.focusVocabulary.length > 0 && (
          <p className="muted">Parole del profilo: {active.focusVocabulary.join(', ')}</p>
        )}
      </Card>

      <Card>
        <h2>Vocabolario del profilo</h2>
        <p className="muted">
          Le parole selezionate orientano la composizione della sessione. Per escludere temporaneamente parole già
          consolidate, usa questa lista.
        </p>
        {active ? (
          <FocusVocabularyEditor />
        ) : (
          <EmptyState title="Nessun profilo attivo" />
        )}
      </Card>
    </div>
  )
}

function FocusVocabularyEditor() {
  const store = useStore()
  const active = store.activeProfile
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('tutte')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CONCEPTS.filter(
      (c) =>
        (category === 'tutte' || c.category === category) &&
        (!q || c.lemma.toLowerCase().includes(q)),
    ).slice(0, 40)
  }, [query, category])

  if (!active) return null
  const toggle = (lemma: string) => {
    const has = active.focusVocabulary.includes(lemma)
    store.updateProfile({
      ...active,
      focusVocabulary: has
        ? active.focusVocabulary.filter((w) => w !== lemma)
        : [...active.focusVocabulary, lemma],
    })
  }

  return (
    <div>
      <label className="field">
        <span>Cerca parole</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Es. cane" />
      </label>
      <label className="field">
        <span>Categoria</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="tutte">Tutte</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <div className="word-row">
        {results.map((c) => {
          const selected = active.focusVocabulary.includes(c.lemma)
          return (
            <button
              key={c.id}
              type="button"
              className={`word-chip word-chip--button ${selected ? 'is-active' : ''}`}
              onClick={() => toggle(c.lemma)}
              aria-pressed={selected}
            >
              {c.lemma}
            </button>
          )
        })}
      </div>
      <p className="muted">
        {active.focusVocabulary.length} parole selezionate
        {active.focusVocabulary.length > 0 ? `: ${active.focusVocabulary.join(', ')}` : ''}
      </p>
    </div>
  )
}

function PathsTab({ onNavigate }: { onNavigate: Navigate }) {
  const store = useStore()
  const [open, setOpen] = useState<string | null>(PATHS[0]?.id ?? null)
  const path = PATHS.find((p) => p.id === open)

  const start = (moduleId: string, level: Level, title: string) => {
    onNavigate({
      name: 'session',
      request: {
        moduleIds: [moduleId],
        level,
        count: store.activeProfile?.sessionLength ?? 8,
        mode: 'misto',
      },
      label: title,
    })
  }

  return (
    <div className="teacher-grid">
      <Card>
        <h2>Percorsi didattici</h2>
        <ul className="path-list">
          {PATHS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`path-row ${open === p.id ? 'is-active' : ''}`}
                onClick={() => setOpen(p.id)}
                aria-pressed={open === p.id}
              >
                <span>{p.title}</span>
                <span className="muted">Livello {p.level}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {path && (
        <Card className="path-detail">
          <h2>{path.title}</h2>
          <p className="path-goal">{path.goal}</p>
          <h3>Prerequisiti indicativi</h3>
          <ul className="plain-list">
            {path.prerequisites.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <h3>Sequenza consigliata</h3>
          <ol className="path-steps">
            {path.steps.map((step, i) => {
              const module = MODULES.find((m) => m.id === step.moduleId)
              return (
                <li key={`${step.moduleId}-${i}`}>
                  <div>
                    <strong>
                      {module?.number}. {module?.title} · livello {step.level}
                    </strong>
                    <p>{step.note}</p>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={() => start(step.moduleId, step.level, module?.title ?? 'Attività')}>
                    Avvia
                  </Btn>
                </li>
              )
            })}
          </ol>
          <h3>Criteri osservativi</h3>
          <ul className="plain-list">
            {path.observation.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <h3>Proposte di generalizzazione</h3>
          <ul className="plain-list">
            {path.generalization.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function ContentTab() {
  const store = useStore()
  const active = store.activeProfile
  const [lemma, setLemma] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0]?.id ?? 'animali')
  const [definition, setDefinition] = useState('')
  const [features, setFeatures] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [recordLabel, setRecordLabel] = useState('')
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const save = () => {
    if (!active || !preview || !lemma.trim()) return
    store.addCustomConcept({
      profileId: active.id,
      lemma: lemma.trim(),
      category,
      definition: definition.trim() || `Un oggetto personale: ${lemma.trim()}.`,
      image: preview,
      features: features.split(',').map((f) => f.trim()).filter(Boolean),
    })
    setLemma('')
    setDefinition('')
    setFeatures('')
    setPreview(null)
  }

  const startRecording = async () => {
    if (!consent) {
      setError('Serve il consenso esplicito prima di usare il microfono.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Questo dispositivo non permette la registrazione audio dal browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size > 0) store.addRecording(recordLabel || `Registrazione ${new Date().toLocaleTimeString('it-IT')}`, blob)
        setRecording(false)
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setError(null)
    } catch {
      setError('Permesso microfono negato. La registrazione è facoltativa: le attività funzionano anche senza.')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
  }

  return (
    <div className="teacher-grid">
      <Card>
        <h2>Contenuti personalizzati</h2>
        <p className="muted">
          Importa fotografie dell'ambiente reale (oggetti personali, materiali della classe, luoghi). Le immagini restano
          sul dispositivo e diventano attività nel vocabolario personale.
        </p>
        {!active && <EmptyState title="Seleziona un profilo" />}
        {active && (
          <>
            <label className="field">
              <span>Parola (nome dell'oggetto)</span>
              <input value={lemma} onChange={(e) => setLemma(e.target.value)} maxLength={32} placeholder="La mia tazza blu" />
            </label>
            <label className="field">
              <span>Categoria</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Definizione semplice</span>
              <input value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Una tazza blu per la colazione" />
            </label>
            <label className="field">
              <span>Caratteristiche (separate da virgola)</span>
              <input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="è blu, è di ceramica" />
            </label>
            <label className="field">
              <span>Fotografia</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    setPreview(await fileToImage(file))
                    setError(null)
                  } catch {
                    setError('Immagine non leggibile.')
                  }
                  e.target.value = ''
                }}
              />
            </label>
            {preview && <img src={preview} alt="Anteprima dell'immagine caricata" className="preview-image" />}
            {error && <p className="error-text">{error}</p>}
            <Btn disabled={!preview || !lemma.trim()} onClick={save}>
              Aggiungi al vocabolario
            </Btn>

            <h3>Parole personali</h3>
            {store.customConcepts.length === 0 ? (
              <p className="muted">Nessun contenuto personale per questo profilo.</p>
            ) : (
              <ul className="custom-list">
                {store.customConcepts.map((c) => (
                  <li key={c.id}>
                    <img src={c.image} alt={c.lemma} />
                    <div>
                      <strong>{c.lemma}</strong>
                      <p className="muted">{c.definition}</p>
                    </div>
                    <Btn variant="ghost" size="sm" onClick={() => store.deleteCustomConcept(c.id)}>
                      Elimina
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>

      <Card>
        <h2>Registrazioni vocali</h2>
        <p className="muted">
          Puoi registrare la tua voce per parole e istruzioni. Il microfono non si attiva mai automaticamente: serve un
          consenso esplicito a ogni sessione di registrazione.
        </p>
        <Toggle
          label="Acconsento all'uso del microfono per una registrazione volontaria"
          hint="Nessuna registrazione viene inviata all'esterno."
          checked={consent}
          onChange={setConsent}
        />
        <label className="field">
          <span>Etichetta della registrazione</span>
          <input value={recordLabel} onChange={(e) => setRecordLabel(e.target.value)} placeholder="Voce: cane" />
        </label>
        <div className="actions-row">
          {!recording ? (
            <Btn variant="secondary" onClick={startRecording}>
              Registra
            </Btn>
          ) : (
            <Btn variant="danger" onClick={stopRecording}>
              Ferma e salva
            </Btn>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
        <ul className="custom-list custom-list--simple">
          {store.recordings.map((r) => (
            <li key={r.id}>
              <div>
                <strong>{r.label}</strong>
                <audio controls src={URL.createObjectURL(r.blob)} />
              </div>
              <Btn variant="ghost" size="sm" onClick={() => store.deleteRecording(r.id)}>
                Elimina
              </Btn>
            </li>
          ))}
        </ul>
        {store.recordings.length === 0 && <p className="muted">Nessuna registrazione salvata.</p>}
      </Card>
    </div>
  )
}

function NotesTab() {
  const store = useStore()
  const [text, setText] = useState('')
  const active = store.activeProfile
  if (!active) return null

  return (
    <Card className="notes-card">
      <h2>Annotazioni osservative</h2>
      <p className="muted">
        Le annotazioni descrivono ciò che l'adulto osserva: non sono valutazioni automatiche né diagnosi.
      </p>
      <label className="field">
        <span>Nuova annotazione</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Osservazione, strategia utile, generalizzazione…" />
      </label>
      <Btn
        disabled={!text.trim()}
        onClick={() => {
          store.addNote({ profileId: active.id, text: text.trim() })
          setText('')
        }}
      >
        Salva annotazione
      </Btn>
      <ul className="notes-list">
        {store.notes.map((n) => (
          <li key={n.id}>
            <time dateTime={new Date(n.at).toISOString()}>{new Date(n.at).toLocaleString('it-IT')}</time>
            <p>{n.text}</p>
            <Btn variant="ghost" size="sm" onClick={() => store.deleteNote(n.id)}>
              Elimina
            </Btn>
          </li>
        ))}
      </ul>
      {store.notes.length === 0 && <p className="muted">Nessuna annotazione per questo profilo.</p>}
      {store.activeProfile?.focusVocabulary.length ? (
        <p className="muted">
          Vocabolario attivo: {store.activeProfile.focusVocabulary.map((w) => CONCEPT_BY_ID.get(w)?.lemma ?? w).join(', ')}
        </p>
      ) : null}
    </Card>
  )
}
