import type { LearningPath } from '../engine/types'

// 10 percorsi didattici predefiniti. Ogni percorso dichiara obiettivi,
// prerequisiti indicativi, sequenza, criteri osservativi e generalizzazione.
export const PATHS: LearningPath[] = [
  {
    id: 'path-a',
    title: 'A — Prime parole',
    goal: 'Riconoscere parole funzionali ad alta frequenza e collegarle al referente.',
    prerequisites: ['Attenzione condivisa per pochi secondi', 'Accettazione dello stimolo visivo'],
    steps: [
      { moduleId: 'm1', level: 1, note: 'Due alternative molto diverse fra loro.' },
      { moduleId: 'm1', level: 1, note: 'Stesse parole con rappresentazioni diverse (generalizzazione).' },
      { moduleId: 'm1', level: 2, note: 'Tre alternative, stessa categoria.' },
      { moduleId: 'm15', level: 2, note: 'Prime denominazioni con aiuto facoltativo.' },
      { moduleId: 'm2', level: 1, note: 'Riconoscere due grandi categorie.' },
    ],
    observation: [
      'Il bambino guarda l\'immagine corretta prima di toccarla?',
      'Riconosce la parola anche con una figura diversa?',
      'Accetta di usare la barra CAA per rispondere?',
    ],
    generalization: [
      'Usare gli oggetti reali della classe con le stesse parole.',
      'Chiedere al bambino di indicare l\'oggetto nella stanza.',
    ],
    level: 1,
  },
  {
    id: 'path-b',
    title: 'B — Comprendere gli oggetti',
    goal: 'Conoscere categorie, proprietà e funzioni degli oggetti di uso quotidiano.',
    prerequisites: ['Riconoscimento di 10-15 parole concrete'],
    steps: [
      { moduleId: 'm3', level: 1, note: 'Funzione unica e evidente.' },
      { moduleId: 'm4', level: 2, note: 'Proprietà percettive: morbido/duro, caldo/freddo.' },
      { moduleId: 'm2', level: 2, note: 'Due categorie con contenitori.' },
      { moduleId: 'm14', level: 2, note: 'Descrizione guidata con la mappa a sei domande.' },
      { moduleId: 'm6', level: 2, note: 'Intruso con criterio dichiarato.' },
    ],
    observation: [
      'Nomina la funzione senza suggerimenti?',
      'Distingue una proprietà tipica da una universale?',
      'Usa la stessa parola in contesti diversi?',
    ],
    generalization: [
      'Preparare la tavola usando le parole apprese.',
      'Riordinare un cassetto classificando per funzione.',
    ],
    level: 2,
  },
  {
    id: 'path-c',
    title: 'C — Costruire relazioni',
    goal: 'Collegare concetti con relazioni tipizzate: parte-intero, funzione, luogo, uso.',
    prerequisites: ['Categorie di base consolidate'],
    steps: [
      { moduleId: 'm5', level: 2, note: 'Coppie oggetto-funzione.' },
      { moduleId: 'm5', level: 3, note: 'Animale-habitat, professione-strumento.' },
      { moduleId: 'm19', level: 3, note: 'Esplorare una mappa e nominare le relazioni.' },
      { moduleId: 'm2', level: 4, note: 'Categorie e sottocategorie.' },
      { moduleId: 'm14', level: 4, note: 'Descrizione con relazioni esplicite.' },
    ],
    observation: [
      'Dice il tipo di relazione o solo i due nomi?',
      'Accetta più associazioni corrette?',
      'Sa spiegare perché due cose sono collegate?',
    ],
    generalization: [
      'Costruire una mappa con oggetti reali della classe.',
      'Chiedere "con che cosa si usa?" durante le attività quotidiane.',
    ],
    level: 3,
  },
  {
    id: 'path-d',
    title: 'D — Verbi e azioni',
    goal: 'Comprendere e usare i verbi, riconoscere agente e oggetto nelle frasi.',
    prerequisites: ['Comprensione di frasi di due parole'],
    steps: [
      { moduleId: 'm11', level: 1, note: 'Azioni molto diverse, con il corpo.' },
      { moduleId: 'm11', level: 3, note: 'Azioni simili: spingere/tirare.' },
      { moduleId: 'm12', level: 2, note: 'Comporre chi + azione + oggetto.' },
      { moduleId: 'm12', level: 4, note: 'Frasi reversibili.' },
      { moduleId: 'm17', level: 4, note: 'Inferenze sulle azioni.' },
    ],
    observation: [
      'Riconosce il verbo in una scena affollata?',
      'Distingue chi compie l\'azione?',
      'Usa il verbo spontaneamente in una frase?',
    ],
    generalization: [
      'Mimare le azioni e farle nominare.',
      'Descrivere le azioni durante il gioco libero.',
    ],
    level: 2,
  },
  {
    id: 'path-e',
    title: 'E — Recuperare le parole',
    goal: 'Migliorare l\'accesso lessicale con indizi graduati e senza obbligo di risposta orale.',
    prerequisites: ['Comprensione recettiva stabile di almeno 20 parole'],
    steps: [
      { moduleId: 'm15', level: 2, note: 'Attesa e indizio di contesto.' },
      { moduleId: 'm13', level: 3, note: 'Indizi progressivi.' },
      { moduleId: 'm15', level: 4, note: 'Indizio funzionale e categoriale.' },
      { moduleId: 'm19', level: 4, note: 'Espansione della rete semantica.' },
      { moduleId: 'm14', level: 4, note: 'Descrizione come appoggio al recupero.' },
    ],
    observation: [
      'La parola emerge spontaneamente o solo con aiuto?',
      'Quale indizio è più efficace?',
      'Risponde con simboli o gesti senza parlare?',
    ],
    generalization: [
      'Gioco del "che cos\'è?" con oggetti reali.',
      'Usare la barra CAA per chiedere oggetti desiderati.',
    ],
    level: 3,
  },
  {
    id: 'path-f',
    title: 'F — Descrivere e spiegare',
    goal: 'Costruire definizioni e confronti usando caratteristiche, funzioni e categorie.',
    prerequisites: ['Descrizione guidata con aiuto'],
    steps: [
      { moduleId: 'm14', level: 3, note: 'Mappa semantica completa.' },
      { moduleId: 'm7', level: 4, note: 'Sinonimi in contesto.' },
      { moduleId: 'm8', level: 4, note: 'Contrari e sfumature.' },
      { moduleId: 'm6', level: 5, note: 'Giustificare l\'intruso.' },
      { moduleId: 'm19', level: 5, note: 'Rete semantica come supporto alla definizione.' },
    ],
    observation: [
      'La descrizione contiene categoria e funzione?',
      'Usa connettivi semplici ("perché", "quindi")?',
      'Confronta due oggetti della stessa categoria?',
    ],
    generalization: [
      'Descrivere un oggetto a un compagno che deve indovinarlo.',
      'Gioco del negoziante: descrivere per farsi capire.',
    ],
    level: 4,
  },
  {
    id: 'path-g',
    title: 'G — Capire le storie',
    goal: 'Comprendere microstorie, seguire la sequenza e fare inferenze semplici.',
    prerequisites: ['Comprensione di frasi con tre elementi'],
    steps: [
      { moduleId: 'm20', level: 2, note: 'Storie con due o tre pannelli.' },
      { moduleId: 'm10', level: 3, note: 'Ordinare le sequenze della storia.' },
      { moduleId: 'm16', level: 4, note: 'Riconoscere che cosa non torna.' },
      { moduleId: 'm17', level: 4, note: 'Inferenze causali e contestuali.' },
      { moduleId: 'm20', level: 5, note: 'Domande inferenziali e riuso delle parole.' },
    ],
    observation: [
      'Ricorda personaggi e oggetti?',
      'Risponde a domande esplicite senza rileggere?',
      'Distingue ciò che è scritto da ciò che si deduce?',
    ],
    generalization: [
      'Raccontare la storia a casa con le immagini.',
      'Trasferire la sequenza nella routine quotidiana.',
    ],
    level: 3,
  },
  {
    id: 'path-h',
    title: 'H — Potenziamento con CAA',
    goal: 'Svolgere attività recettive ed espressive usando simboli, senza richiedere linguaggio verbale.',
    prerequisites: ['Accesso a un sistema di simboli', 'Uso di un supporto di selezione'],
    steps: [
      { moduleId: 'm1', level: 1, note: 'Risposta con tocco o selezione assistita.' },
      { moduleId: 'm5', level: 3, note: 'Associazioni con pittogrammi.' },
      { moduleId: 'm12', level: 3, note: 'Composizione di frasi con simboli.' },
      { moduleId: 'm14', level: 3, note: 'Descrizione rispondendo con i simboli.' },
      { moduleId: 'm20', level: 5, note: 'Domande con risposte simboliche.' },
    ],
    observation: [
      'Usa i simboli funzionali (voglio, ancora, basta) in modo pertinente?',
      'Compone frasi di due o tre simboli?',
      'L\'accesso motorio è adeguato al bisogno?',
    ],
    generalization: [
      'Portare la barra CAA in altri momenti della giornata.',
      'Costruire una tabella personalizzata con le parole della classe.',
    ],
    level: 2,
  },
  {
    id: 'path-i',
    title: 'I — Linguaggio quotidiano',
    goal: 'Usare il lessico in contesti reali: casa, scuola, spesa, autonomie.',
    prerequisites: ['Vocabolario di base della vita quotidiana'],
    steps: [
      { moduleId: 'm3', level: 2, note: 'Funzioni degli oggetti di casa.' },
      { moduleId: 'm2', level: 2, note: 'Categorie alimentari al supermercato.' },
      { moduleId: 'm10', level: 2, note: 'Routine della giornata.' },
      { moduleId: 'm9', level: 2, note: 'Posizioni nello spazio reale.' },
      { moduleId: 'm17', level: 4, note: 'Inferenze nelle situazioni quotidiane.' },
    ],
    observation: [
      'Trasferisce le parole nelle azioni reali?',
      'Chiede aiuto con le parole o con i simboli?',
      'Comprende le consegne di due passaggi?',
    ],
    generalization: [
      'Fare la spesa con una lista illustrata.',
      'Preparare la tavola seguendo una consegna verbale.',
      'Attività fuori dallo schermo con registrazione dell\'esito da parte dell\'adulto.',
    ],
    level: 2,
  },
  {
    id: 'path-l',
    title: 'L — Semantica avanzata',
    goal: 'Lavorare su polisemia, analogie, contrari, categorie astratte e inferenze complesse.',
    prerequisites: ['Buona comprensione di frasi e categorie'],
    steps: [
      { moduleId: 'm8', level: 5, note: 'Contrari non solo percettivi.' },
      { moduleId: 'm18', level: 4, note: 'Polisemia con contesti chiari.' },
      { moduleId: 'm6', level: 6, note: 'Intrusi con criteri astratti.' },
      { moduleId: 'm17', level: 6, note: 'Inferenze con più risposte plausibili.' },
      { moduleId: 'm20', level: 6, note: 'Storie con significati figurati semplici.' },
    ],
    observation: [
      'Usa il contesto per scegliere il significato?',
      'Spiega una somiglianza e una differenza?',
      'Riconosce l\'ambiguità senza irrigidirsi su una sola interpretazione?',
    ],
    generalization: [
      'Cercare parole con più significati nei libri di classe.',
      'Gioco delle analogie con oggetti della vita quotidiana.',
    ],
    level: 5,
  },
]

export const PATH_BY_ID = new Map(PATHS.map((p) => [p.id, p]))
