import type { Environment } from '../engine/types'

// Sei ambientazioni 2D. Ogni hotspot è un concetto dell'archivio:
// l'esplorazione libera mostra nome, caratteristiche e relazioni senza valutare.
export const ENVIRONMENTS: Environment[] = [
  {
    id: 'casa',
    title: 'La casa',
    description: 'Le stanze di casa con i mobili, gli oggetti e le azioni di ogni giorno.',
    words: ['sedia', 'tavolo', 'letto', 'divano', 'frigorifero', 'piatto', 'cucchiaio', 'telefono', 'lampada', 'porta', 'finestra', 'scopa'],
    hotspots: [
      { conceptId: 'divano', x: 18, y: 62 },
      { conceptId: 'tavolo', x: 48, y: 66 },
      { conceptId: 'sedia', x: 38, y: 70 },
      { conceptId: 'lampada', x: 72, y: 38 },
      { conceptId: 'porta', x: 86, y: 48 },
      { conceptId: 'finestra', x: 62, y: 30 },
      { conceptId: 'telefono', x: 20, y: 44 },
      { conceptId: 'piatto', x: 52, y: 58 },
    ],
    missions: [
      { id: 'casa-tavola', title: 'Prepariamo la tavola', goal: 'Scegliere gli oggetti giusti per mangiare.', moduleId: 'm3', level: 2, tasks: ['Trova il piatto', 'Trova il cucchiaio', 'Trova la forchetta'] },
      { id: 'casa-riordino', title: 'Riordiniamo la stanza', goal: 'Classificare per categoria.', moduleId: 'm2', level: 2, tasks: ['Metti i vestiti nell\'armadio', 'Metti i giochi nella scatola'] },
      { id: 'casa-azioni', title: 'Le azioni di casa', goal: 'Riconoscere i verbi quotidiani.', moduleId: 'm11', level: 2, tasks: ['Mostra l\'azione di cucinare', 'Mostra l\'azione di dormire', 'Mostra l\'azione di lavarsi'] },
    ],
  },
  {
    id: 'supermercato',
    title: 'Il supermercato',
    description: 'Scaffali pieni di alimenti, un carrello e una lista della spesa illustrata.',
    words: ['mela', 'banana', 'carota', 'pane', 'latte', 'formaggio', 'biscotto', 'carrello', 'scaffale', 'pomodoro'],
    hotspots: [
      { conceptId: 'mela', x: 18, y: 40 },
      { conceptId: 'banana', x: 32, y: 40 },
      { conceptId: 'carota', x: 46, y: 40 },
      { conceptId: 'pane', x: 64, y: 42 },
      { conceptId: 'latte', x: 78, y: 42 },
      { conceptId: 'formaggio', x: 24, y: 58 },
      { conceptId: 'biscotto', x: 40, y: 58 },
      { conceptId: 'carrello', x: 62, y: 78 },
    ],
    missions: [
      { id: 'sup-lista', title: 'Segui la lista', goal: 'Riconoscere i prodotti da una lista illustrata.', moduleId: 'm1', level: 2, tasks: ['Trova le mele', 'Trova il pane', 'Trova il latte'] },
      { id: 'sup-categorie', title: 'Mettiamo in ordine gli scaffali', goal: 'Classificare gli alimenti.', moduleId: 'm2', level: 3, tasks: ['Raggruppa la frutta', 'Raggruppa le bevande'] },
      { id: 'sup-richieste', title: 'Chiediamo al negoziante', goal: 'Formulare una richiesta con la CAA.', moduleId: 'm12', level: 3, tasks: ['Chiedi "voglio la mela"', 'Chiedi "voglio il latte"'] },
    ],
  },
  {
    id: 'fattoria',
    title: 'La fattoria',
    description: 'Animali, campi, attrezzi e i suoni della campagna.',
    words: ['mucca', 'gallina', 'cavallo', 'pecora', 'maiale', 'coniglio', 'trattore', 'uovo', 'erba'],
    hotspots: [
      { conceptId: 'mucca', x: 22, y: 62 },
      { conceptId: 'cavallo', x: 46, y: 60 },
      { conceptId: 'pecora', x: 66, y: 64 },
      { conceptId: 'gallina', x: 80, y: 74 },
      { conceptId: 'coniglio', x: 34, y: 78 },
      { conceptId: 'trattore', x: 58, y: 42 },
      { conceptId: 'uovo', x: 82, y: 62 },
    ],
    missions: [
      { id: 'fat-cibo', title: 'Chi mangia che cosa?', goal: 'Collegare animali e alimenti.', moduleId: 'm5', level: 2, tasks: ['Trova chi mangia l\'erba', 'Trova chi mangia la carota'] },
      { id: 'fat-verso', title: 'I versi e le caratteristiche', goal: 'Descrivere gli animali.', moduleId: 'm14', level: 3, tasks: ['Descrivi la mucca', 'Descrivi la gallina'] },
      { id: 'fat-indizi', title: 'Indovina l\'animale', goal: 'Integrare indizi semantici.', moduleId: 'm13', level: 3, tasks: ['Animale con le piume', 'Animale che dà il latte'] },
    ],
  },
  {
    id: 'citta',
    title: 'La città',
    description: 'Strade, negozi, mezzi di trasporto e persone che lavorano.',
    words: ['strada', 'autobus', 'automobile', 'negozio', 'supermercato', 'medico', 'poliziotto', 'postino', 'panettiere', 'semaforo'],
    hotspots: [
      { conceptId: 'strada', x: 50, y: 82 },
      { conceptId: 'autobus', x: 30, y: 70 },
      { conceptId: 'automobile', x: 68, y: 72 },
      { conceptId: 'negozio', x: 20, y: 46 },
      { conceptId: 'supermercato', x: 42, y: 42 },
      { conceptId: 'medico', x: 66, y: 44 },
      { conceptId: 'postino', x: 82, y: 52 },
      { conceptId: 'panettiere', x: 54, y: 56 },
    ],
    missions: [
      { id: 'citta-luoghi', title: 'Dove andiamo?', goal: 'Associare luoghi e azioni.', moduleId: 'm5', level: 3, tasks: ['Dove si compra il pane?', 'Dove si cura chi sta male?'] },
      { id: 'citta-mestieri', title: 'Chi fa che cosa?', goal: 'Collegare professioni e strumenti.', moduleId: 'm3', level: 3, tasks: ['Chi usa lo stetoscopio?', 'Chi guida l\'autobus?'] },
      { id: 'citta-sicurezza', title: 'Attraversiamo', goal: 'Comprendere una consegna complessa.', moduleId: 'm17', level: 4, tasks: ['Guarda a destra e a sinistra', 'Aspetta il verde'] },
    ],
  },
  {
    id: 'bosco',
    title: 'Il bosco',
    description: 'Alberi, sentieri, animali e suoni della natura.',
    words: ['albero', 'foglia', 'ramo', 'volpe', 'orso', 'uccello', 'fiume', 'fiore', 'sasso', 'sentiero'],
    hotspots: [
      { conceptId: 'albero', x: 20, y: 46 },
      { conceptId: 'foglia', x: 34, y: 34 },
      { conceptId: 'ramo', x: 44, y: 30 },
      { conceptId: 'volpe', x: 66, y: 70 },
      { conceptId: 'orso', x: 82, y: 62 },
      { conceptId: 'uccello', x: 56, y: 30 },
      { conceptId: 'fiume', x: 40, y: 82 },
      { conceptId: 'fiore', x: 72, y: 82 },
    ],
    missions: [
      { id: 'bosco-spazio', title: 'Dove si nasconde?', goal: 'Comprendere le relazioni spaziali.', moduleId: 'm9', level: 2, tasks: ['La volpe è dietro l\'albero', 'L\'uccello è sopra il ramo'] },
      { id: 'bosco-natura', title: 'Che cosa è naturale?', goal: 'Distinguere naturale e artificiale.', moduleId: 'm2', level: 3, tasks: ['Trova gli elementi naturali'] },
      { id: 'bosco-inferenze', title: 'Che cosa è successo?', goal: 'Fare inferenze dal contesto.', moduleId: 'm17', level: 5, tasks: ['Le foglie sono bagnate: perché?', 'La volpe scappa: perché?'] },
    ],
  },
  {
    id: 'scuola',
    title: 'La scuola',
    description: 'Aula, materiali, routine e consegne da comprendere.',
    words: ['matita', 'penna', 'quaderno', 'libro', 'forbici', 'colla', 'zaino', 'lavagna', 'sedia', 'tavolo'],
    hotspots: [
      { conceptId: 'lavagna', x: 50, y: 32 },
      { conceptId: 'matita', x: 26, y: 62 },
      { conceptId: 'quaderno', x: 40, y: 64 },
      { conceptId: 'libro', x: 56, y: 64 },
      { conceptId: 'forbici', x: 70, y: 62 },
      { conceptId: 'zaino', x: 84, y: 70 },
      { conceptId: 'colla', x: 30, y: 74 },
      { conceptId: 'sedia', x: 62, y: 78 },
    ],
    missions: [
      { id: 'scuola-materiali', title: 'Prepariamo lo zaino', goal: 'Scegliere i materiali per un compito.', moduleId: 'm3', level: 2, tasks: ['Serve per scrivere', 'Serve per incollare', 'Serve per tagliare'] },
      { id: 'scuola-consegne', title: 'Capire la consegna', goal: 'Comprendere istruzioni di due passaggi.', moduleId: 'm12', level: 3, tasks: ['Prendi la matita e disegna', 'Apri il quaderno e scrivi'] },
      { id: 'scuola-categorie', title: 'Riordiniamo la classe', goal: 'Classificare i materiali.', moduleId: 'm2', level: 3, tasks: ['Cose per scrivere', 'Cose per colorare'] },
    ],
  },
]

export const ENVIRONMENT_BY_ID = new Map(ENVIRONMENTS.map((e) => [e.id, e]))
