# Test e verifica

## Test automatici

```bash
npm test          # Vitest, esecuzione singola
npm run test:watch
npm run build     # typecheck (tsc -b) + build Vite
npm run e2e       # Playwright (richiede browser installati)
```

### Copertura attuale

**Stato**: 105 test superati (27 contenuti, 27 motore, 23 modello didattico, 18 audio, 10 regole dell'aggiornamento).

**Contenuti** (`src/data/content.test.ts`)

- archivio: almeno 250 concetti, almeno 20 categorie, nessuna relazione o immagine mancante, definizioni non segnaposto, tutte le parti del discorso, metadati di licenza, ambiguità documentate;
- relazioni: etichette distinte per tipi distinti, nessuna confusione tra "è un tipo di", "è parte di", "serve per", "si usa con";
- banca: almeno 300 esercizi validi, nessun item scartato, copertura dei moduli 1-18, tutte le tipologie di risposta, consegne in italiano con punteggiatura corretta, più livelli per modulo, tutte le risposte corrette dichiarate; le consegne sulle azioni descrivono l'azione e le scene spaziali usano articoli e preposizioni corretti;
- storie: almeno 20, domande esplicite e inferenziali, una sola risposta corretta per domanda, concetti esistenti, almeno due domande per storia con opzioni illustrate;
- mappe: almeno 30, relazioni tipizzate, nodi esistenti;
- percorsi e ambienti: almeno 10 percorsi con criteri osservativi, almeno 6 ambienti con hotspot validi e missioni coerenti;
- barra CAA con le nove parole richieste;
- ogni categoria usata da almeno un concetto.

**Modello didattico** (`src/engine/pedagogy.test.ts`)

- fasi della sessione: riscaldamento e dimostrazione in apertura, pratica autonoma solo dopo quella guidata, gestione di sessioni da 1, 2 e 3 attività, mini-lezione che parte dalla dimostrazione;
- aiuti: la pratica autonoma non toglie alternative, la dimostrazione mostra la soluzione;
- analisi dell'errore: categoria affine, gruppi diversi, relazione semantica, selezione parziale, ordine, coppie e contenitori; nessuna formula punitiva; spiegazioni costruite su lemmi e categorie reali;
- esempio svolto con passaggi e messaggio che l'errore è reversibile;
- transfer: compiti non segnaposto, limite di tre, funziona anche senza concetti;
- prossimo passo: nessun dato non inventa nulla, errore recente propone ripasso, competenza stabile propone di alzare il livello;
- scheda parola e parola del giorno (stabile nella giornata, diversa nel tempo);
- mini-lezione: tre attività valide sul concetto scelto, nessuna lezione per concetti senza immagine.

**Aggiornamento** (`src/engine/updater-rules.test.ts`)

- confronto versioni numerico (`1.2.10` > `1.2.9`), prefisso `v`, prerelease precedente alla stabile, versione non valida che non attiva nulla;
- scelta del file: su Mac Apple Silicon il DMG `mac-arm64` e non quello Intel, su Mac Intel il `mac-x64`, su Windows l'installer NSIS `windows-x64`, su Linux l'AppImage `amd64` letto come x64;
- nessun download quando il file adatto manca (architettura sconosciuta, release con solo lo zip web, elenco vuoto).

**Motore** (`src/engine/engine.test.ts`)

- stato "nuovo" senza esposizioni;
- una singola sessione perfetta non produce "consolidato";
- il consolidamento richiede sessioni e tipi di attività diversi;
- un errore riporta il concetto fra quelli da riprendere;
- tempi molto lunghi non cambiano stato né livello suggerito;
- l'adattamento riduce le alternative dopo prestazioni basse;
- la modalità manuale non modifica nulla;
- riepilogo per stato;
- ripasso distribuito: 3-7-14 giorni dopo risposte corrette, ritorno al primo passo dopo un errore, coda con concetti in difficoltà, intervalli personalizzati;
- validazione: risposta non presente, immagini duplicate, elemento in due contenitori, banca interamente valida;
- composizione sessione: numero richiesto, nessuna richiesta identica consecutiva, alternanza dei moduli, filtro sui concetti target;
- generatore: alternative coerenti e senza duplicati, distrattori diversi dal target, frasi valide, scene spaziali valide, mappa di descrizione completa, scala di aiuti pertinente, selezioni multiple con tutte le risposte accettate.

### Test dell'app desktop

L'app Electron usa la stessa build Vite, servita dal protocollo interno `app://bundle`. Un test di fumo controlla che la finestra renderizzi davvero l'interfaccia (non solo che il pacchetto esista):

```bash
node scripts/verify-desktop.mjs source                 # dalla sorgente (electron .)
node scripts/verify-desktop.mjs /percorso/app           # pacchetto, avvio gestito da Playwright
node scripts/verify-desktop.mjs http://127.0.0.1:9444  # app già avviata con --remote-debugging-port=9444
```

Il controllo attende `main#main`, verifica titolo, assenza della schermata di avvio e immagini non caricate. Con la build servita da `file://` la finestra resta vuota: è il motivo del protocollo personalizzato.

### Test end-to-end

`e2e/app.spec.ts` verifica: caricamento della home, creazione di un profilo, avvio di un modulo, presenza della consegna e delle alternative, risposta con tastiera e avanzamento, accesso all'area adulti e presenza della dashboard.

Non coprono il ciclo didattico (fasi, scheda parola, feedback contrastivo, transfer): sono verificati dai test unitari del modello didattico e da un controllo manuale mirato in browser sulla build 1.2.0 (parola del giorno → scheda parola → mini-lezione su «montagna» → errore con spiegazione contrastiva).

I browser Playwright non sono inclusi nel repository. Se non sono installati:

```bash
npx playwright install chromium
```

Se l'installazione non è possibile nell'ambiente, i test end-to-end vanno considerati **non eseguiti**: la verifica manuale descritta sotto resta necessaria.

**Esito:** con Chromium installato (`npx playwright install chromium`), `npm run e2e` esegue 3 test e li supera: creazione profilo e risposta con tastiera, barra CAA durante la sessione, area adulti con dashboard e contenuti validati.

## Verifica manuale consigliata

1. **Primo avvio**: home, creazione profilo pseudonimo, avvio modulo 1.
2. **Risposta corretta**: scegli l'immagine giusta, verifica feedback positivo e avanzamento.
3. **Errore**: scegli un distrattore, verifica indizio, rimozione di un distrattore e nuovo tentativo.
4. **Aiuto e modello**: premi "Aiuto" fino al modello completo.
5. **Audio**: ascolta la consegna, ripetila, regola velocità e volume.
6. **CAA**: apri la barra, componi "Voglio" + parola, pronuncia la frase.
7. **Scansione**: attiva la scansione e rispondi con Spazio/Invio.
8. **Tipi di esercizio**: prova categorizzazione, coppie, ordinamento, frase con simboli, scena spaziale, recupero, descrizione.
9. **Progressi**: completa una sessione, apri Area adulti → Progressi, esporta CSV, stampa/PDF.
10. **Backup**: esporta JSON, cancella i dati, reimporta, verifica il profilo.
11. **Persistenza**: dopo una risposta corretta, ricarica la pagina e verifica che profilo, tentativo e stato del concetto siano ancora presenti in Area adulti → Progressi.
12. **Offline**: dopo una visita con `npm run preview`, attiva la modalità offline del browser e ricarica.
13. **Dispositivo reale**: tablet/LIM con tocco, verifica bersagli e leggibilità.

## Esito dell'ultima verifica in browser

Eseguita su `http://127.0.0.1:5173/` con Chromium:

- creazione profilo, avvio modulo 1 livello 1, risposta corretta con feedback e avanzamento;
- barra CAA: apertura, composizione "Voglio", ripetizione della parola in gioco;
- Area adulti → Progressi: 1 concetto presentato, 1 riconosciuto autonomamente, anguria in apprendimento;
- ricaricamento della pagina: profilo e tentativo ancora presenti dopo la correzione della scrittura su IndexedDB;
- mappe semantiche: grafo con etichette di relazione e nodi attivabili;
- home bambino: miniature delle storie con pittogrammi locali.

## Cosa non è coperto dai test automatici

- Sintesi neurale reale: la normalizzazione, la coda e la chiave di cache sono coperte dai test; il download del modello, la sintesi WAV e la riproduzione vanno verificati su un dispositivo reale (63,5 MB di modello e ~108 MB di asset WebAssembly).
- Voce italiana del sistema: verificare manualmente la presenza su ciascun dispositivo.
- `MediaRecorder` e permessi microfono: richiedono un browser con dispositivo audio.
- Layout su LIM, tablet e iPad: verificare manualmente.
- Tecnologie assistive reali (NVDA, VoiceOver, TalkBack).
- Installazione PWA su ciascun sistema operativo.
