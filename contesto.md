# Contesto di progetto — Semantica in Gioco

Documento di passaggio di consegne per agenti di coding. Aggiornato il **12 novembre 2026**, versione **1.2.0**.
Leggere anche `PEDAGOGIA.md`, `README.md`, `ARCHITETTURA.md`, `GUIDA_INSEGNANTE.md`, `GUIDA_CONTENUTI.md`, `ACCESSIBILITA.md`, `TEST.md`, `CHANGELOG.md`.

---

## 1. Che cosa è

Applicazione educativa per lo sviluppo della competenza lessicale e semantica, per bambini dai 3 agli 11 anni, usabile da insegnanti, insegnanti di sostegno, logopedisti, educatori, genitori. Non è un quiz illustrato: è un atlante di parole in cui immagini, parlato italiano, CAA e relazioni tipizzate costruiscono una rete di significati.

Vincoli non negoziabili (dal prompt originario):
- l'app deve funzionare davvero: nessun mockup, nessun pulsante senza funzione, nessun contenuto segnaposto;
- il bambino deve poter usare l'app **senza saper leggere** e **senza risposta orale**;
- istruzioni principali in **italiano parlato**, audio ripetibile, pulsante sempre visibile, volume e velocità;
- **CAA strutturale**, non marginale (9 parole funzionali sempre disponibili);
- local-first: nessun invio automatico di dati, nessuna API a pagamento, nessuna auth per i bambini;
- WCAG 2.2 AA ove applicabile, nessun limite di tempo, alternative al trascinamento;
- licenza ARASAAC (CC BY-NC-SA 4.0) rispettata con attribuzione e uso non commerciale;
- non dichiarare conclusa una fase non operativa; documentare i limiti.

---

## 2. Stato attuale (verificato)

- `npm test` → **95 test superati** (6 file: `src/data/content.test.ts`, `src/engine/engine.test.ts`, `src/engine/pedagogy.test.ts`, `src/state/tts/normalize-it.test.ts`, `src/state/tts/queue.test.ts`, `src/state/tts/cache.test.ts`).
- `npx tsc -b --force` → pulito.
- `npm run build` → build desktop, con il runtime vocale in un chunk separato `piper-tts-web-*.js` (~45,7 MB) e gli asset `onnx/`, `piper/`, `worker/` (~108 MB). `SEMANTICA_SKIP_TTS_ASSETS=1` salta la copia degli asset.
- `npm run build:web` (`SEMANTICA_WEB=1`) → build pubblicata: 482 file, **3,68 MB** totali, nessun chunk WebAssembly; `dist/assets/index-*.js` ≈ **552 kB** (≈ 162 kB gzip), CSS ≈ 41 kB. Il motore neurale è sostituito da `src/state/tts/neural-unavailable.ts`. Un plugin rimuove i file `._*` creati da macOS su ExFAT.
- **Pubblicazione**: sito Freebuff Sites «Semantica in Gioco», ambiente production, <https://site-08f3ab6cabe24e9da8845e270a0fd220.freebuff.page>. Manifest `sites.deploy.json`, worker `sites/worker.js` (solo `env.ASSETS.fetch`), `spa: true`. Deploy verificato: HTML 200, JS 200 `text/javascript`, WebP 200 `image/webp`, fallback SPA 200, nessun errore di console al caricamento.
- `npm run e2e` → **3/3 test Playwright superati** con Chromium (installato su questa macchina con `npx playwright install chromium`).
- Verifica manuale in browser completata: profilo, modulo, risposta con feedback, CAA, mappe, dashboard, **persistenza dopo reload**.
- Dev server Vite avviato in background su `http://127.0.0.1:5173/` (listener precedentemente rilevato: PID 12984). Può non essere più attivo in una sessione futura: verificare con `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/` e, se serve, `npm run dev`. Non terminare processi per pattern di nome.
- **Il progetto non è un repository git**: nessuna inizializzazione, nessun commit. Non è stato creato `.env` e non ci sono segreti.

### Conteggi reali dei contenuti

| Elemento | Quantità | Fonte |
|---|---|---|
| Concetti illustrati | **289** | `src/data/concepts-*.ts` assemblati in `src/data/lexicon.ts` |
| Categorie semantiche | **28** | `src/data/categories.ts` |
| Esercizi curati validati | **360** | `src/data/bank.ts` + `bank-core.ts` + `bank-advanced.ts` (0 scartati) |
| Tipi di esercizio | **11** | `src/engine/exercise.ts` |
| Moduli didattici | **20** | `src/data/modules.ts` |
| Percorsi | **10** | `src/data/paths.ts` |
| Ambienti | **6** | `src/data/environments.ts` |
| Storie | **20** | `src/data/stories.ts` |
| Mappe semantiche | **30** | `src/data/maps.ts` |
| Parole CAA funzionali | **9** | `src/data/caa.ts` |
| File pittogrammi locali | **473** | `public/pictograms/*.webp` |

I conteggi sono mostrati anche a runtime in *Area adulti → Dati e report → Qualità dei contenuti*: se cambiano i dati, quella schermata è la verifica più rapida.

### Modello didattico (1.2.0)

- `src/engine/pedagogy.ts` è il livello "come si insegna": fasi di sessione (`aggancio`, `modellamento`, `pratica-guidata`, `pratica-autonoma`), aiuti per fase, analisi contrastiva dell'errore, esempio svolto, transfer, prossimo passo, scheda parola, parola del giorno.
- `planSession(exercises, { startWithModel })` non riordina i contenuti: aggiunge l'impalcatura. La pratica autonoma ha `eliminateDistractors: false` (non si tolgono più alternative automaticamente).
- Le spiegazioni dell'errore usano categoria, definizione e relazione reale fra concetto scelto e atteso. Mai "sbagliato".
- `SessionPlayer` mostra fase, esempio svolto, feedback contrastivo e riepilogo con transfer; `WordCard` è la scheda parola; `ChildHome` mostra parola del giorno e prossimo passo.
- `conceptLesson(conceptId, level)` genera tre attività sul concetto scelto (immagine, parola, recupero) senza passare dalla banca: usata dalla scheda parola con `Route.session.exercises` (`fixed` in `SessionScreen`).
- Documento di riferimento: `PEDAGOGIA.md`. I limiti dichiarati restano: nessuna validazione clinica, nessuno studio controllato.

### Versione web pubblicata

- Sito Freebuff Sites «Semantica in Gioco», production: <https://site-08f3ab6cabe24e9da8845e270a0fd220.freebuff.page>.
- `npm run build:web` = `SEMANTICA_WEB=1 SEMANTICA_SKIP_TTS_ASSETS=1 vite build`; l'alias in `vite.config.ts` sostituisce `./tts/neural` con `neural-unavailable.ts`.
- Manifest `sites.deploy.json` (entrypoint `sites/worker.js`, `assetsDirectory: ./dist`, `spa: true`). 482 file, 3,68 MB, tutti webp/png/js/css/html; nessun segreto, nessun source map, nessun `._*`.
- La build web **non** include la voce neurale: usa la voce del dispositivo o le registrazioni locali e lo dichiara. Non è un difetto da "aggiustare" reintroducendo Piper: sarebbe 108 MB.

### Pacchetti desktop (release/)

La UI è la stessa build Vite, servita da `electron/main.cjs` tramite un protocollo interno `app://bundle` in una finestra isolata. **Non tornare a `loadFile`/`file://`**: da `file://` i moduli ES di Vite vengono bloccati e la finestra resta vuota (con `app://` funzionano moduli, immagini e origin di IndexedDB) (`contextIsolation`, `sandbox`, nessun Node nel renderer, nessuna navigazione remota). Prodotti verificati: DMG/ZIP macOS arm64 e x64, installer NSIS e ZIP Windows x64, AppImage/deb/tar.gz Linux arm64 e x64, ZIP della build per PWA. Il pacchetto macOS è stato avviato e verificato con `scripts/verify-desktop.mjs` (Playwright + Electron). I pacchetti **non sono firmati** e non hanno auto-update; su questa macchina wine è disponibile dentro Wineskin (`~/Applications/Wineskin/CabriPlus.app/Contents/SharedSupport/wine/bin/wine64`): va esposto come `wine` nel PATH e usato con `WINEPREFIX` isolato, così `win.signAndEditExecutable` resta attivo e l'exe Windows riceve icona, nome, versione e descrizione. Istruzioni utente in `INSTALLAZIONE.md`.

---

## 3. Comandi

```bash
npm install
npm run dev        # Vite, http://localhost:5173
npm run build      # tsc -b && vite build
npm run preview    # anteprima build (4173 con --port)
npm test           # Vitest, run singola
npm run test:watch
npm run typecheck
npx playwright install chromium   # una volta sola
npm run e2e        # Playwright: avvia build + preview su 127.0.0.1:4173
npm run stimuli    # riscarica/aggiorna i pittogrammi ARASAAC in public/pictograms e src/data/stimuli.json
npm run icons      # rigenera le icone PWA
npm run start:desktop  # build + avvio dell'app Electron
electron .            # avvio diretto dell'app desktop (dopo la build)
npm run dist:mac   # DMG + ZIP arm64/x64
npm run dist:win   # installer NSIS + ZIP x64 (su macOS funziona senza wine)
npm run dist:linux # AppImage, deb, tar.gz arm64/x64
npm run pack:pwa   # release/semantica-in-gioco-pwa.zip per ChromeOS
```

`package.json` non ha dipendenze runtime oltre a `react` e `react-dom`. Non aggiungere librerie di routing, grafi o UI senza necessità: il router è a stato interno e i grafi sono SVG propri.

---

## 4. Architettura e mappa dei file

Dipendenza consentita: `ui → state → engine/data`, `engine → data`, `data → engine` (solo tipi). Nessun ciclo a runtime.

```
src/
  main.tsx                 bootstrap React + registrazione service worker
  styles.css               design system completo (token, layout, modalità visive)
  engine/
    types.ts               Concept, RelationType + RELATION_LABELS, PropertyKey + PROPERTY_LABELS,
                           Story, SemanticMap, Environment, Path, Level, CAA
    exercise.ts            Exercise, ExOption/ExBin/ExPair/SpatialScene/DescribeSlot, 11 kind,
                           isCorrectSelection, orderedCorrect, matchingPairsCorrect, categorizeCorrect,
                           alternativesForLevel
    pedagogy.ts            SessionPhase + PHASES, planSession, scaffoldsFor, analisi dell'errore
                           (analyseSelection/Pair/Categorize/Order), workedExample, transferTask,
                           nextStepRecommendation, semanticCard, conceptOfTheDay, sessionDidacticSummary
    generator.ts           mulberry32 + hash, buildChoice, pickDistractors, describeSlots,
                           recallCueLadder, phonologicalCue, sentence/spatial/pair/categorize, shuffle,
                           conceptLesson (mini-lezione da scheda parola)
    validate.ts            validateExercise (regole di coerenza semantica)
    adaptive.ts            Attempt, ConceptStats, statusOf, adapt, STATUS_LABELS
    srs.ts                 ripasso 1-3-7-14 (poi 30) giorni, buildReviewQueue
    session.ts             composeSession, interleaveByModule, SessionRequest
    engine.test.ts         test del motore
  data/
    concept-builder.ts     helper per costruire concetti con campi obbligatori
    concepts-natura.ts     natura, animali, alimenti, corpo…
    concepts-vita.ts       casa, scuola, vestiti, giochi…
    concepts-mondo.ts      città, mestieri, veicoli, luoghi…
    concepts-lingua.ts     verbi, aggettivi, spaziali, temporali, astratti
    lexicon.ts             CONCEPTS, CONCEPT_BY_ID, requireConcept, getConcept, pictogramUrl,
                           primaryImage, representations, inverseRelation, validateLexicon
    categories.ts          categorie con taxonomic/thematic e singolare
    bank-core.ts           moduli 1-10 + extra
    bank-advanced.ts       moduli 11-18
    bank.ts                filtro + validazione + REJECTED_EXERCISES
    modules.ts             20 ModuleSpec (obiettivi, supporti, indicazioni didattiche, livelli)
    paths.ts               10 percorsi (obiettivi, prerequisiti, sequenza, criteri, generalizzazione)
    environments.ts        6 ambienti con hotspot e missioni
    stories.ts             20 storie con pannelli, domande esplicite/inferenziali/sequenza/lessico
    maps.ts                30 mappe con relazioni tipizzate
    caa.ts                 9 parole funzionali
    stimuli.json           mappa concetto → pittogramma principale + alternative (generato)
    content.test.ts        test di integrità dei contenuti
  state/
    db.ts                  IndexedDB: 7 store, export/import JSON validati, cancellazione reale
    profile.ts             ChildProfile, createProfile, DEFAULT_GLOBAL, PROFILE_COLORS
    speech.ts              facciata audio: coda, preferenze, scelta del motore, speak/stop
    tts/
      types.ts             contratto SpeechEngine, stati e preferenze
      neural.ts            Piper via WebAssembly, voce it_IT-paola-medium, WAV + cache
      recorded.ts          pacchetto di audio pregenerati (public/tts/pack)
      system.ts            voce del sistema operativo (fallback dichiarato)
      queue.ts             una voce alla volta, priorità, interruzione
      normalize-it.ts      numeri, sigle, unità, omografi (solo per l'audio)
      cache.ts             cache IndexedDB separata + limite di spazio
      audio-element.ts     riproduzione blob con velocità/volume
    store.tsx              StoreProvider + useStore (vedi API sotto)
  ui/
    App.tsx                header, routing a stato, CAA bar, PIN, footer
    routes.ts              Route union: home | child | session | teacher | explore | atlas | stories | maps | settings | about
    Picture.tsx            stimolo accessibile (button o figure, stato non solo colore)
    components.tsx         Btn, Card, Modal, Progress, Feedback, SpeakButton, useAutoSpeak, useScan, EmptyState
    SessionPlayer.tsx      ExerciseView + ExercisePlayer + SessionSummaryView (tutti i tipi),
                           fasi, esempio svolto, feedback contrastivo, transfer
    WordCard.tsx           scheda parola: analisi semantica ascoltabile, senza verifica
    CommunicationBar.tsx   barra CAA: 9 parole, frase, parla, cancella, parola in gioco
    screens/               Home, ChildHome, SessionScreen, Teacher, Dashboard, Explore, Atlas,
                           Stories, Maps, Settings, About
public/
  manifest.webmanifest, sw.js, icons/, pictograms/
scripts/
  fetch-pictograms.mjs     scarica ARASAAC per keyword (supporta prefisso lingua es. "es:tienda")
  lexicon-keywords.mjs     mappa concetto → keyword di ricerca
  make-icons.mjs           genera le icone PNG senza dipendenze
  stimuli-problems.txt     keyword non risolte (da controllare dopo `npm run stimuli`)
e2e/app.spec.ts            test end-to-end
playwright.config.ts       webServer: build + preview su 127.0.0.1:4173, reuseExistingServer
electron/main.cjs          finestra desktop, menu, sicurezza, caricamento di dist/
scripts/verify-desktop.mjs avvio di fumo del pacchetto Electron (Playwright)
build/icon.png             icona sorgente per electron-builder
release/                   installer e pacchetti (ignorati da git)
INSTALLAZIONE.md           guida di installazione per macOS, Windows, Linux, ChromeOS
```

### API dello store (`useStore()`)

Campi: `ready`, `storageError`, `profiles`, `activeProfile`, `activeProfileId`, `attempts`, `notes`, `customConcepts`, `sessions`, `recordings`, `global`, `stats: Map<string, ConceptStats>`.

Azioni: `selectProfile(id|null)`, `addProfile(nickname)`, `updateProfile(profile)`, `deleteProfile(id)`, `recordAttempt(attempt)`, `addNote(note)`, `deleteNote(id)`, `addCustomConcept(record)`, `deleteCustomConcept(id)`, `addRecording(label, blob)`, `deleteRecording(id)`, `saveSession(session)`, `updateGlobal(patch)`, `exportData()`, `importData(json)`, `wipeData()`.

Lo store fa scritture ottimistiche e deriva `stats` dai tentativi del profilo attivo. Nelle schermate usare `useStore()`; non leggere IndexedDB direttamente fuori da `db.ts`/`store.tsx`.

---

## 5. Convenzioni e insidie note (importante)

1. **IndexedDB: chiavi in-line.** Tutti gli store hanno `keyPath` (`id`, oppure `key` per `meta`). `db.put()` inserisce l'id nel record e **non passa mai un secondo argomento** a `os.put()`: farlo causa `DataError` e la scrittura fallisce silenziosamente. Questo era un bug reale che faceva perdere profili e tentativi al reload.
2. **React StrictMode.** Il bootstrap dello store non usa più una guardia `bootstrapped` (bloccava l'app su "Sto preparando l'atlante…"); la variabile `cancelled` protegge solo i setter. Non reintrodurre guardie sul bootstrap.
3. **Selezione a schermo.** Il player è generico: un solo `ExerciseView` per tutti i tipi, con `key` per esercizio. Non duplicare schermate per modulo.
4. **Distrattori.** Sempre da regole semantiche (`buildChoice`/`pickDistractors`), mai casuali puri. Ai livelli alti stessa categoria, ai livelli bassi categorie diverse. Le attività con più risposte corrette devono accettarle tutte (`multiSelectOptions`, `isCorrectSelection`).
5. **Validazione.** `validateExercise` esenta solo gli item con `scoring: 'adult'` dall'obbligo di risposta corretta (osservazione adulta). Gli scarti finiscono in `REJECTED_EXERCISES` e sono visibili nell'area adulti.
6. **Tempi.** `Attempt.ms` è registrato ma non deve mai penalizzare: nessuna soglia temporale, nessun timer.
7. **CAA.** La barra riceve `currentWord` da `App` via `onCurrentWord` di `SessionScreen`/`ExercisePlayer`. Non rimettere `undefined`.
8. **Audio.** Sempre sintesi del dispositivo o registrazioni locali; `useAutoSpeak` rispetta `profile.autoAudio`. Nessun servizio esterno.
9. **Modalità visive.** Classi su `.app`: `is-contrast`, `is-reduced-motion`, `is-essential`. Ogni nuovo componente deve reggere queste tre modalità.
10. **Contenuti in italiano corretto.** Frasi naturali, articoli e concordanze giuste, nessun segnaposto. I test controllano punteggiatura e presenza di risposte corrette, non la qualità stilistica: la revisione umana resta necessaria.
11. **Solo maiuscoli.** `ChildProfile.uppercase` aggiunge la classe `is-uppercase` a `<html>` (effetto in `App.tsx`), con `text-transform: uppercase` in `styles.css`: non duplicare la trasformazione nei contenuti con `.toUpperCase()`, altrimenti la modalità diventa irreversibile e altera i dati esportati.
12. **Pittogrammi.** Nessuna emoji come stimolo. Se un concetto non ha immagine, `validateLexicon`/i test lo segnalano: aggiungere keyword in `scripts/lexicon-keywords.mjs` e rilanciare `npm run stimuli`, controllando `scripts/stimuli-problems.txt`.

---

## 6. Come estendere

### Nuovo concetto
1. Aggiungerlo a `src/data/concepts-*.ts` con il builder (id univoco, lemma, categoria esistente, definizione, caratteristiche, funzioni, relazioni tipizzate, contesti, difficoltà, familiarità, licenza).
2. Aggiungere la keyword in `scripts/lexicon-keywords.mjs` (eventualmente con locale, es. `es:tienda`).
3. `npm run stimuli` → aggiorna `stimuli.json` e `public/pictograms`.
4. `npm test` → i test verificano relazioni, immagini, categorie usate, definizioni non segnaposto.

### Nuovo esercizio
Aggiungere una voce alla banca (`bank-core.ts` per i moduli 1-10, `bank-advanced.ts` per 11-18) con concetto, livello, consegna italiana e distrattori/coppie se servono. `bank.ts` valida e filtra. Non inserire item ambigui: se una risposta può essere corretta, deve essere dichiarata.

### Nuovo modulo o tipo di esercizio
`ModuleSpec` in `modules.ts` + voci di banca; per un tipo nuovo servono: variante in `Exercise`, rendering in `SessionPlayer.tsx`, regola in `validate.ts`, eventuale test in `engine.test.ts`, e aggiornamento di `GUIDA_CONTENUTI.md`.

### Nuova storia / mappa / percorso / ambiente
`stories.ts` (pannelli con conceptIds esistenti, domande con una sola corretta), `maps.ts` (nodo centrale + relazioni tipizzate), `paths.ts` (obiettivi, prerequisiti, sequenza, criteri osservativi, generalizzazione), `environments.ts` (hotspot con concetti esistenti + missioni con obiettivo semantico). I test verificano i riferimenti.

---

## 7. Che cosa è stato verificato e come

Automatico:
- contenuti: ≥250 concetti, ≥20 categorie, ≥300 esercizi validi, relazioni ed etichette distinte, immagini presenti, tutte le risposte corrette dichiarate, ≥20 storie con domande esplicite e inferenziali, ≥30 mappe, ≥10 percorsi, ≥6 ambienti, 9 parole CAA;
- motore: stato iniziale, consolidamento su sessioni e tipi diversi, nessuna penalizzazione dei tempi, riduzione delle alternative, modalità manuale, SRS, validazione, composizione e alternanza delle sessioni, distrattori, scene spaziali, scala di aiuti, selezioni multiple;
- audio: numeri/unità/sigle/simboli e dizionario di pronuncia nella normalizzazione italiana, testo mostrato mai modificato, coda per priorità con interruzione e tolleranza agli errori, chiave di cache sensibile a testo/voce/versione/velocità;
- e2e: creazione profilo e risposta con tastiera; barra CAA in sessione; area adulti con dashboard e contenuti validati.

Manuale (browser, Chromium):
- home → profilo "Gufo blu" → modulo 1 livello 1 → "Qual è l'anguria?" con 3 alternative e pittogrammi locali;
- risposta corretta, feedback con definizione e relazione, avanzamento;
- barra Simboli: apertura, "Voglio", frase componibile, ripetizione della parola in gioco;
- Area adulti → Progressi: 1 concetto presentato, 1 autonomo, "anguria · 1 sessione · 1 attività"; valori invariati dopo reload;
- mappe: grafo con nodi attivabili ed elenco accessibile con etichette di relazione;
- home bambino: miniature delle storie con pittogrammi.

Non coperto / da verificare su dispositivo reale: voce italiana effettivamente installata, `MediaRecorder` e permessi microfono, layout LIM/tablet/iPad, NVDA/VoiceOver/TalkBack, installazione PWA su ciascun sistema, offline dopo `npm run preview`.

---

## 8. Limiti dichiarati (non simulare ciò che manca)

- Riconoscimento vocale **non implementato**, per scelta: non è prerequisito e non verrebbe usato per valutare la pronuncia.
- Sincronizzazione cloud **non implementata**; se aggiunta, dovrà essere disattivata di default, con consenso esplicito e minimizzazione.
- PIN area adulti = filtro locale contro accessi accidentali, **non** protezione crittografica; i dati nel browser restano leggibili da chi usa il dispositivo.
- La voce neurale italiana (Piper, `it_IT-paola-medium`, pesi MIT e dataset CC0) è implementata dietro `SpeechEngine` ma **non è stata verificata end-to-end su un dispositivo reale**: mancano la prova di download del modello (63,5 MB), la sintesi WAV e l'ascolto su Chromium/Electron/LIM. Fino a quella verifica la voce del dispositivo resta il comportamento effettivo e l'app lo dichiara in Impostazioni → Voce e modello.
- Il pacchetto `piper-tts-web` genera avvisi in build (`import.meta.url` non risolto per il wasm e uso di `eval`): vanno verificati sul dispositivo prima di considerare la voce neurale operativa.
- Se manca una voce italiana di sistema l'app lo segnala e propone le registrazioni personalizzate.
- Lingua: l'interfaccia è disponibile in italiano e in **inglese britannico** (`GlobalSettings.language`, preferenza del dispositivo). Sono tradotti struttura, home, home del bambino, impostazioni, pannello voce, informazioni, pulsanti comuni, barra CAA (nove parole) e i dati di moduli e categorie. **Non** sono tradotti i contenuti lessicali (289 concetti, 360 esercizi, 20 storie, 30 mappe, 6 ambienti, 10 percorsi) né la schermata Esercizio e l'area adulti: restano in italiano e l'app lo dichiara. Nessuna traduzione automatica non revisionata.
- Gli esercizi generati automaticamente richiedono revisione adulta prima dell'uso con un bambino.
- Nessuna diagnosi automatica e nessuna validazione clinica: è uno strumento educativo di supporto all'intervento.

---

## 9. Possibili prossimi passi

1. Verifica offline su build di produzione (service worker v2, cache dei pittogrammi WebP, navigazione di fallback).
2. Controllo di accessibilità con tastiera e screen reader sulle schermate principali.
3. Flusso di revisione nell'area adulti per approvare/sospendere gli esercizi generati.
4. Ampliamento della copertura di banca per modulo/livello, mantenendo la validazione.
5. Prova su LIM, Chromebook e tablet reali (bersagli, leggibilità, orientamento).
6. Solo se richiesto: `git init` e primo commit; nessun push senza autorizzazione.

---

## 10. Licenze, privacy, attribuzione

- Pittogrammi: **ARASAAC** (Sergio Palao, Governo di Aragona), **CC BY-NC-SA 4.0**, <https://arasaac.org>; scaricati localmente, nessuna richiesta esterna a runtime. Attribuzione visibile in *Informazioni e licenze* e nei documenti. Uso non commerciale: non applicare questa licenza a risorse indipendenti.
- Dati: restano nel browser (IndexedDB), nessun tracciamento pubblicitario, nessun invio automatico. Export/import JSON e cancellazione effettiva sono nell'area adulti. I backup contengono dati del bambino: vanno conservati in luogo protetto.
