# Diagnostica approfondita — Semantica in Gioco (v1.2.0)

**Data diagnostica:** 14 novembre 2026  
**Ambiente:** macOS, Node (npm), repository Git su branch `main` (working tree pulito all'inizio)  
**Obiettivo:** analisi funzionale, qualitativa, pedagogica e didattica del progetto, con suggerimenti di miglioramento prioritizzati.

---

## 1. Sintesi esecutiva

*Semantica in Gioco* è un progetto **maturo e ben ingegnerizzato**: architettura a livelli, tipizzazione stretta, logica pura testabile, validazione dei contenuti, modello didattico esplicito, accessibilità strutturale, CAA non marginale, local-first e PWA offline. I test automatici e il typecheck sono verdi; la build web è riproducibile.

**Punti di forza principali**

- Ciclo didattico esplicito in ogni sessione (riscaldamento → dimostrazione → pratica guidata → pratica autonoma → transfer).
- Feedback **contrastivo** costruito sui dati reali del lessico, senza messaggi punitivi.
- Validazione sistematica degli esercizi (`validateExercise`, banca filtrata, 0 scarti su 360).
- Accessibilità pensata per bambini con bisogni comunicativi/cognitivi/motori (WCAG 2.2 AA come obiettivo, scansione, alternative al drag, nessun timer).
- Persistenza locale reale (IndexedDB), export/import, cancellazione effettiva.
- Documentazione ampia e coerente con il codice.

**Aree di miglioramento prioritarie**

1. **Backup/import delle registrazioni** (Blob non serializzabili in JSON) e **cancellazione a cascata dei profili** (dati orfani in IndexedDB).
2. **Internazionalizzazione incompleta**: molte stringhe italiane hard-coded nelle schermate, mentre i contenuti lessicali restano italiani per scelta.
3. **Copertura E2E del ciclo didattico** ancora manuale; i test automatici coprono il modello ma non l'interfaccia end-to-end.
4. **Verifica reale della voce neurale** (Piper) non ancora eseguita su dispositivo.
5. **Aggiornamento automatico senza verifica checksum** (documentato, ma migliorabile).
6. **Bundle JS unico** oltre la soglia di avviso di Vite (558,85 kB) senza code-splitting per route.

---

## 2. Metodo e strumenti usati

**Comandi eseguiti**

| Comando | Esito |
|---|---|
| `npm test` | **105/105 test superati** (7 file) |
| `npx tsc -b` | **Pulito**, nessun errore |
| `npm run build:web` | **OK** in 38,5 s; 92 moduli; JS 558,85 kB (gzip 164,25 kB), CSS 41,03 kB |
| `npm run e2e` | **Non eseguibile in questo ambiente**: binario Chromium headless shell mancante (errore di setup Playwright, non del codice) |

**File ispezionati (principali)**

- Architettura e modello: `ARCHITETTURA.md`, `PEDAGOGIA.md`, `ACCESSIBILITA.md`, `TEST.md`, `contesto.md`, `README.md`
- Engine: `src/engine/{types,exercise,generator,validate,adaptive,srs,session,pedagogy}.ts`
- Dati: `src/data/{modules,bank,bank-core,bank-advanced,lexicon,categories}.ts`
- Stato: `src/state/{db,store,profile,speech,updates}.ts`, `src/state/tts/*`
- UI: `src/ui/App.tsx`, `src/ui/SessionPlayer.tsx`, `src/ui/screens/*`, `src/ui/components.tsx`, `src/ui/CommunicationBar.tsx`, `src/ui/WordCard.tsx`
- Build/release: `vite.config.ts`, `package.json`, `electron/*`

**Verifica repository**

- Branch `main`, working tree pulito all'inizio.
- Nessun file AppleDouble (`._*`) tracciato in `src` (il `.gitignore` li esclude; i plugin di build li rimuovono da `dist`).
- Nessun artefatto di release tracciato (`release/` è ignorato).

---

## 3. Metriche verificate

| Elemento | Valore | Fonte |
|---|---:|---|
| Concetti illustrati | 289 | documentazione / `src/data/concepts-*.ts` |
| Categorie semantiche | 28 | `src/data/categories.ts` |
| Esercizi curati validati | 360 | `src/data/bank*.ts` |
| Moduli didattici | 20 | `src/data/modules.ts` |
| Tipi di esercizio | 11 | `src/engine/exercise.ts` |
| Storie | 20 | `src/data/stories.ts` |
| Mappe semantiche | 30 | `src/data/maps.ts` |
| Percorsi | 10 | `src/data/paths.ts` |
| Ambienti | 6 | `src/data/environments.ts` |
| Parole CAA funzionali | 9 | `src/data/caa.ts` |
| Pittogrammi locali | 473 | `public/pictograms/*.webp` |
| Test automatici | 105 (7 file) | Vitest |
| Build web JS | 558,85 kB (164,25 kB gzip) | Vite |
| Build web CSS | 41,03 kB (8,04 kB gzip) | Vite |

---

## 4. Punti di forza (con evidenze)

### 4.1 Architettura

- Separazione netta `engine → data → state → ui` documentata e rispettata (`ARCHITETTURA.md`).
- Logica pura e testabile senza DOM (`pedagogy.ts`, `adaptive.ts`, `srs.ts`, `session.ts`).
- PRNG deterministico (`mulberry32` + hash) → esercizi riproducibili e testabili (`generator.ts`).
- Un solo player generico per tutti i tipi di esercizio (`SessionPlayer.tsx`), coerente con il principio "i moduli sono dati, non schermate duplicate".

### 4.2 Qualità del codice

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` attivi (`tsconfig.json`).
- Nessun `TODO`/`FIXME`/`console.log` nel codice sorgente (ricerca eseguita).
- Tipi espliciti per dominio (`Concept`, `RelationType`, `Exercise`, `Attempt`, ecc.).
- Gestione esplicita dei limiti (voce neurale non verificata, sync cloud non implementata, PIN non crittografico).

### 4.3 Pedagogia

- Il modello didattico è documentato e motivato (`PEDAGOGIA.md`) e implementato in `pedagogy.ts`.
- L'errore non è mai "sbagliato": `analyseSelection`, `analysePair`, `analyseCategorize`, `analyseOrder` producono spiegazioni contrastive.
- La pratica autonoma **non** rimuove automaticamente i distrattori (`eliminateDistractors: false`), a differenza della pratica guidata.
- `statusOf` richiede sessioni e tipi di attività diversi: una sessione perfetta non produce "consolidato".
- Il tempo è registrato (`Attempt.ms`) ma **mai** usato per penalizzare.

### 4.4 Accessibilità

- Controlli nativi, focus visibile, skip link, scorciatoie documentate (`1-9`, `R`, `H`, `Invio`).
- Bersagli generosi (56 px desktop, 64 px touch, 68 px "grandi").
- Alternative al trascinamento in categorizzazione e scena spaziale.
- Scansione assistita per interruttore singolo.
- Alto contrasto, riduzione animazioni, modalità essenziale, solo maiuscole.
- Barra CAA con 9 parole funzionali sempre disponibile in sessioni, storie e ambienti.

### 4.5 Privacy e local-first

- Nessuna API a pagamento, nessun account, nessun tracker.
- Profili pseudonimi, dati in IndexedDB, export/import JSON, cancellazione effettiva.
- L'unico accesso di rete del desktop è l'updater verso GitHub Releases; il renderer non ha rete (`preload.cjs` + `contextBridge`).

---

## 5. Diagnosi e suggerimenti per area

### 5.1 Funzionale

#### F-01 — Backup delle registrazioni non fedele (priorità: alta)

- **Evidenza:** `src/state/db.ts` → `exportDatabase()` serializza con `JSON.stringify` tutti gli store, inclusi `recordings` (Blob). Un `Blob` serializzato in JSON diventa `{}`: **le registrazioni personalizzate vengono perse nel backup** e non sono ripristinabili.
- **Impatto:** perdita silenziosa di dati del bambino/profilo in caso di backup/ripristino o migrazione di dispositivo.
- **Suggerimento:** codificare i Blob in base64 (o escluderli esplicitamente con avviso) in export/import; aggiungere test di round-trip.

#### F-02 — Cancellazione profilo non a cascata in IndexedDB (priorità: alta)

- **Evidenza:** `src/state/store.tsx` → `deleteProfile()` aggiorna lo stato per `attempts`, `notes`, `customConcepts`, `sessions`, ma nel database rimuove solo `profiles` e `attempts` (`db.remove('profiles', id)` e `db.remove('attempts', ...)`). `notes`, `customConcepts`, `sessions` restano orfani. Le `recordings` non hanno `profileId` e non vengono toccate.
- **Impatto:** dati residui di un profilo cancellato; violazione dell'aspettativa di "cancellazione effettiva"; crescita indefinita del database.
- **Suggerimento:** eseguire la cancellazione in una singola transazione IndexedDB che includa tutti gli store; introdurre `profileId` per le registrazioni o una libreria globale esplicita.

#### F-03 — Importazione non ricarica le impostazioni globali (priorità: media)

- **Evidenza:** `importData()` in `src/state/store.tsx` ricarica profili, tentativi, note, contenuti, sessioni, registrazioni, ma **non** `global` da `meta`. Se il backup contiene preferenze globali, vengono ignorate.
- **Suggerimento:** ricaricare anche `meta` e aggiornare `global` in stato.

#### F-04 — Moduli 19 e 20 esclusi dalle sessioni miste (priorità: bassa/media)

- **Evidenza:** `SessionScreen.tsx` filtra `request.moduleIds` rimuovendo `m19` e `m20` (mappe/storie), perché hanno schermate dedicate.
- **Impatto:** l'adulto che seleziona "tutti i moduli" non ottiene mappe/storie nella sessione; comportamento corretto ma poco esplicito.
- **Suggerimento:** documentare chiaramente in UI ("le mappe e le storie si aprono dalle sezioni dedicate") oppure permettere l'inserimento di un elemento mappa/storia come chiusura di sessione.

#### F-05 — `ExercisePlayer` non gestisce lo skip nell'ultimo item come completamento (priorità: bassa)

- **Evidenza:** `onSkip` chiama `next({ skipped })`; se è l'ultimo item, `next` chiama `onComplete`. Comportamento corretto, ma manca un feedback esplicito di "saltato" nel riepilogo? Il riepilogo conta `skipped`.
- **Suggerimento:** nessun bug; valutare un messaggio non giudicante ("l'abbiamo saltata, la riprenderemo un'altra volta").

#### F-06 — Aggiornamento automatico senza verifica checksum (priorità: media)

- **Evidenza:** `electron/updater.cjs` scarica e apre l'installer; `ARCHITETTURA.md` dichiara che non c'è checksum pubblicato da verificare.
- **Impatto:** in caso di manomissione del canale di download, l'app non rileva il problema.
- **Suggerimento:** pubblicare e verificare SHA-256 dalla release (il file `SHA256SUMS.txt` esiste già nelle release).

#### F-07 — E2E non eseguibili in questo ambiente (priorità: bassa)

- **Evidenza:** `npm run e2e` fallisce per binario Chromium headless shell mancante.
- **Suggerimento:** installare i browser (`npx playwright install chromium`) in CI/ambiente di verifica; non è un difetto del codice, ma va documentato come prerequisito.

---

### 5.2 Qualitativa (codice, architettura, manutenzione)

#### Q-01 — Internazionalizzazione parziale e stringhe hard-coded (priorità: media/alta)

- **Evidenza:** `src/i18n/strings.ts` contiene 537 righe; molte schermate (`Teacher.tsx`, `Dashboard.tsx`, `SessionPlayer.tsx`, `SessionScreen.tsx`, `Home.tsx`, `ChildHome.tsx`) contengono stringhe italiane letterali. La lingua inglese è dichiarata come "interfaccia" ma i contenuti restano italiani per scelta.
- **Impatto:** esperienza incoerente se si seleziona l'inglese; manutenzione duplicata; rischio di testi non tradotti.
- **Suggerimento:** completare la copertura `t()` per tutta l'UI adulta o, in alternativa, limitare esplicitamente il selettore di lingua a "interfaccia" con nota visibile. I contenuti lessicali possono restare italiani, ma va evitato il mix non segnalato.

#### Q-02 — Documentazione di stato obsoleta (priorità: media)

- **Evidenza:** `contesto.md` (gitignored, ma presente) dichiara "il progetto non è un repository git" (falso: è su `main`), "95 test" (ora 105), e menziona la pubblicazione Freebuff Sites (ritirata). `TEST.md` è aggiornato (105 test).
- **Suggerimento:** aggiornare o rimuovere `contesto.md` dal flusso di consegna; mantenere un unico documento di stato.

#### Q-03 — Assenza di linting/formattazione e CI (priorità: media)

- **Evidenza:** nessun ESLint/Prettier o workflow CI nel repository (ricerca file di configurazione).
- **Suggerimento:** aggiungere ESLint + Prettier + GitHub Actions per `npm test`, `tsc -b`, `npm run build:web`, e controllo dei file `._*`.

#### Q-04 — Bundle JS unico oltre la soglia di avviso (priorità: bassa/media)

- **Evidenza:** build web produce un chunk da 558,85 kB; Vite avvisa "Some chunks are larger than 500 kB".
- **Impatto:** primo caricamento più lento su rete lenta; meno rilevante in desktop/PWA offline dopo cache.
- **Suggerimento:** code-splitting per route (`React.lazy` + `Suspense`) e `manualChunks` per dati pesanti (concetti, storie, mappe). Valutare impatto su caching.

#### Q-05 — Registrazioni non scoping per profilo (priorità: media)

- **Evidenza:** `RecordingRecord` non ha `profileId`; `recordings` è globale in `store.tsx`.
- **Impatto:** in contesti multi-bambino, le registrazioni di un adulto/profilo sono condivise.
- **Suggerimento:** aggiungere `profileId` (o una libreria globale esplicita) e filtrare per profilo attivo.

#### Q-06 — Gestione errori TTS e stato di rete non testati (priorità: bassa)

- **Evidenza:** `normalize-it.ts`, `queue.ts`, `cache.ts` hanno test; download/sintesi WAV reali non verificati (documentato).
- **Suggerimento:** test di integrazione con mock del motore; checklist dispositivo reale.

---

### 5.3 Pedagogica

#### P-01 — Sessioni molto brevi non includono pratica autonoma (priorità: media)

- **Evidenza:** `planSession()` in `pedagogy.ts`: con 1 item → solo `modellamento`; con 2 item → `aggancio` + `modellamento`; la pratica autonoma compare solo da 3 item in poi.
- **Impatto:** il modello dichiara quattro fasi "sempre nello stesso ordine", ma sessioni brevi non arrivano mai alla pratica autonoma.
- **Suggerimento:** decidere esplicitamente se è intenzionale (es. mini-lezioni da scheda parola) e documentarlo; oppure, per 2 item, usare `aggancio` + `pratica-autonoma` per mantenere la valutazione dell'autonomia.

#### P-02 — `pair-match` registra errore al primo abbinamento sbagliato (priorità: media/alta)

- **Evidenza:** in `SessionPlayer.tsx`, `chooseRight` chiama `failWith(analysePair(...))` appena un abbinamento è sbagliato, anche se l'utente potrebbe correggere prima di confermare.
- **Impatto:** gonfiamento dei tentativi errati e delle statistiche adattive; possibile frustrazione.
- **Suggerimento:** distinguere "errore di abbinamento esplorativo" da "conferma finale": registrare l'errore solo al `Conferma`, oppure consentire correzione senza registrazione. Mantenere il feedback contrastivo al momento della conferma.

#### P-03 — Soglia "indipendente" hard-coded nel riepilogo (priorità: bassa)

- **Evidenza:** `SessionSummaryView` usa `independent: 3` fisso, mentre altri threshold sono letti dal profilo.
- **Suggerimento:** esporre anche questa soglia in `ChildProfile`/impostazioni, come `masterySessions` e `masteryKinds`.

#### P-04 — Livello fisso nel "prossimo passo" per parole in difficoltà (priorità: bassa)

- **Evidenza:** `nextStepRecommendation()` imposta `level: 2` per l'azione `riprendere`, indipendentemente dal livello attuale del profilo.
- **Suggerimento:** usare `suggestLevel()` sulle statistiche del concetto, per non abbassare il livello in modo arbitrario.

#### P-05 — Assenza di una valutazione iniziale non diagnostica (priorità: bassa)

- **Evidenza:** il livello iniziale è scelto dall'adulto; non esiste un "primo giro" guidato per stimare il punto di partenza.
- **Suggerimento:** aggiungere un'attività opzionale di esplorazione iniziale (chiaramente non diagnostica) per suggerire un livello, con disclaimer.

#### P-06 — Generalizzazione delle rappresentazioni non misurata (priorità: bassa)

- **Evidenza:** le rappresentazioni multiple esistono (`representations()`), ma non c'è un test che verifichi che lo stesso concetto compaia con pittogrammi diversi in sessioni diverse.
- **Suggerimento:** aggiungere un test di contenuto/coverage sulle rappresentazioni; eventualmente tracciare nel tentativo quale rappresentazione è stata usata.

#### P-07 — Transfer derivato solo dai primi concetti (priorità: bassa)

- **Evidenza:** `transferTask()` scorre `conceptIds` e si ferma a `limit` task; per sessioni con molti concetti, i concetti finali possono non generare transfer.
- **Suggerimento:** campionare o ruotare i concetti usati per il transfer, evitando di privilegiare sempre i primi.

---

### 5.4 Didattica e contenuti

#### D-01 — Contenuti lessicali non tradotti (per scelta, ma da chiarire) (priorità: media)

- **Evidenza:** `contesto.md` dichiara che i 289 concetti, 360 esercizi, 20 storie, 30 mappe, 6 ambienti, 10 percorsi restano in italiano anche con interfaccia inglese.
- **Impatto:** l'opzione "English" può essere fraintesa come traduzione completa.
- **Suggerimento:** rendere esplicito in UI ("i contenuti lessicali sono in italiano") e valutare un progetto di traduzione solo se richiesto.

#### D-02 — Concetti personalizzati non entrano nella rete semantica (priorità: media)

- **Evidenza:** `CustomConceptRecord` ha lemma, definizione, immagine, caratteristiche, ma nessuna relazione tipizzata né categoria esistente obbligatoria (solo stringa `category`).
- **Impatto:** i concetti personalizzati non beneficiano di feedback contrastivo, mappe, transfer derivato.
- **Suggerimento:** permettere di collegare un concetto personalizzato a una categoria esistente e a relazioni tipizzate (almeno `is-a`), oppure marcarli chiaramente come "personalizzati, fuori dalla rete".

#### D-03 — Qualità stilistica dei testi non automatizzabile (priorità: bassa)

- **Evidenza:** i test controllano punteggiatura e presenza di risposte corrette, ma non la qualità stilistica (`contesto.md` lo dichiara).
- **Suggerimento:** mantenere la revisione umana; eventualmente aggiungere un checklist editoriale in `GUIDA_CONTENUTI.md`.

#### D-04 — Copertura per età/livello (priorità: bassa)

- **Evidenza:** 6 livelli e 20 moduli; alcuni moduli escludono i livelli più bassi (es. `m19`, `m20` partono da livello 2).
- **Suggerimento:** verificare con insegnanti che la progressione sia adeguata per 3-5 anni; aggiungere esempi di percorsi per fascia d'età in `GUIDA_INSEGNANTE.md`.

---

### 5.5 Accessibilità

#### A-01 — Test automatici di accessibilità assenti (priorità: media)

- **Evidenza:** nessun test axe/ARIA nel repository; `ACCESSIBILITA.md` propone verifiche manuali.
- **Suggerimento:** aggiungere test automatici (axe) sulle schermate principali e checklist screen reader.

#### A-02 — Verifica con tecnologie assistive reali non eseguita (priorità: media)

- **Evidenza:** documentato come limite noto (NVDA, VoiceOver, TalkBack).
- **Suggerimento:** pianificare una sessione di test con almeno uno screen reader per piattaforma.

#### A-03 — Scansione per singolo interruttore (priorità: bassa)

- **Evidenza:** documentato come limite; non gestisce più dispositivi contemporaneamente.
- **Suggerimento:** dichiarare il limite in UI (già in docs) e, se richiesto, valutare scansione a due interruttori.

#### A-04 — Contrasto dei pittogrammi ARASAAC non modificabile (priorità: bassa)

- **Evidenza:** documentato; l'app fornisce sempre alt text e audio.
- **Suggerimento:** considerare uno sfondo uniforme/contorno per migliorare la leggibilità, senza alterare l'immagine originale.

---

### 5.6 Performance e offline

#### Perf-01 — Bundle JS unico (priorità: bassa/media)

- Già segnalato in Q-04.

#### Perf-02 — Registrazioni (Blob) in IndexedDB senza limiti (priorità: bassa)

- **Evidenza:** `addRecording` salva Blob senza controllo dimensione.
- **Suggerimento:** limiti dimensione/durata, compressione, e avviso di spazio.

#### Perf-03 — Service worker non verificato in questo diagnostic (priorità: bassa)

- **Evidenza:** `public/sw.js` esiste; non è stato testato offline.
- **Suggerimento:** eseguire la checklist di `TEST.md` (offline dopo `npm run preview`).

---

### 5.7 Sicurezza e privacy

#### S-01 — PIN area adulti non crittografico (priorità: bassa, documentato)

- **Evidenza:** documentato; i dati restano leggibili nel browser.
- **Suggerimento:** nessuna modifica necessaria per lo scope educativo; eventualmente aggiungere avviso più visibile.

#### S-02 — Export JSON contiene dati del bambino (priorità: bassa, documentato)

- **Evidenza:** già documentato.
- **Suggerimento:** mantenere avviso; considerare opzione di esportazione anonimizzata (solo statistiche).

#### S-03 — Assenza di CSP in Electron (priorità: bassa)

- **Suggerimento:** valutare una Content Security Policy restrittiva per il renderer, compatibile con gli asset locali.

---

### 5.8 Test e qualità

#### T-01 — Copertura E2E minima (priorità: media)

- **Evidenza:** solo 3 test E2E; il ciclo didattico (fasi, scheda parola, feedback contrastivo, transfer) è verificato manualmente.
- **Suggerimento:** automatizzare almeno un test per: creazione profilo → sessione → errore con spiegazione contrastiva → modello completo → riepilogo con transfer.

#### T-02 — Test di persistenza DB e import/export (priorità: media)

- **Evidenza:** nessun test su `db.importDatabase`/`exportDatabase` con Blob e cascade delete.
- **Suggerimento:** aggiungere test unitari per round-trip e cancellazione.

#### T-03 — Test di accessibilità e i18n (priorità: bassa/media)

- **Suggerimento:** aggiungere test per chiavi mancanti e per navigazione da tastiera.

---

## 6. Matrice di priorità

| ID | Area | Priorità | Effort stimato |
|---|---|---|---|
| F-01 | Funzionale | Alta | Medio |
| F-02 | Funzionale | Alta | Medio |
| Q-01 | Qualità | Media/Alta | Alto |
| P-02 | Pedagogica | Media/Alta | Medio |
| F-03 | Funzionale | Media | Basso |
| F-06 | Funzionale | Media | Basso |
| Q-02 | Qualità | Media | Basso |
| Q-03 | Qualità | Media | Medio |
| D-01 | Didattica | Media | Basso |
| D-02 | Didattica | Media | Medio |
| A-01 | Accessibilità | Media | Medio |
| A-02 | Accessibilità | Media | Medio |
| T-01 | Test | Media | Medio |
| T-02 | Test | Media | Basso |
| P-01 | Pedagogica | Media | Basso |
| Q-04 | Qualità | Bassa/Media | Medio |
| Q-05 | Qualità | Media | Medio |
| Perf-02 | Performance | Bassa | Basso |
| Perf-03 | Performance | Bassa | Basso |
| S-03 | Sicurezza | Bassa | Medio |
| P-03..P-07 | Pedagogica | Bassa | Basso/Medio |
| D-03, D-04 | Didattica | Bassa | Basso |
| A-03, A-04 | Accessibilità | Bassa | Basso/Medio |

---

## 7. Roadmap suggerita

### Breve termine (1-2 settimane)

1. Correggere F-01 (backup registrazioni) e F-02 (cancellazione a cascata).
2. Ricaricare `global` in `importData` (F-03).
3. Aggiornare `contesto.md` (Q-02).
4. Aggiungere verifica checksum nell'updater (F-06).
5. Documentare chiaramente la parzialità della traduzione (D-01).

### Medio termine (1-2 mesi)

6. Completare o limitare l'i18n (Q-01).
7. Aggiungere test E2E del ciclo didattico (T-01) e test DB (T-02).
8. Verificare la voce neurale su dispositivo reale (checklist esistente).
9. Test di accessibilità con screen reader (A-02) e axe (A-01).
10. Code-splitting delle route (Q-04).

### Lungo termine (3+ mesi)

11. Concetti personalizzati nella rete semantica (D-02).
12. Valutazione iniziale non diagnostica (P-05).
13. Miglioramenti alla scansione (A-03) e al transfer (P-07).
14. Eventuale traduzione dei contenuti lessicali (solo se richiesta).

---

## 8. Limiti di questa diagnostica

- Non è stato eseguito un test su dispositivo reale (LIM, tablet, iPad, screen reader).
- La voce neurale (Piper) non è stata verificata end-to-end.
- Il test E2E non è stato eseguito in questo ambiente per mancanza del binario Chromium; si fa affidamento alla documentazione (3/3 superati in precedenza).
- Non è stata eseguita un'analisi di usabilità con bambini o insegnanti.
- Non è stato verificato il funzionamento offline del service worker.
- L'analisi qualitativa si basa sulla lettura del codice e della documentazione, non su profiling delle prestazioni.

---

**Conclusione:** il progetto è in uno stato avanzato e coerente con il proprio modello didattico. Le correzioni prioritarie riguardano soprattutto **integrità dei dati** (backup/cancellazione) e **chiarezza dell'internazionalizzazione**, non il cuore pedagogico, che è solido e ben implementato.
