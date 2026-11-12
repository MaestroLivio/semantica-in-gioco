# Changelog

## 1.2.0 — ridisegno didattico e versione web

### Aggiunto

- **Ciclo didattico della sessione** (`src/engine/pedagogy.ts`): riscaldamento con una parola nota, esempio svolto con ragionamento esplicito (I do), pratica guidata (we do), pratica autonoma senza riduzione automatica delle alternative (you do), chiusura con compiti di transfer. Ogni fase dichiara che cosa sente il bambino e perché esiste, e mostra o nasconde gli aiuti di conseguenza.
- **Scheda parola** (`src/ui/WordCard.tsx`): immagine, definizione, categoria, funzione, caratteristiche, luogo, uso, esempio e parole collegate, tutti ascoltabili riga per riga. Si apre dalla parola del giorno, dall'atlante e come modello in sessione. L'esempio non è più duplicato nella griglia.
- **Feedback contrastivo sull'errore**: `analyseSelection`, `analysePair`, `analyseCategorize`, `analyseOrder` distinguono errore di categoria affine, gruppo diverso, relazione tematica, selezione parziale e ordine, e spiegano la differenza con i dati reali del lessico. Nessun messaggio punitivo.
- **Esempio svolto** (`workedExample`) con i passaggi del ragionamento e il modello completo dopo due tentativi.
- **Transfer fuori dallo schermo**: ogni sessione chiude con due o tre compiti derivati dalle relazioni, funzioni e contesti dei concetti incontrati.
- **Prossimo passo** (`nextStepRecommendation`): proposta didattica con ragione scritta, concetti, moduli, livello e modalità; visibile nella home del bambino, nel riepilogo e nella dashboard, e avviabile con un tocco.
- **Parola del giorno** e **mini-lezione** sul concetto scelto (`conceptLesson`): tre attività generate sul concetto, senza passare dalla banca, così la parola mostrata è davvero quella.
- **Guida per l'adulto in sessione**: pannello richiudibile con obiettivo del modulo e indicazioni operative, accanto al bambino e non davanti.
- **Build web** (`npm run build:web`): sostituisce il motore neurale con una variante che dichiara il limite, elimina il chunk WebAssembly da ~45 MB e produce 482 file / 3,7 MB.
- **Aggiornamento automatico dell'app desktop** (`electron/updater.cjs`, `electron/updater-rules.cjs`): a ogni avvio l'app interroga le release GitHub, confronta la versione, scarica solo il file della propria piattaforma (DMG arm64/x64 per macOS, installer NSIS x64 per Windows, AppImage per Linux), poi si chiude e apre l'installer. Avanzamento visibile in un avviso non invasivo; durante una sessione non si chiude da sola. Pannello «Aggiornamenti» in Impostazioni con «Controlla ora», note della release e interruttore «Installa automaticamente all'avvio» (preferenza salvata in `aggiornamenti.json` nella cartella dati). Il renderer non ha accesso alla rete: parla al processo principale via `electron/preload.cjs` (`contextBridge` + IPC), con URL delle release limitati a `https://github.com/`.
- **Distribuzione su GitHub**: repository <https://github.com/MaestroLivio/semantica-in-gioco> e release con installer macOS arm64, Windows x64 e archivio web.
- 23 nuovi test (modello didattico e mini-lezione) e 10 sulle regole dell'aggiornamento: **105 test totali**.

### Cambiato

- I pittogrammi sono serviti in **WebP** (q78): stessa resa, circa un quarto del peso; lo script `npm run stimuli` converte al download.
- `planSession` accetta `startWithModel` per le mini-lezioni nate da una scheda parola.
- Un plugin di build rimuove i file `._*` creati da macOS sui volumi ExFAT, che alcuni host rifiutano.
- Vitest esclude i file `._*` dalla raccolta dei test.
- Versione 1.2.0; la documentazione didattica è in `PEDAGOGIA.md`.

### Note

- Nella build web la voce neurale Piper non è disponibile: si usa la voce italiana del dispositivo o le registrazioni personalizzate, e l'app lo dichiara in Impostazioni → Voce e modello. L'app desktop continua a includerla.
- Pacchetti 1.2.0 rigenerati per macOS arm64 (`npm run dist:mac:arm`) e Windows x64 (`npm run dist:win:x64`); le altre architetture restano alla 1.0.0.
- L'aggiornamento automatico apre l'installer ma non firma nulla: su macOS il DMG va trascinato in Applicazioni, su Windows l'installer NSIS chiede conferma. Non c'è ancora una verifica crittografica del file scaricato oltre al TLS di GitHub.
- Il modello didattico è motivato e verificato nei suoi comportamenti software, non con uno studio controllato: resta uno strumento educativo, non una terapia.

## 1.1.0 — motore vocale neurale (in verifica)

### Aggiunto

- **Livello audio astratto** (`src/state/tts/`): `SpeechEngine` con tre implementazioni — `NeuralSpeechEngine` (Piper via WebAssembly, modello `it_IT-paola-medium`), `RecordedSpeechEngine` (pacchetto audio pregenerato) e `SystemSpeechEngine` (voce del dispositivo come fallback).
- **Normalizzazione italiana** prima della sintesi: numeri, decimali, migliaia, unità di misura, sigle, simboli; dizionario di pronuncia per gli omografi, applicato solo all'audio e mai al testo mostrato.
- **Coda vocale** con priorità, interruzione immediata e ripetizioni; una sola voce alla volta.
- **Cache audio persistente** su IndexedDB separato (`semantica-tts-cache`), con chiave testo+voce+versione+velocità, limite di spazio e rimozione delle voci meno usate.
- **Pannello adulti “Voce e modello”** in Impostazioni: stato del motore, download esplicito del modello, dimensione, licenza, stato offline, spazio occupato dalla cache, rimozione del modello.
- Nuove preferenze di profilo audio: motore, velocità lenta, ripetizioni della consegna, pausa prima/dopo, ripetizione della sola parola target, lettura dei feedback.
- 18 nuovi test automatici (normalizzazione, coda, chiave di cache): **72 test totali**.

### Note

- I profili creati con la 1.0.0 ricevono i nuovi campi audio con valori di riserva, senza migrazioni distruttive del database.
- La build copia in `dist/` gli asset WebAssembly di Piper (`onnx/`, `piper/`, `worker/`, ~108 MB) e carica il runtime in un chunk separato (~45 MB, ~12,9 MB gzip) solo quando serve. Con `SEMANTICA_SKIP_TTS_ASSETS=1` la copia viene saltata.

## 1.0.0 — prima versione completa

### Fase 1 — Fondamenta

- Architettura React + TypeScript + Vite, PWA installabile con service worker e funzionamento offline.
- Profili locali pseudonimi su IndexedDB, import/export JSON, cancellazione effettiva.
- Archivio lessicale con relazioni tipizzate e 289 concetti illustrati tramite pittogrammi ARASAAC locali (CC BY-NC-SA 4.0, con attribuzione).
- Sintesi vocale italiana del dispositivo con ripetizione illimitata, velocità/volume, avviso quando la voce italiana manca.
- Design system accessibile: alt contrasto, animazioni ridotte, modalità essenziale/standard/esplorazione, bersagli grandi per LIM.
- Opzione per profilo **Solo caratteri maiuscoli**: l'intera interfaccia, comprese le etichette dei simboli, passa in maiuscolo senza modificare i contenuti salvati.

### Fase 2 — Nucleo semantico

- Moduli 1-6 completi e operativi: parole e immagini, categorie, funzioni, attributi, associazioni, intruso semantico.
- Banca curata con validazione automatica: risposta corretta fra le opzioni, immagini non duplicate, contenitori coerenti, tutte le risposte accettate.
- Categorizzazione, coppie, intruso con criterio esplicito e spiegazione assistita.

### Fase 3 — Espansione didattica

- Moduli 7-15: sinonimi, contrari, relazioni spaziali, temporali, verbi, agente-azione-oggetto, indovina dalla descrizione, descrizione con mappa semantica, recupero lessicale con aiuti graduati e indizio fonologico opzionale.
- Scena spaziale interattiva con alternativa al trascinamento.
- Composizione di frasi con simboli.

### Fase 4 — Semantica avanzata

- Moduli 16-18: assurdità e anomalie (con distinzione reale/fantastico), inferenze e cause, polisemia.
- 20 microstorie illustrate con domande esplicite, inferenziali, di sequenza e lessicali.
- 30 mappe semantiche con relazioni tipizzate ed elenco accessibile equivalente al grafo.

### Fase 5 — Ambientazioni

- Sei ambienti 2D: casa, supermercato, fattoria, città, bosco, scuola.
- Esplorazione libera senza valutazione e missioni con obiettivo semantico.

### Fase 6 — Adattività e monitoraggio

- Motore adattivo con alternative, indizi e richiesta di recupero regolati sulle prestazioni; i tempi non penalizzano.
- Consolidamento basato su sessioni e tipi di attività diversi, con soglie configurabili.
- Ripetizione distribuita 1-3-7-14 giorni.
- Generatore di sessioni bilanciato con alternanza dei moduli e filtro sui concetti.
- Dashboard con dimensioni separate, export CSV, stampa/PDF, annotazioni osservative.
- Barra CAA con nove parole funzionali sempre disponibile.

### Fase 7 — Completamento e validazione

- 360 esercizi validati (nessuno escluso), 10 percorsi didattici, 6 ambienti, 30 mappe, 20 storie.
- Test automatici (Vitest) su contenuti e motore: 54 test; test end-to-end Playwright inclusi ed eseguiti con Chromium (3/3).
- Documentazione: README, architettura, guida insegnante, guida contenuti, accessibilità, test.
- Contenuti personalizzati con fotografie e registrazioni vocali facoltative.

### Correzioni dopo la verifica in browser

- Scrittura su IndexedDB: i `put` passavano una chiave esplicita a store con chiave in-line, causando `DataError` e la perdita di profili e tentativi al ricaricamento. Ora la chiave resta nel record.
- Miniature delle storie nella schermata bambino: la sorgente immagine era sempre vuota e mostrava "Immagine non disponibile". Ora usa il pittogramma della parola chiave della storia.
- Barra CAA: la parola in gioco veniva passata come `undefined`. Ora il pulsante "Simboli" può ripetere la parola dell'esercizio e inserirla nella frase.

### Fase 8 — Distribuzione desktop

- Contenitore Electron con isolamento (`contextIsolation`, `sandbox`, nessun Node nel renderer), istanza singola, menu italiano, stampa/PDF e apertura dei link esterni nel browser di sistema.
- Correzione durante la verifica: la build è servita dal protocollo interno `app://bundle` invece di `file://`, che bloccava i moduli ES lasciando la finestra vuota.
- Pacchetti generati in `release/`: DMG e ZIP macOS arm64/x64, installer NSIS e ZIP Windows x64, AppImage/deb/tar.gz Linux arm64/x64, archivio PWA per ChromeOS.
- Avvio del pacchetto macOS verificato con Playwright; guida di installazione per i quattro sistemi in `INSTALLAZIONE.md`.
- Icona e metadati (nome, versione, descrizione) applicati all'eseguibile e all'installer Windows tramite wine di Wineskin, con prefisso isolato; verifica delle risorse PE nel file finale.
- I pacchetti non sono firmati digitalmente e non includono aggiornamenti automatici.

### Fase 9 — Revisione dei contenuti e ascolto

- Consegne riscritte per essere univoche: le attività sulle azioni chiedono "Quale immagine mostra l'azione di…" invece di "Chi…?", che poteva far pensare a una persona; funzioni, categorie e scene spaziali usano articoli e preposizioni corretti ("Metti la palla dentro la scatola").
- Domande delle storie: ogni opzione concreta mostra i pittogrammi dei concetti che sostiene; prima delle domande compare il riepilogo illustrato di tutte le scene, riascoltabili una per una.
- Ascolto esteso a moduli, ambienti, missioni, atlante, mappe, scene della storia, domande, opzioni e spiegazioni, con pulsanti dedicati e ripetizione illimitata.
- Simboli grafici SVG locali in tutti i pulsanti: icona a sinistra del testo, controlli di ascolto con altoparlante dedicato e bersagli più ampi, così l'azione è riconoscibile anche senza leggere.
- Test aggiornati a 54 (27 contenuti + 27 motore), inclusi i controlli su immagini delle storie, consegne delle azioni e grammatica delle scene spaziali.

### Lingua dell'interfaccia: italiano e inglese britannico

- Nuova preferenza del dispositivo `GlobalSettings.language` (`it` | `en`), con selettore **IT / EN** nell'intestazione e in Impostazioni. È una scelta del dispositivo, non del singolo profilo: non modifica profili, tentativi, annotazioni o contenuti.
- Dizionario centrale `src/i18n/strings.ts` con chiavi semantiche `{ it, en }` (inglese britannico: *colour, organisation, licence, programme, recognise, behaviour*) e API `translate(language, key, vars)` / `useI18n()` con `htmlLang` (`it` / `en-GB`).
- `<html lang>` ora segue la lingua scelta, così screen reader e correttori ricevono il codice corretto.
- Interfaccia convertita: struttura e navigazione, PIN dell'area adulti, home, home del bambino (attività, ambienti, storie, mappe, scelta del livello), impostazioni, pannello Voce e modello, informazioni e licenze, pulsanti comuni (Ascolta, Chiudi, Annulla, Ripeti).
- Barra CAA bilingue: le nove parole funzionali hanno etichetta e pronuncia inglese (`I want`, `I don't want`, `More`, `Stop`, `Help`, `Repeat`…), così resta utilizzabile quando l'interfaccia è in inglese.
- Dati strutturali con campi inglesi facoltativi: titolo e obiettivo dei 20 moduli, etichetta, singolare e definizione delle 26 categorie, con gli helper `moduleTitleIn`, `moduleGoalIn`, `categoryLabel`, `categorySingular`, `categoryDefinition` e riserva italiana se il campo manca.
- I contenuti lessicali (lemmi, definizioni, consegne, banca esercizi, storie, mappe, ambienti, percorsi) **restano in italiano**: nessuna traduzione automatica non revisionata. In inglese l'app li mostra in italiano e lo dichiara in *Informazioni → Lingua dei contenuti*.
- Verifiche: `npx tsc -b` pulito, 72 test invariati (27 contenuti + 27 motore + 18 voce), `npm run build` riuscito con `SEMANTICA_SKIP_TTS_ASSETS=1`. L'interfaccia inglese non è stata ancora ispezionata in browser: va guardata su schermo, comprese le etichette lunghe dei moduli.

### Pacchetti rigenerati (5 novembre 2026)

- Release desktop ricostruita dopo le modifiche alla lingua, con la stessa versione 1.0.0: macOS (DMG e ZIP, arm64 e x64), Windows (installer NSIS e ZIP x64), Linux (AppImage, deb e tar.gz per x64 e arm64), più l'archivio PWA per ChromeOS e Android.
- Gli ZIP macOS e i tar.gz Linux della prima passata erano troncati perché la compressione di un payload di ~950 MB superava il tempo disponibile: sono stati rifatti fino al completamento e verificati per dimensione e data.
- Windows è stato prodotto **senza wine**: electron-builder ha aggiornato le risorse dell'eseguibile con i propri strumenti, firma saltata. Formato verificato (PE32 NSIS), icona e metadati non ispezionati.
- `release/SHA256SUMS.txt` rigenerato su tutti gli artefatti; i log di build sono stati rimossi dalla cartella di release.
- Android: nessun pacchetto nativo (Electron non produce APK). La via documentata è la PWA installata da Chrome. ChromeOS usa la stessa PWA oppure il .deb su Crostini.
- Nessun pacchetto è stato avviato su Windows, Linux, ChromeOS o Android in questa sessione: la verifica è limitata a formato, dimensione e integrità degli archivi.

### Limiti dichiarati in questa versione

- Sincronizzazione cloud non implementata (per scelta: local-first).
- Riconoscimento vocale non implementato: non è un prerequisito e non verrebbe usato per valutare la pronuncia.
- Il PIN dell'area adulti è un filtro locale, non una protezione crittografica.
- I browser per i test end-to-end non sono inclusi nel repository.
- Le risposte astratte delle storie (per esempio "Che cosa vuol dire simile?") restano senza pittogramma: un'immagine sarebbe fuorviante. Le opzioni concrete hanno sempre il supporto visivo.
