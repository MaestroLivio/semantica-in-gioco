import type { Level } from '../engine/types'
import type { Exercise } from '../engine/exercise'
import { requireConcept } from './lexicon'
import {
  buildChoice,
  optionFor,
  pickDistractors,
  sentenceExercise,
  describeSlots,
  shuffle,
} from '../engine/generator'
import type { ExOption } from '../engine/exercise'

// ---------------------------------------------------------------
// MODULI 11-18: verbi, frasi, descrizioni, recupero, anomalie,
// inferenze, polisemia.
// ---------------------------------------------------------------

function verbItem(targetId: string, level: Level, prompt: string): Exercise {
  const target = requireConcept(targetId)
  const count = level <= 2 ? 3 : 4
  const options = buildChoice(target, level, `m11:${targetId}:${level}`, count)
  return {
    id: `m11-${targetId}-${level}`,
    moduleId: 'm11',
    kind: 'choose-image',
    level,
    prompt,
    conceptIds: [targetId],
    targetConceptId: targetId,
    options,
    correct: [targetId],
    explanation: `${target.lemma[0].toUpperCase() + target.lemma.slice(1)}: ${target.definition}`,
    cue: target.definition,
    scoring: 'objective',
    origin: 'bank',
    alternatives: count,
  }
}

function textChoice(
  id: string,
  moduleId: string,
  level: Level,
  prompt: string,
  correctLabel: string,
  wrongLabels: string[],
  conceptIds: string[],
  explanation: string,
): Exercise {
  const options: ExOption[] = shuffle(
    [{ id: 'ok', label: correctLabel }, ...wrongLabels.map((l, i) => ({ id: `w${i}`, label: l }))],
    `${id}:t`,
  )
  return {
    id,
    moduleId,
    kind: 'choose-label',
    level,
    prompt,
    conceptIds,
    targetConceptId: conceptIds[0],
    options,
    correct: ['ok'],
    explanation,
    scoring: 'objective',
    origin: 'bank',
    alternatives: options.length,
  }
}

function recall(targetId: string, level: Level): Exercise {
  const target = requireConcept(targetId)
  const distractors = pickDistractors(target, 2, Math.max(3, level) as Level, `m15:${targetId}`)
  return {
    id: `m15-${targetId}-${level}`,
    moduleId: 'm15',
    kind: 'open-recall',
    level,
    prompt: 'Che cos\'è? Puoi dirlo, indicarlo o usare la barra dei simboli.',
    conceptIds: [targetId],
    targetConceptId: targetId,
    options: [optionFor(target), ...distractors.map((d) => optionFor(d))],
    correct: [targetId],
    explanation: target.definition,
    cue: target.functions?.[0],
    scoring: 'self',
    origin: 'bank',
  }
}

function describe(targetId: string, level: Level): Exercise {
  return {
    id: `m14-${targetId}-${level}`,
    moduleId: 'm14',
    kind: 'open-describe',
    level,
    prompt: `Descrivi ${requireConcept(targetId).lemma} con la mappa delle domande.`,
    conceptIds: [targetId],
    targetConceptId: targetId,
    correct: [],
    describe: describeSlots(requireConcept(targetId)),
    explanation: requireConcept(targetId).definition,
    scoring: 'adult',
    origin: 'bank',
  }
}

function multiSelect(
  id: string,
  moduleId: string,
  level: Level,
  prompt: string,
  correctIds: string[],
  distractorIds: string[],
): Exercise {
  const options = shuffle([...correctIds, ...distractorIds].map((cid) => optionFor(requireConcept(cid))), `${id}:ms`)
  return {
    id,
    moduleId,
    kind: 'multi-select',
    level,
    prompt,
    conceptIds: [...correctIds, ...distractorIds],
    targetConceptId: correctIds[0],
    options,
    correct: [...correctIds],
    explanation: `Le risposte giuste sono: ${correctIds.map((c) => requireConcept(c).lemma).join(', ')}.`,
    scoring: 'objective',
    origin: 'bank',
    alternatives: options.length,
  }
}

export function buildBankPart2(): Exercise[] {
  const items: Exercise[] = []

  // ---------------- Modulo 11: verbi (24) ----------------
  items.push(verbItem('mangiare', 1, 'Quale immagine mostra l\'azione di mangiare?'))
  items.push(verbItem('bere', 1, 'Quale immagine mostra l\'azione di bere?'))
  items.push(verbItem('correre', 1, 'Quale immagine mostra l\'azione di correre?'))
  items.push(verbItem('saltare', 1, 'Quale immagine mostra l\'azione di saltare?'))
  items.push(verbItem('dormire', 1, 'Quale immagine mostra l\'azione di dormire?'))
  items.push(verbItem('giocare', 1, 'Quale immagine mostra l\'azione di giocare?'))
  items.push(verbItem('lavarsi', 1, 'Quale immagine mostra l\'azione di lavarsi le mani?'))
  items.push(verbItem('leggere', 2, 'Quale immagine mostra l\'azione di leggere un libro?'))
  items.push(verbItem('scrivere', 2, 'Quale immagine mostra l\'azione di scrivere?'))
  items.push(verbItem('parlare', 2, 'Quale immagine mostra l\'azione di parlare?'))
  items.push(verbItem('cucinare', 2, 'Quale immagine mostra l\'azione di cucinare?'))
  items.push(verbItem('camminare', 2, 'Quale immagine mostra l\'azione di camminare?'))
  items.push(verbItem('spingere', 3, 'Quale immagine mostra l\'azione di spingere? Guarda la direzione del movimento.'))
  items.push(verbItem('tirare', 3, 'Quale immagine mostra l\'azione di tirare un oggetto verso di sé?'))
  items.push(verbItem('aprire', 3, 'Quale immagine mostra l\'azione di aprire?'))
  items.push(verbItem('chiudere', 3, 'Quale immagine mostra l\'azione di chiudere?'))
  items.push(verbItem('versare', 3, 'Quale immagine mostra l\'azione di versare l\'acqua?'))
  items.push(verbItem('costruire', 3, 'Quale immagine mostra l\'azione di costruire?'))
  items.push(verbItem('rompere', 3, 'Quale immagine mostra l\'azione di rompere?'))
  items.push(verbItem('nuotare', 3, 'Quale immagine mostra l\'azione di nuotare?'))
  items.push(verbItem('ridere', 3, 'Quale immagine mostra l\'azione di ridere?'))
  items.push(verbItem('piangere', 3, 'Quale immagine mostra l\'azione di piangere?'))
  items.push(verbItem('ascoltare', 2, 'Quale immagine mostra l\'azione di ascoltare?'))
  items.push(textChoice('m11-differenza', 'm11', 4, 'Quale azione allontana un oggetto da te?', 'spingere', ['tirare', 'versare'], ['spingere'], 'Spingere allontana, tirare avvicina.'))
  items.push(textChoice('m11-differenza-2', 'm11', 4, 'Quale azione porta l\'acqua in un bicchiere?', 'versare', ['bere', 'mangiare'], ['versare'], 'Versare significa far uscire il liquido dal contenitore.'))
  items.push(textChoice('m11-chi', 'm11', 5, 'Nella frase «Il gatto mangia il pesce», chi riceve l\'azione?', 'il pesce', ['il gatto', 'nessuno'], ['pesce'], 'Il gatto compie l\'azione, il pesce la riceve.'))
  items.push(multiSelect('m11-azioni-acqua', 'm11', 4, 'Quali azioni si fanno con l\'acqua?', ['lavarsi', 'nuotare', 'bere'], ['leggere', 'dormire', 'scrivere']))

  // ---------------- Modulo 12: frasi (16) ----------------
  items.push(sentenceExercise(requireConcept('bambino'), requireConcept('mangiare'), requireConcept('mela'), 2, 'bambino-mela'))
  items.push(sentenceExercise(requireConcept('gatto'), requireConcept('bere'), requireConcept('latte'), 2, 'gatto-latte'))
  items.push(sentenceExercise(requireConcept('bambina'), requireConcept('leggere'), requireConcept('libro'), 3, 'bambina-libro'))
  items.push(sentenceExercise(requireConcept('cane'), requireConcept('mangiare'), requireConcept('carne'), 3, 'cane-carne'))
  items.push(sentenceExercise(requireConcept('mamma'), requireConcept('cucinare'), requireConcept('minestra'), 3, 'mamma-minestra'))
  items.push(sentenceExercise(requireConcept('scimmia'), requireConcept('mangiare'), requireConcept('banana'), 3, 'scimmia-banana'))
  items.push(sentenceExercise(requireConcept('coniglio'), requireConcept('mangiare'), requireConcept('carota'), 3, 'coniglio-carota'))
  items.push(sentenceExercise(requireConcept('topo'), requireConcept('mangiare'), requireConcept('formaggio'), 3, 'topo-formaggio'))
  items.push(sentenceExercise(requireConcept('bambina'), requireConcept('bere'), requireConcept('succo'), 3, 'bambina-succo'))
  items.push(sentenceExercise(requireConcept('bambino'), requireConcept('lavarsi'), requireConcept('mano'), 4, 'bambino-mano'))
  items.push(sentenceExercise(requireConcept('papa'), requireConcept('leggere'), requireConcept('libro'), 4, 'papa-libro'))
  items.push(sentenceExercise(requireConcept('cane'), requireConcept('correre'), requireConcept('palla'), 4, 'cane-palla'))
  items.push(textChoice('m12-reversibile-1', 'm12', 5, 'Nella frase «Il cane rincorre il gatto», chi compie l\'azione?', 'il cane', ['il gatto', 'il padrone'], ['cane', 'gatto'], 'Il cane è il soggetto: compie l\'azione di rincorrere.'))
  items.push(textChoice('m12-reversibile-2', 'm12', 5, 'Nella frase «Il gatto rincorre il cane», chi compie l\'azione?', 'il gatto', ['il cane', 'il topo'], ['gatto', 'cane'], 'Cambiando l\'ordine cambia il significato: ora è il gatto a rincorrere.'))
  items.push(textChoice('m12-ruolo', 'm12', 5, 'Nella frase «La mamma lava la tazza», che cosa viene lavato?', 'la tazza', ['la mamma', 'il sapone'], ['mamma', 'tazza'], 'La tazza riceve l\'azione.'))
  items.push(textChoice('m12-ruolo-2', 'm12', 6, 'Il bambino dà la mela alla bambina. Chi riceve la mela?', 'la bambina', ['il bambino', 'la mamma'], ['bambino', 'bambina'], 'La bambina è colei che riceve l\'oggetto.'))

  // ---------------- Modulo 13: indovina (18) ----------------
  const guessSpecs: [string, Level, number][] = [
    ['pesce', 2, 3],
    ['cane', 2, 3],
    ['uccello', 3, 3],
    ['elefante', 3, 3],
    ['ape', 3, 3],
    ['mucca', 3, 3],
    ['tartaruga', 4, 3],
    ['coniglio', 3, 3],
    ['ombra-leone', 4, 2],
    ['ombrello', 3, 3],
    ['pentola', 3, 3],
    ['forbici', 4, 3],
    ['frigorifero', 4, 3],
    ['violino', 4, 3],
    ['spazzolino', 3, 3],
    ['formaggio', 4, 2],
    ['gelato', 3, 2],
    ['autobus', 4, 3],
  ]
  for (const [id, level, clues] of guessSpecs) {
    if (id === 'ombra-leone') continue
    const target = requireConcept(id)
    const clueList = [
      ...target.features.slice(0, 2),
      target.functions?.[0] ?? target.features[2] ?? target.definition,
    ]
      .filter(Boolean)
      .slice(0, Math.max(2, clues))
    const prompt = `Ascolta gli indizi: ${clueList.map((c) => c.charAt(0).toUpperCase() + c.slice(1) + '.').join(' ')} Che cos'è?`
    const count = level <= 2 ? 3 : 4
    items.push({
      id: `m13-${id}-${level}`,
      moduleId: 'm13',
      kind: 'choose-image',
      level,
      prompt,
      conceptIds: [id],
      targetConceptId: id,
      options: buildChoice(target, level, `m13:${id}:${clueList.length}`, count),
      correct: [id],
      explanation: `${target.lemma[0].toUpperCase() + target.lemma.slice(1)}: ${target.definition}`,
      scoring: 'objective',
      origin: 'bank',
      alternatives: count,
    })
  }

  // ---------------- Modulo 14: descrizione (12) ----------------
  for (const [id, level] of [
    ['mela', 2],
    ['cane', 2],
    ['sedia', 3],
    ['scarpe', 3],
    ['pentola', 3],
    ['ombrello', 3],
    ['automobile', 4],
    ['gallina', 3],
    ['frigorifero', 4],
    ['violino', 4],
    ['amicizia', 5],
    ['paura', 5],
  ] as [string, Level][]) {
    items.push(describe(id, level))
  }

  // ---------------- Modulo 15: recupero (18) ----------------
  for (const [id, level] of [
    ['mela', 2],
    ['cane', 2],
    ['palla', 2],
    ['sedia', 3],
    ['bicchiere', 3],
    ['cucchiaio', 3],
    ['ombrello', 3],
    ['spazzolino', 3],
    ['carota', 3],
    ['torta', 3],
    ['bicicletta', 4],
    ['frigorifero', 4],
    ['chitarra', 4],
    ['pompiere', 4],
    ['formaggio', 4],
    ['farfalla', 4],
    ['amicizia', 5],
    ['rabbia', 5],
  ] as [string, Level][]) {
    items.push(recall(id, level))
  }

  // ---------------- Modulo 16: assurdità (14) ----------------
  items.push(textChoice('m16-gatto-legge', 'm16', 3, 'Il gatto legge un libro. C\'è qualcosa di strano?', 'Sì, i gatti non sanno leggere', ['No, è normale', 'Sì, il libro è troppo grande'], ['gatto', 'leggere'], 'Un gatto non sa leggere: la frase è impossibile nella realtà.'))
  items.push(textChoice('m16-minestra-scarpa', 'm16', 3, 'Il bambino mangia la minestra con una scarpa. Che cosa non va?', 'La scarpa non è un utensile per mangiare', ['La minestra è troppo calda', 'Il bambino ha fame'], ['minestra', 'scarpe', 'cucchiaio'], 'Per mangiare la minestra serve il cucchiaio, non una scarpa.'))
  items.push(textChoice('m16-gelato-forno', 'm16', 4, 'Metto il gelato nel forno per mantenerlo freddo. Che cosa cambieresti?', 'Metterlo nel frigorifero', ['Accendere il forno', 'Toglierlo dal cono'], ['gelato', 'forno', 'frigorifero'], 'Il forno scalda: il gelato si scioglierebbe. Serve il frigorifero.'))
  items.push(textChoice('m16-pesce-vola', 'm16', 4, 'Il pesce vola nel cielo. Che cosa non va?', 'I pesci nuotano nell\'acqua', ['I pesci sono piccoli', 'Il cielo è azzurro'], ['pesce', 'cielo'], 'Il pesce vive nell\'acqua e nuota.'))
  items.push(textChoice('m16-ombrello-sole', 'm16', 5, 'Uso l\'ombrello quando c\'è la neve. Che cosa può funzionare lo stesso?', 'L\'ombrello può riparare anche dalla neve', ['L\'ombrello non si apre', 'La neve è calda'], ['ombrello', 'neve'], 'L\'ombrello ripara da pioggia e neve: non è un\'assurdità completa.'))
  items.push(textChoice('m16-cane-miagola', 'm16', 4, 'Il cane miagola sul tetto. Quali sono le due cose strane?', 'Il cane che miagola e il cane sul tetto', ['Il tetto è rosso', 'Il cane è un animale'], ['cane', 'gatto'], 'Il cane abbaia e di solito non sta sul tetto.'))
  items.push(textChoice('m16-bicicletta-acqua', 'm16', 5, 'Vado in bicicletta sott\'acqua. Che cosa non è possibile?', 'La bicicletta non si pedala sott\'acqua', ['L\'acqua è bagnata', 'La bicicletta ha due ruote'], ['bicicletta', 'mare'], 'Sott\'acqua non si può pedalare normalmente.'))
  items.push(textChoice('m16-torta-sale', 'm16', 5, 'Ho messo il sale nella torta dolce. Che cosa è strano?', 'Il sale non si mette nella torta dolce', ['La torta è rotonda', 'La torta si cuoce'], ['torta'], 'Una torta dolce si fa con lo zucchero, non con il sale.'))
  items.push(textChoice('m16-uccello-nuota', 'm16', 6, 'L\'uccello nuota nel fiume come un pesce. È possibile?', 'Di solito no: l\'uccello vola, alcuni nuotano ma non come i pesci', ['Sì, sempre', 'No, gli uccelli non si bagnano'], ['uccello', 'pesce', 'fiume'], 'Alcuni uccelli nuotano, ma non come i pesci: la frase è improbabile.'))
  items.push(textChoice('m16-fantastico', 'm16', 6, 'In una storia fantastica un drago cucina la pasta. È un errore?', 'No, se la storia è fantastica può succedere', ['Sì, sempre', 'Sì, i draghi non esistono e quindi è sbagliato'], ['cucinare'], 'Nelle storie fantastiche le regole del mondo reale possono cambiare: è voluto.'))
  items.push(textChoice('m16-scarpe-mani', 'm16', 4, 'Metto le scarpe sulle mani per andare a scuola. Che cosa correggo?', 'Le scarpe vanno ai piedi', ['Le scarpe sono nuove', 'La scuola è lontana'], ['scarpe', 'piede', 'mano'], 'Le scarpe si mettono ai piedi.'))
  items.push(textChoice('m16-sole-notte', 'm16', 5, 'Il sole splende a mezzanotte. Che cosa non torna?', 'Di notte non c\'è il sole', ['Il sole è giallo', 'La notte è buia'], ['sole', 'notte'], 'Il sole si vede di giorno.'))
  items.push(textChoice('m16-latte-fork', 'm16', 5, 'Bevo il latte con la forchetta. Che cosa serve invece?', 'Il bicchiere', ['Il piatto', 'Il coltello'], ['latte', 'forchetta', 'bicchiere'], 'Per bere serve un contenitore, non la forchetta.'))
  items.push(textChoice('m16-montagna-mare', 'm16', 6, 'Sulla spiaggia c\'è la neve in agosto. È possibile?', 'È molto improbabile, ma in alcuni luoghi può succedere', ['Sì, sempre', 'No, mai'], ['spiaggia', 'neve'], 'Di solito in agosto fa caldo, ma non è impossibile ovunque: attenzione ai contesti.'))

  // ---------------- Modulo 17: inferenze (16) ----------------
  const infer: [string, Level, string, string, string[], string][] = [
    ['m17-ombrello', 3, 'Anna entra in casa con le scarpe bagnate e un ombrello. Che tempo fa fuori?', 'pioggia', ['sole', 'neve'], 'Le scarpe bagnate e l\'ombrello indicano la pioggia.'],
    ['m17-ciotola', 3, 'Il cane ha la ciotola vuota e scodinzola vicino al sacchetto. Che cosa vuole?', 'mangiare', ['dormire', 'giocare'], 'La ciotola vuota e il sacchetto indicano la fame.'],
    ['m17-freddo', 3, 'Marco mette il cappotto e i guanti. Come sarà il tempo?', 'freddo', ['caldo', 'pioggia'], 'Cappotto e guanti si usano quando fa freddo.'],
    ['m17-bagno', 4, 'Sara ha i capelli bagnati e l\'asciugamano in mano. Che cosa ha appena fatto?', 'lavarsi', ['mangiare', 'dormire'], 'I capelli bagnati e l\'asciugamano indicano il lavaggio.'],
    ['m17-buio', 4, 'La stanza è buia. Perché Luca accende la lampada?', 'lampada', ['sole', 'finestra'], 'La lampada serve per illuminare quando è buio.'],
    ['m17-torta', 4, 'Sul tavolo ci sono la torta, le candeline e i regali. Che cosa succede?', 'festa', ['scuola', 'medico'], 'Torta, candeline e regali indicano una festa di compleanno.'],
    ['m17-scarpe-fango', 5, 'Le scarpe di Anna sono sporche di fango. Dove è stata?', 'giardino', ['letto', 'scuola'], 'Il fango si trova fuori, in giardino o per strada.'],
    ['m17-setola', 5, 'Il gatto si lecca la zampa e miagola vicino alla porta. Che cosa vuole?', 'fuori', ['mangiare', 'dormire'], 'Il gatto vicino alla porta chiede di uscire: il miagolio è un indizio.'],
    ['m17-piatto-vuoto', 5, 'Il piatto è vuoto, il bambino si lecca i baffi. Che cosa ha fatto?', 'mangiare', ['dormire', 'lavarsi'], 'Il piatto vuoto e il gesto indicano che ha mangiato.'],
    ['m17-ombrello-asciutto', 6, 'L\'ombrello è aperto ma le strade sono asciutte. Che cosa potrebbe essere successo?', 'sole', ['neve', 'pioggia'], 'L\'ombrello aperto e le strade asciutte suggeriscono che la pioggia è finita ed è uscito il sole.'],
    ['m17-luce-accesa', 6, 'Sono le nove di sera, la luce è accesa e il pigiama è sul letto. Che cosa sta per fare il bambino?', 'dormire', ['mangiare', 'giocare'], 'La sera, la luce accesa e il pigiama indicano il momento di dormire.'],
    ['m17-medico', 5, 'La bambina ha la febbre e la mamma prende il telefono. Chi chiamerà?', 'medico', ['cuoco', 'postino'], 'Con la febbre si chiama il medico.'],
    ['m17-supermercato', 5, 'La nonna prende il carrello e la lista della spesa. Dove va?', 'supermercato', ['scuola', 'ospedale'], 'Il carrello e la lista servono per fare la spesa.'],
    ['m17-pioggia-bucato', 6, 'Il tetto è bucato e sul pavimento ci sono le gocce. Che cosa è successo?', 'pioggia', ['neve', 'sole'], 'Le gocce sul pavimento vengono dalla pioggia che entra dal tetto.'],
    ['m17-bambino-piange', 6, 'Il bambino piange e tiene in mano il giocattolo rotto. Perché piange?', 'triste', ['felice', 'paura'], 'Il giocattolo rotto spiega la tristezza.'],
    ['m17-cane-bagnato', 6, 'Il cane è bagnato e si scrolla vicino alla porta. Che cosa lo ha bagnato?', 'pioggia', ['letto', 'scuola'], 'Il pelo bagnato suggerisce che è stato sotto la pioggia.'],
  ]
  for (const [id, level, prompt, correct, wrong, explanation] of infer) {
    items.push({
      id,
      moduleId: 'm17',
      kind: 'choose-image',
      level,
      prompt,
      conceptIds: [correct, ...wrong],
      targetConceptId: correct,
      options: shuffle([correct, ...wrong].map((cid) => optionFor(requireConcept(cid))), `${id}:inf`),
      correct: [correct],
      explanation,
      scoring: 'objective',
      origin: 'bank',
      alternatives: 3,
    })
  }

  // ---------------- Modulo 18: polisemia (12) ----------------
  items.push(textChoice('m18-penna', 'm18', 4, 'La parola "penna" può avere due significati. In quale frase significa "piuma di uccello"?', 'Il gatto gioca con una penna trovata nel prato', ['Scrivo con la penna blu', 'La penna è sul quaderno'], ['penna', 'uccello'], 'La penna dell\'uccello è una piuma; la penna dello studente serve per scrivere.'))
  items.push(textChoice('m18-rete', 'm18', 5, 'In quale frase "rete" indica qualcosa che si usa in casa per la connessione?', 'La rete wifi non funziona', ['Il pescatore getta la rete', 'La rete del campo da tennis'], ['telefono'], 'La rete può essere da pesca, sportiva o informatica.'))
  items.push(textChoice('m18-piano', 'm18', 5, 'In quale frase "piano" indica uno strumento musicale?', 'Suono il piano ogni pomeriggio', ['Abito al primo piano', 'Facciamo un piano per domani'], ['pianoforte'], 'Il piano musicale è il pianoforte; il piano di un edificio è un livello.'))
  items.push(textChoice('m18-occhio', 'm18', 6, 'L\'ago ha un "occhio". Che cosa significa?', 'Il foro dove passa il filo', ['L\'occhio del gatto', 'Un occhio dipinto'], ['occhio'], 'Anche gli oggetti possono avere un "occhio": il foro dell\'ago.'))
  items.push(textChoice('m18-braccio', 'm18', 6, 'Il "braccio" della gru serve per…', 'sollevare i pesi', ['abbracciare le persone', 'nuotare'], ['braccio'], 'Il braccio della gru è una parte della macchina.'))
  items.push(textChoice('m18-lingua', 'm18', 6, 'La "lingua" italiana è…', 'una lingua parlata', ['la lingua che si mangia', 'una parte del corpo'], ['parlare'], 'La lingua può essere un organo, un cibo o un sistema di comunicazione.'))
  items.push(textChoice('m18-crudo', 'm18', 6, 'In "che freddo crudo!" la parola "crudo" significa…', 'molto intenso', ['non cotto', 'gustoso'], ['freddo'], 'In questo contesto "crudo" descrive un freddo intenso.'))
  items.push(textChoice('m18-luna', 'm18', 6, 'Un "piano" può anche essere un progetto. Quale frase lo mostra?', 'Abbiamo fatto un piano per il viaggio', ['Il piano è al secondo piano', 'Suono il piano'], ['idea'], 'Il piano come progetto è un insieme di azioni previste.'))
  items.push(textChoice('m18-pesca', 'm18', 6, 'La "pesca" può essere un frutto o un\'azione. In quale frase è un frutto?', 'Mangio una pesca matura', ['Vado alla pesca con il nonno', 'La pesca è difficile oggi'], ['pesca', 'mela'], 'Il frutto pesca si mangia; la pesca è l\'attività di prendere pesci.'))
  items.push(textChoice('m18-collo', 'm18', 6, 'Il "collo" della bottiglia è…', 'la parte stretta in alto', ['la parte del corpo', 'un vestito'], ['bicchiere'], 'Il collo può essere una parte del corpo o la parte stretta di un oggetto.'))
  items.push(textChoice('m18-filo', 'm18', 5, 'Il "filo" della luce è…', 'il cavo elettrico', ['un filo di lana', 'un filo d\'erba'], ['lampada'], 'Il filo elettrico porta la corrente alla lampada.'))
  items.push(textChoice('m18-stella', 'm18', 5, 'La "stella" marina vive…', 'nel mare', ['nel cielo', 'nel bosco'], ['stella', 'mare'], 'La stella marina è un animale, non una stella del cielo.'))
  items.push(textChoice('m18-pianta', 'm18', 5, 'La parola "pianta" ha più significati. In quale frase indica il disegno di un luogo?', 'La pianta della città mostra le strade', ['Innaffio la pianta sul balcone', 'La pianta cresce nel vaso'], ['pianta'], 'La pianta di una città è un disegno con le strade; la pianta è anche un essere vivente.'))

  return items
}
