# Semantica in Gioco

Ambiente educativo per lo sviluppo e il potenziamento delle competenze lessicali e semantiche, per bambini dai 3 agli 11 anni. Non è un quiz illustrato: è un atlante di parole in cui immagini, suoni, relazioni tipizzate e contesti costruiscono una rete di significati esplorabile.

Ogni sessione segue un ciclo di insegnamento esplicito — **riscaldamento → dimostrazione → pratica guidata → pratica autonoma → transfer fuori dallo schermo** — e ogni errore produce una spiegazione contrastiva costruita sul lessico, non un giudizio. Il modello didattico è descritto in [PEDAGOGIA.md](PEDAGOGIA.md).

L'applicazione è pensata per insegnanti, insegnanti di sostegno, logopedisti, educatori, genitori e bambini. È uno strumento educativo e di supporto all'intervento: **non è un dispositivo diagnostico** e non sostituisce la valutazione o il trattamento logopedico.

## Avvio rapido

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build di produzione in dist/
npm run build:web  # build web leggera (senza voce neurale) per hosting e PWA
npm run preview    # anteprima della build
npm test           # test automatici (Vitest)
npx playwright install chromium   # una sola volta
npm run e2e        # test end-to-end (Playwright)
```

Requisiti: Node 20+ e un browser moderno. Nessuna API a pagamento, nessun account, nessun servizio cloud obbligatorio.

## Che cosa contiene

- **20 moduli didattici** (parole e immagini, categorie, funzioni, attributi, associazioni, intruso semantico, sinonimi, contrari, spazio, tempo, verbi, agente-azione-oggetto, indovina dalla descrizione, descrizione con mappa, recupero lessicale, assurdità, inferenze, polisemia, mappe semantiche, storie).
- **Ciclo didattico in ogni sessione**: riscaldamento con una parola nota, esempio svolto con ragionamento esplicito, pratica guidata, pratica autonoma senza riduzione automatica delle alternative, chiusura con compiti di generalizzazione.
- **Scheda parola** (categoria, funzione, caratteristiche, luogo, uso, esempio) ascoltabile riga per riga, disponibile senza dover rispondere: nella parola del giorno, nell'atlante e come modello in sessione.
- **Errori come informazione**: l'app riconosce se il bambino ha confuso due membri della stessa categoria, due gruppi diversi o un'associazione tematica, e spiega la differenza con i dati reali del lessico.
- **Prossimo passo** consigliato, derivato dalle prestazioni (riprendere, consolidare, estendere), con la ragione scritta.
- **Sei livelli** di complessità con sottolivelli e supporti indipendenti, modificabili dall'adulto.
- **289 concetti** illustrati con relazioni tipizzate, proprietà, funzioni, contesti, esempi, ambiguità e metadati di licenza.
- **360 esercizi verificati** nella banca curata (0 esclusi dalla validazione), più esercizi generabili con regole controllate.
- **20 microstorie** con domande esplicite e inferenziali, **30 mappe semantiche**, **10 percorsi didattici**, **6 ambienti** con esplorazione libera e missioni.
- **CAA strutturale**: barra con nove parole funzionali sempre disponibile, simboli con audio, etichette nascondibili, composizione di frasi, risposte per selezione, scansione assistita.
- **Audio italiano** tramite sintesi vocale del dispositivo, ripetibile, con velocità e volume regolabili e registrazioni personalizzate facoltative.
- **Solo caratteri maiuscoli** (opzione per profilo): tutta l'interfaccia in maiuscolo, per chi sta imparando le lettere capitali.
- **Apprendimento adattivo**, ripetizione distribuita (1-3-7-14 giorni), dashboard con dimensioni separate, export CSV e stampa/PDF.
- **Local-first**: profili pseudonimi, risultati e contenuti personalizzati restano sul dispositivo; import/export JSON e cancellazione effettiva.
- **PWA offline**: installabile, funziona senza rete dopo la prima visita.

## Struttura del progetto

```
src/
  engine/        tipi, generatore di esercizi, validazione, motore adattivo, ripasso distribuito, composizione sessioni, modello didattico
  data/          archivio lessicale, categorie, banca esercizi, storie, mappe, percorsi, ambienti, parole CAA
  state/         IndexedDB, profili, sintesi vocale, store React
  ui/            componenti accessibili, player degli esercizi, scheda parola, schermate
  styles.css     design system, modalità alto contrasto/animazioni ridotte/stampa
public/
  pictograms/    pittogrammi ARASAAC in WebP, scaricati localmente (offline)
  icons/         icone PWA generate
sites/           worker e manifest della pubblicazione web
scripts/
  lexicon-keywords.mjs     inventario dei concetti e parole chiave per i pittogrammi
  fetch-pictograms.mjs     download dei pittogrammi e creazione di src/data/stimuli.json
  make-icons.mjs           generazione delle icone PNG
  make-pwa-archive.mjs     archivio della build per l'installazione PWA
electron/main.cjs          processo principale dell'app desktop
release/                   installer e pacchetti generati (non versionati)
```

Documentazione: [PEDAGOGIA.md](PEDAGOGIA.md), [ARCHITETTURA.md](ARCHITETTURA.md), [GUIDA_INSEGNANTE.md](GUIDA_INSEGNANTE.md), [GUIDA_CONTENUTI.md](GUIDA_CONTENUTI.md), [ACCESSIBILITA.md](ACCESSIBILITA.md), [TEST.md](TEST.md), [CHANGELOG.md](CHANGELOG.md).

## Versione web

La versione 1.2.0 è pubblicata su <https://site-08f3ab6cabe24e9da8845e270a0fd220.freebuff.page>: build statica, nessun backend, dati nel browser. Si rigenera con `npm run build:web` e si pubblica con il manifest `sites.deploy.json`. In questa build la voce neurale Piper non è inclusa (108 MB di WebAssembly): l'app usa la voce italiana del dispositivo o le registrazioni personalizzate, e lo dichiara in *Impostazioni → Voce e modello*.

## App desktop e installer

La stessa build è distribuita come applicazione desktop Electron per macOS, Windows e Linux e come PWA installabile su ChromeOS. I pacchetti sono in `release/`; requisiti, istruzioni e avvisi di firma sono in [INSTALLAZIONE.md](INSTALLAZIONE.md).

```bash
npm run start:desktop   # build + avvio desktop senza pacchettizzare
npm run dist:mac        # DMG + ZIP per arm64 e x64
npm run dist:win        # installer NSIS + ZIP x64
npm run dist:linux      # AppImage, deb, tar.gz per arm64 e x64
npm run pack:pwa        # archivio della build per hosting HTTPS (ChromeOS)
```

I pacchetti non sono firmati digitalmente e non hanno aggiornamento automatico: macOS e Windows mostrano un avviso al primo avvio.

## Dati e privacy

Tutto è locale (IndexedDB). Non ci sono tracker, analytics, pubblicità o invii automatici di immagini e registrazioni. I profili usano solo uno pseudonimo e una fascia d'età. Il backup JSON contiene dati del bambino e va conservato in un luogo protetto. La cancellazione dall'area adulti rimuove davvero profili, tentativi, foto e registrazioni dal dispositivo.

## Licenze delle immagini

I pittogrammi provengono da **ARASAAC** (Sergio Palao, Governo di Aragona), licenza **CC BY-NC-SA 4.0** — <https://arasaac.org>. L'app è uno strumento educativo non commerciale, con attribuzione visibile in *Informazioni e licenze* e nella documentazione. Le immagini sono scaricate dallo script incluso, convertite in WebP e servite localmente: nessuna richiesta a servizi esterni durante l'uso.

## Limiti dichiarati

- La sintesi vocale dipende dalle voci installate nel sistema: se manca una voce italiana l'app lo segnala e propone le registrazioni personalizzate.
- Il riconoscimento vocale non viene usato per valutare la pronuncia; le risposte espressive si registrano su conferma dell'adulto o del bambino.
- Gli esercizi generati automaticamente richiedono una revisione didattica dell'adulto prima dell'uso con un bambino.
- Il modello didattico (ciclo di sessione, feedback contrastivo, transfer) è descritto e motivato, ma non è stato validato con uno studio controllato: è uno strumento didattico, non una terapia.
- Il PIN dell'area adulti è un filtro locale contro gli accessi accidentali, non una protezione crittografica.
- La sincronizzazione cloud non è implementata: se verrà aggiunta sarà disattivata per impostazione predefinita e progettata separatamente.
