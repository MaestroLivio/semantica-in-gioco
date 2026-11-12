# Architettura

## Principi

1. **Il lessico è un grafo, non un elenco.** Ogni concetto dichiara relazioni tipizzate; i tipi non sono intercambiabili.
2. **I contenuti generati sono verificati.** Ogni esercizio passa `validateExercise` prima di essere mostrato; gli item non validi vengono esclusi e registrati.
3. **L'interfaccia non è il modello.** Il player è generico rispetto ai tipi di esercizio: i moduli didattici sono dati, non schermate duplicate.
4. **Local-first.** Nessun dato esce dal dispositivo; IndexedDB è l'unica persistenza.

## Livelli

```
engine/    logica pura, testabile senza DOM
data/      contenuti e archivio (dati + piccoli costruttori)
state/     persistenza (IndexedDB), profili, sintesi vocale, store React
ui/        componenti e schermate
```

Dipendenza consentita: `ui → state → engine/data`, `engine → data` (per il lessico), `data → engine` (per i tipi). Nessun ciclo a runtime.

## Modello dati del lessico

`src/engine/types.ts` definisce `Concept` con: id, lemma, forme flesse, pos, categoria, sottocategoria, definizione semplice, caratteristiche, funzioni, contesti, proprietà tipiche (non universali), relazioni, sinonimi/contrari, esempi, difficoltà, familiarità, utilità comunicativa, ambiguità, licenza, rappresentazioni alternative.

Tipi di relazione (`RelationType`): `is-a`, `part-of`, `has-part`, `used-for`, `tool-for`, `located-in`, `used-with`, `similar-to`, `eats`, `lives-in`, `made-of`, `professional-uses`, `has-property`, `opposite-of`, `action-of`. Ognuno ha un'etichetta italiana mostrata all'utente (`RELATION_LABELS`).

Le categorie (`src/data/categories.ts`) distinguono `taxonomic` (è un tipo di) e `thematic` (raggruppamento per contesto).

### Rappresentazioni multiple

`src/data/stimuli.json` è generato da `scripts/fetch-pictograms.mjs` e mappa ogni concetto su un pittogramma principale e su rappresentazioni alternative (stile schematico/non schematico). `representations(concept)` restituisce gli URL locali usati per la generalizzazione.

## Generazione degli esercizi

`src/engine/generator.ts`:

- PRNG deterministico (`mulberry32` + hash della stringa) → gli esercizi sono riproducibili e testabili.
- `buildChoice` seleziona distrattori coerenti: ai livelli alti stessa categoria, ai livelli bassi categorie diverse.
- `multiSelectOptions` accetta **tutte** le risposte corrette.
- `describeSlots` costruisce la mappa a sei domande con opzioni derivate dai dati reali.
- `recallCueLadder` e `phonologicalCue` implementano la scala di aiuti del recupero lessicale; l'indizio fonologico è esplicito e non valuta l'articolazione.
- `spatialExercise`, `sentenceExercise`, `pairExercise`, `categorizeExercise` producono i tipi interattivi.

`src/engine/validate.ts` controlla: presenza di consegna e concetti, risposta corretta fra le opzioni, unicità delle immagini, contenitori senza sovrapposizioni, sequenze complete, zona spaziale esistente, presenza della mappa per le descrizioni. `src/data/bank.ts` filtra la banca e registra gli scarti, visibili nell'area adulti.

## Banca curata

`src/data/bank-core.ts` e `src/data/bank-advanced.ts` contengono le voci: concetto, livello, consegna italiana e, dove serve, distrattori o coppie. I distrattori sono scelti da regole semantiche, non a caso. Ogni voce dichiara la provenienza (`origin: 'bank'`) distinta da quelle generate (`'generated'`).

## Motore adattivo

`src/engine/adaptive.ts`:

- `Attempt` registra correttezza al primo tentativo, aiuto usato, livello massimo di aiuto, modalità di risposta, tempo (registrato ma **non** usato per penalizzare) e provenienza.
- `ConceptStats` aggrega esposizioni, risposte autonome/assistite, tipi di attività e sessioni distinte in cui la competenza è comparsa.
- `statusOf` richiede sessioni e tipi diversi (soglie configurabili) oltre all'accuratezza: una singola sessione perfetta non produce "consolidato".
- `adapt` regola alternative, livello di indizio e richiesta di recupero; con `autoAdaptive: false` non interviene.

## Ripetizione distribuita

`src/engine/srs.ts` programma intervalli 1-3-7-14 (poi 30) giorni, riporta al primo passo dopo un errore e costruisce una coda che include i concetti in difficoltà anche senza ripasso scaduto. Gli intervalli sono personalizzabili dal profilo.

## Composizione delle sessioni

`src/engine/session.ts`:

- filtra per moduli e concetti target,
- adatta il livello suggerito dai dati,
- ordina per rilevanza rispetto all'obiettivo (nuovi, consolidamento, ripasso, misto),
- evita richieste consecutive identiche (stesso tipo + stesso concetto),
- alterna i moduli con `interleaveByModule`,
- restituisce anche il numero di item saltati.

## Stato e persistenza

## Modello didattico

`src/engine/pedagogy.ts` è il livello che risponde a "come condurre l'apprendimento" (il motore degli esercizi risponde a "che cosa chiedere"). Non tocca il DOM ed è coperto da test.

- `planSession(exercises)` distribuisce gli esercizi già composti in quattro fasi: `aggancio`, `modellamento`, `pratica-guidata`, `pratica-autonoma`. Non riordina i contenuti: aggiunge l'impalcatura. `scaffoldsFor(phase)` dice quanti aiuti sono disponibili; nella pratica autonoma `eliminateDistractors` è `false`, così l'alternativa completa resta un compito reale.
- `analyseSelection`, `analysePair`, `analyseCategorize`, `analyseOrder` classificano l'errore e producono una **spiegazione contrastiva** con i dati del lessico (categoria, definizione, relazione reale fra i due concetti). Tipi: `categoria-affine`, `relazione-semantica`, `categoria-diversa`, `selezione-parziale`, `ordine`, `fuori-tema`, `nessuna-risposta`.
- `workedExample(exercise)` costruisce l'esempio svolto: consegna, ricerca del concetto, confronto, scelta motivata, messaggio che l'errore è reversibile.
- `transferTask(conceptIds)` deriva dalle relazioni, funzioni e contesti dei concetti due o tre compiti da svolgere senza dispositivo.
- `nextStepRecommendation(stats, thresholds)` propone `riprendere`, `consolidare`, `estendere` o `iniziare` con la ragione scritta, i concetti coinvolti, i moduli, il livello e la modalità di sessione: la schermata può quindi avviare direttamente la sessione giusta.
- `semanticCard(concept)` produce la griglia di analisi semantica usata dalla scheda parola; `conceptOfTheDay(profileId, date)` sceglie una parola stabile nella giornata e diversa per profilo.

`src/ui/WordCard.tsx` rende la scheda; `SessionPlayer.tsx` mostra la fase, l'esempio svolto, il feedback contrastivo e la chiusura con il transfer.

## Stato e persistenza

`src/state/db.ts` definisce sei store IndexedDB: `profiles`, `attempts`, `notes`, `customConcepts`, `recordings`, `sessions`, più `meta`. Esportazione e importazione JSON sono validate (`app: semantica-in-gioco`), l'import non distrugge il database in caso di file non valido, la cancellazione svuota davvero tutti gli store.

`src/state/store.tsx` è un context React con caricamento iniziale, scritture ottimistiche e derivazione delle statistiche dai tentativi del profilo attivo.

## Audio

Il livello audio è astratto in `src/state/tts/`: le schermate chiamano `speak()` e non conoscono il motore.

- `types.ts` — contratto `SpeechEngine` (`prepare`, `play`, `stop`, `status`) e preferenze.
- `neural.ts` — `NeuralSpeechEngine`: Piper via WebAssembly, voce `it_IT-paola-medium`, caricata con `import()` dinamico (chunk separato) e sintetizzata in WAV.
- `recorded.ts` — `RecordedSpeechEngine`: riproduce un pacchetto di audio pregenerati (`public/tts/pack/manifest.json`), per i dispositivi che non reggono il modello.
- `system.ts` — `SystemSpeechEngine`: voce del sistema operativo, fallback dichiarato all'utente.
- `queue.ts` — una voce alla volta, priorità, interruzione immediata.
- `normalize-it.ts` — numeri, sigle, unità, simboli e dizionario di pronuncia; agisce solo sul testo pronunciato.
- `cache.ts` — cache IndexedDB separata dai dati del bambino, con chiave testo+voce+versione+velocità e limite di spazio.

La scelta del motore segue `ChildProfile.ttsEngine` (`auto` usa la voce neurale solo se già installata); `speech.ts` espone anche `prepareSpeech`, `preloadSpeech`, `audioCacheStats` e `subscribeSpeech`. Le registrazioni personalizzate (`MediaRecorder`) restano separate e richiedono consenso esplicito.

## Interfaccia

- `SessionPlayer.tsx` implementa tutti i tipi di esercizio: scelta singola, etichetta, selezione multipla, coppie, ordinamento, categorizzazione, intruso, collocazione spaziale, frase con simboli, recupero con aiuti, descrizione con mappa.
- Gli errori non producono punizioni: indizio, rimozione di un distrattore, nuovo tentativo, modello completo dopo più tentativi.
- `useScan` implementa la scansione assistita; i tasti 1-9, R (ripeti), H (aiuto) e Invio sono scorciatoie documentate.
- `CommunicationBar` è montata sopra il contenuto durante sessioni, storie e ambienti.

## PWA e offline

`public/sw.js` precarica la shell, usa cache-first per i pittogrammi (WebP) e stale-while-revalidate per gli asset, con fallback di navigazione su `index.html`. `vite.config.ts` usa `base: './'` per il funzionamento anche da sottocartelle.

### Due build

- `npm run build` include la voce neurale Piper (chunk WebAssembly separato, ~45 MB, più gli asset `onnx/`, `piper/`, `worker/`). È la build dell'app desktop.
- `npm run build:web` (`SEMANTICA_WEB=1`) sostituisce `src/state/tts/neural.ts` con `neural-unavailable.ts`: niente WebAssembly, nessun chunk da 45 MB, voce del dispositivo e registrazioni locali. È l'archivio web distribuito nelle release (482 file, 3,7 MB).
- Un plugin di build rimuove i file `._*` creati da macOS sui volumi ExFAT: non sono asset pubblici e alcuni host rifiutano l'upload.

## Aggiornamento dell'app desktop

- `electron/updater-rules.cjs` contiene le sole regole pure: confronto semver e scelta del file per `platform`/`arch`. È testato da `src/engine/updater-rules.test.ts` senza avviare Electron.
- `electron/updater.cjs` fa il resto nel processo principale: `GET https://api.github.com/repos/MaestroLivio/semantica-in-gioco/releases/latest`, download con redirect e avanzamento, poi `shell.openPath` del DMG su macOS o avvio dell'EXE su Windows, quindi `app.quit()`.
- Il renderer non tocca la rete: `electron/preload.cjs` espone `window.semantica.updates` (`status`, `check`, `install`, `settings`, `onChange`, `setBusy`) e il main risponde via `ipcMain.handle`. L'unico URL apribile nel browser di sistema è `https://github.com/...`.
- Lo stato `busy` arriva da `App.tsx` (route `session`): finché è vero il download continua ma la chiusura automatica è rinviata, per non perdere il lavoro.
- Non si usa `electron-updater`: senza firma digitale Squirrel.Mac rifiuterebbe l'aggiornamento, mentre aprire l'installer funziona su tutte le piattaforme. Non c'è ancora un checksum pubblicato da verificare.

## Estensioni previste

- Nuovi concetti: `src/data/concepts-*.ts` + `scripts/lexicon-keywords.mjs` + `npm run stimuli`.
- Nuovi esercizi: aggiungere voci alla banca; la validazione blocca quelli incoerenti.
- Nuovi moduli: aggiungere `ModuleSpec`, un renderer se serve un tipo nuovo, e le voci di banca.
- Sincronizzazione: non implementata; andrà progettata separatamente, disattivata per impostazione predefinita e con consenso esplicito.
