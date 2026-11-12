# Guida ai contenuti e al database semantico

## Come è fatto un concetto

```ts
{
  id: 'ombrello',
  lemma: 'ombrello',
  plural: 'ombrelli',
  pos: 'nome',                     // nome | verbo | aggettivo | spazio | tempo | astratto
  category: 'casa-oggetti',
  subcategory: 'oggetti per la pioggia',
  definition: 'Un oggetto che si apre sopra la testa quando piove.',
  features: ['è un oggetto', 'si apre', 'ha il manico', 'ripara dalla pioggia'],
  functions: ['si usa quando piove'],
  contexts: ['fuori', 'per strada'],
  properties: { materiale: 'stoffa', forma: 'cupola' },
  relations: [
    { type: 'used-for', target: 'pioggia' },
    { type: 'located-in', target: 'casa' }
  ],
  examples: ['Apro l\'ombrello sotto la pioggia.'],
  difficulty: 2,
  familiarity: 5,
  communicativeUse: 4,
  ambiguity: '...',                // solo se pertinente
  image: { pictogram: 1234, alts: [5678] },
  license: 'ARASAAC CC BY-NC-SA 4.0'
}
```

Regole:

- `definition` è una frase semplice, comprensibile a un bambino; non è un dizionario.
- `features` sono caratteristiche semantiche, non proprietà variabili presentate come universali.
- `properties` raccoglie proprietà **tipiche** ("può essere calda"): mai affermazioni assolute.
- `relations` usa solo i tipi di `RelationType`; non usare `similar-to` per una relazione parte-intero.
- `ambiguity` documenta i casi di polisemia (penna, rete, piano, stella).
- `difficulty` 1-6 e `familiarity`/`communicativeUse` 1-5 servono alla generazione e ai percorsi.

## Aggiungere un concetto

1. Aggiungi una voce in uno dei file `src/data/concepts-*.ts` usando il costruttore `c(...)` e `rel(...)`.
2. Aggiungi l'id e le parole chiave in `scripts/lexicon-keywords.mjs`.
3. Esegui `npm run stimuli`: lo script cerca il pittogramma su ARASAAC, scarica l'immagine in `public/pictograms/` e aggiorna `src/data/stimuli.json`. Supporta il prefisso di lingua (per esempio `es:tienda`) quando un termine non esiste nelle traduzioni italiane.
4. Esegui `npm test`: la validazione dell'archivio segnala relazioni o immagini mancanti e caratteristiche vuote.

## Aggiungere esercizi

Le voci della banca stanno in `src/data/bank-core.ts` e `src/data/bank-advanced.ts`. Ogni voce dichiara:

- modulo e livello;
- consegna in italiano (termina con punteggiatura);
- concetto target e concetti coinvolti;
- risposta o risposte corrette;
- eventuale spiegazione/modello e indizio.

Regole di validazione (`src/engine/validate.ts`), applicate a runtime e nei test:

- la risposta corretta deve essere fra le opzioni;
- per le scelte singole deve esserci **una sola** risposta corretta e nessuna immagine duplicata;
- per le selezioni multiple tutte le risposte corrette vanno dichiarate e accettate;
- i contenitori non possono contenere lo stesso elemento;
- le sequenze devono essere complete;
- le mappe di descrizione devono avere almeno una domanda;
- le attività con valutazione adulta possono non avere una risposta unica.

Gli item che non rispettano le regole vengono esclusi e compaiono in **Area adulti → Dati e report → Qualità dei contenuti**.

## Distrattori

I distrattori sono scelti da regole, non a caso:

- livello 1-2: categorie diverse, differenza evidente;
- livello 3+: stessa categoria, somiglianza crescente;
- il target non è mai anche distrattore;
- i concetti che sarebbero anch'essi corretti vengono esclusi dal pool.

Quando la consegna ammette più risposte (per esempio "trova tutte le cose morbide"), l'esercizio deve dichiararle tutte e il player le accetta tutte.

## Immagini e licenze

- I pittogrammi sono di **ARASAAC** (Sergio Palao, Governo di Aragona), licenza **CC BY-NC-SA 4.0**.
- L'attribuzione è nella schermata *Informazioni e licenze* e nella documentazione.
- L'uso è educativo e non commerciale; le immagini derivate restano sotto la stessa licenza e non vengono relicenziate.
- Non inserire immagini protette senza licenza compatibile.
- Le fotografie caricate dall'adulto restano di chi le carica e non vengono condivise.
- Non usare emoji come unica rappresentazione di un concetto: ogni stimolo ha un'immagine e un testo alternativo.

## Rappresentazioni multiple e generalizzazione

`stimuli.json` può contenere più pittogrammi per lo stesso concetto (stile schematico e non schematico). La generalizzazione si ottiene variando la rappresentazione: la parola non deve restare legata a un'unica figura. Per gli stessi concetti si possono aggiungere fotografie con licenza adeguata, purché coerenti con la richiesta.

## Revisione didattica

Prima di usare con un bambino attività generate automaticamente:

1. verifica che la consegna sia comprensibile al livello scelto;
2. controlla che i distrattori non siano anch'essi corretti;
3. controlla la coerenza tra audio, immagine, risposta e distrattori;
4. verifica che le frasi siano grammaticalmente corrette e naturali;
5. escludi temporaneamente le parole non adatte al bambino tramite il vocabolario del profilo.

La revisione manuale dei contenuti è prevista dal progetto: l'app mostra gli item scartati e non nasconde i problemi.

## Storie, mappe, percorsi e ambienti

- **Storie** (`src/data/stories.ts`): pannelli con testo e concetti, domande esplicite/inferenziali/di sequenza/lessicali con una sola risposta corretta, parole da riusare.
- **Mappe** (`src/data/maps.ts`): 30 reti costruite dall'archivio; ogni arco ha un tipo esplicito. Aggiungere un centro significa aggiungere un id all'elenco `CENTERS`.
- **Percorsi** (`src/data/paths.ts`): obiettivi, prerequisiti, passi (modulo + livello + nota), criteri osservativi, generalizzazione.
- **Ambienti** (`src/data/environments.ts`): hotspot con coordinate percentuali e concetti esistenti, più missioni con modulo e livello.

## Test dei contenuti

`npm test` verifica: integrità dell'archivio (relazioni, immagini, categorie, caratteristiche), numero minimo di concetti e categorie, validità di tutti gli esercizi della banca, copertura dei moduli, presenza di tutte le tipologie di risposta, coerenza delle storie e delle mappe, esistenza di percorsi e ambienti, presenza delle nove parole CAA.
