import type { Level, Story } from '../engine/types'
import { conceptsForOption } from './story-images'

// 20 microstorie illustrate. Ogni storia ha pannelli con parole chiave,
// domande esplicite e inferenziali e parole da riutilizzare.
function s(
  id: string,
  title: string,
  level: Level,
  ageBand: string,
  panels: [string, string[]][],
  questions: {
    text: string
    kind: 'explicit' | 'inferential' | 'sequence' | 'vocabulary'
    options: [string, boolean][]
    explanation?: string
  }[],
  reuse: string[],
): Story {
  return {
    id,
    title,
    level,
    ageBand,
    panels: panels.map(([text, conceptIds]) => ({ text, conceptIds })),
    keyWords: [...new Set(panels.flatMap(([, ids]) => ids))],
    questions: questions.map((q) => ({
      text: q.text,
      kind: q.kind,
      options: q.options.map(([label, correct]) => ({ label, correct, conceptIds: conceptsForOption(label) })),
      explanation: q.explanation,
    })),
    reuse,
  }
}

export const STORIES: Story[] = [
  s(
    'st-ombrello',
    'L\'ombrello di Nina',
    2,
    '3-5 anni',
    [
      ['Nina guarda fuori dalla finestra. Il cielo è grigio e cade la pioggia.', ['finestra', 'nuvola', 'pioggia']],
      ['Nina prende l\'ombrello rosso e lo apre. Le scarpe restano asciutte.', ['ombrello', 'scarpe', 'rosso']],
      ['In giardino Nina trova una lumaca sotto la foglia. La pioggia è finita.', ['giardino', 'foglia', 'pioggia']],
    ],
    [
      { text: 'Che cosa cade dal cielo?', kind: 'explicit', options: [['La pioggia', true], ['La neve', false], ['Il sole', false]] },
      { text: 'Perché Nina prende l\'ombrello?', kind: 'inferential', options: [['Per non bagnarsi', true], ['Per giocare', false], ['Per fare caldo', false]] },
      { text: 'Dove trova la lumaca?', kind: 'explicit', options: [['Sotto una foglia', true], ['Sul tavolo', false], ['Nella scarpa', false]] },
    ],
    ['ombrello', 'pioggia', 'scarpe'],
  ),
  s(
    'st-colazione',
    'La colazione di Leo',
    2,
    '3-5 anni',
    [
      ['È mattina. Leo si lava le mani e si siede al tavolo.', ['mattina', 'lavarsi', 'mano', 'tavolo']],
      ['Sul tavolo ci sono il latte e i biscotti. Leo li inzuppa nel latte.', ['latte', 'biscotto', 'tazza']],
      ['Leo prende lo zaino: è ora di andare a scuola.', ['zaino', 'scuola', 'orologio']],
    ],
    [
      { text: 'Che cosa beve Leo?', kind: 'explicit', options: [['Il latte', true], ['L\'acqua', false], ['Il succo', false]] },
      { text: 'Che cosa mette Leo nello zaino per la scuola?', kind: 'inferential', options: [['I quaderni e i libri', true], ['La palla', false], ['Il gelato', false]], explanation: 'A scuola servono i quaderni e i libri.' },
      { text: 'In che ordine fa le cose?', kind: 'sequence', options: [['Si lava, fa colazione, va a scuola', true], ['Va a scuola, si lava, mangia', false]] },
    ],
    ['mattina', 'latte', 'zaino'],
  ),
  s(
    'st-gatto',
    'Il gatto sul divano',
    2,
    '3-5 anni',
    [
      ['Il gatto dorme sul divano. Fuori piove.', ['gatto', 'divano', 'dormire', 'pioggia']],
      ['Si sente un rumore: è il cane che abbaia. Il gatto apre un occhio.', ['cane', 'orecchio']],
      ['Il gatto si alza, beve il latte e torna a dormire.', ['latte', 'bere', 'dormire']],
    ],
    [
      { text: 'Dove dorme il gatto?', kind: 'explicit', options: [['Sul divano', true], ['Sul tavolo', false], ['Nel giardino', false]] },
      { text: 'Che cosa sente il gatto?', kind: 'explicit', options: [['Il cane che abbaia', true], ['Il telefono', false], ['La televisione', false]] },
      { text: 'Che cosa fa il gatto dopo essersi svegliato?', kind: 'inferential', options: [['Beve il latte', true], ['Mangia una mela', false], ['Va a scuola', false]] },
    ],
    ['gatto', 'dormire', 'latte'],
  ),
  s(
    'st-mela',
    'La mela di Marta',
    2,
    '3-5 anni',
    [
      ['Marta ha una mela rossa nello zaino.', ['mela', 'rosso', 'zaino']],
      ['La mela cade e rotola sotto il tavolo.', ['mela', 'tavolo', 'sotto']],
      ['Marta la lava e la mangia con il papà.', ['mela', 'lavarsi', 'papa', 'mangiare']],
    ],
    [
      { text: 'Di che colore è la mela?', kind: 'explicit', options: [['Rossa', true], ['Blu', false], ['Gialla', false]] },
      { text: 'Dove rotola la mela?', kind: 'explicit', options: [['Sotto il tavolo', true], ['Sopra il letto', false], ['Dentro il bicchiere', false]] },
      { text: 'Che cosa fa Marta prima di mangiarla?', kind: 'inferential', options: [['La lava', true], ['La cuoce', false], ['La taglia con la scarpa', false]] },
    ],
    ['mela', 'sotto', 'lavarsi'],
  ),
  s(
    'st-supermercato',
    'La spesa della nonna',
    3,
    '5-7 anni',
    [
      ['La nonna prende il carrello al supermercato e legge la lista.', ['carrello', 'supermercato', 'leggere']],
      ['Mette nel carrello le mele, il pane e il latte.', ['mela', 'pane', 'latte', 'carrello']],
      ['Alla cassa il carrello è pesante. Il nonno aiuta a portarlo a casa.', ['pesante', 'aiuto', 'casa', 'nonno']],
    ],
    [
      { text: 'Dove va la nonna?', kind: 'explicit', options: [['Al supermercato', true], ['A scuola', false], ['In ospedale', false]] },
      { text: 'Che cosa mette nel carrello?', kind: 'explicit', options: [['Mele, pane e latte', true], ['Scarpe e cappotto', false], ['Palla e bambola', false]] },
      { text: 'Perché il nonno aiuta?', kind: 'inferential', options: [['Perché il carrello è pesante', true], ['Perché piove', false], ['Perché è tardi', false]] },
    ],
    ['supermercato', 'carrello', 'pesante', 'aiuto'],
  ),
  s(
    'st-fattoria',
    'La mattina alla fattoria',
    3,
    '5-7 anni',
    [
      ['Alla fattoria il contadino si alza presto. Le galline fanno le uova.', ['fattoria', 'contadino', 'gallina', 'uovo']],
      ['La mucca mangia l\'erba e dà il latte. Il cane corre nel campo.', ['mucca', 'erba', 'latte', 'cane', 'correre']],
      ['Il contadino usa il trattore per arare la terra.', ['trattore', 'contadino']],
    ],
    [
      { text: 'Quale animale fa le uova?', kind: 'explicit', options: [['La gallina', true], ['La mucca', false], ['Il cane', false]] },
      { text: 'Che cosa dà la mucca?', kind: 'explicit', options: [['Il latte', true], ['Le uova', false], ['Il miele', false]] },
      { text: 'A che cosa serve il trattore?', kind: 'vocabulary', options: [['A lavorare la terra', true], ['A portare i bambini a scuola', false], ['A cucinare', false]] },
    ],
    ['fattoria', 'mucca', 'trattore'],
  ),
  s(
    'st-scuola',
    'Il primo giorno',
    3,
    '5-7 anni',
    [
      ['È il primo giorno di scuola. Sofia ha lo zaino nuovo.', ['scuola', 'zaino']],
      ['In classe l\'insegnante scrive alla lavagna. Sofia prende la matita.', ['insegnante', 'lavagna', 'matita']],
      ['A ricreazione Sofia gioca a palla con un bambino nuovo. Ora sono amici.', ['palla', 'giocare', 'amico', 'parco']],
    ],
    [
      { text: 'Che cosa prende Sofia in classe?', kind: 'explicit', options: [['La matita', true], ['La pentola', false], ['Il gelato', false]] },
      { text: 'Che cosa fa l\'insegnante?', kind: 'explicit', options: [['Scrive alla lavagna', true], ['Cucina', false], ['Guida l\'autobus', false]] },
      { text: 'Perché alla fine sono amici?', kind: 'inferential', options: [['Hanno giocato insieme', true], ['Hanno litigato', false], ['Sono andati a casa', false]] },
    ],
    ['scuola', 'insegnante', 'amico'],
  ),
  s(
    'st-medico',
    'La visita di Tommaso',
    3,
    '5-7 anni',
    [
      ['Tommaso ha la febbre e la gola rossa. La mamma chiama il medico.', ['medico', 'mamma', 'telefono']],
      ['Il medico ascolta il cuore con lo stetoscopio e guarda la gola.', ['medico', 'stetoscopio', 'bocca']],
      ['Tommaso deve riposare e bere molta acqua. Domani starà meglio.', ['acqua', 'letto', 'dormire']],
    ],
    [
      { text: 'La mamma prende il telefono: chi chiama?', kind: 'explicit', options: [['Il medico', true], ['Il postino', false], ['Il cuoco', false]] },
      { text: 'Che cosa usa il medico per ascoltare il cuore?', kind: 'vocabulary', options: [['Lo stetoscopio', true], ['La scopa', false], ['Il cucchiaio', false]] },
      { text: 'Che cosa deve fare Tommaso?', kind: 'inferential', options: [['Riposare e bere acqua', true], ['Correre al parco', false], ['Mangiare il gelato', false]] },
    ],
    ['medico', 'stetoscopio', 'acqua'],
  ),
  s(
    'st-bosco',
    'Il sentiero nel bosco',
    4,
    '6-8 anni',
    [
      ['Luca e il nonno camminano nel bosco. Gli alberi sono alti e le foglie sono verdi.', ['bosco', 'albero', 'foglia', 'camminare']],
      ['Vedono un\'orma nel fango e sentono un rumore tra i rami.', ['ramo', 'rumoroso']],
      ['Dietro un cespuglio c\'è una volpe che li guarda. Poi scappa via veloce.', ['volpe', 'dietro', 'veloce']],
    ],
    [
      { text: 'Dove camminano Luca e il nonno?', kind: 'explicit', options: [['Nel bosco', true], ['Al supermercato', false], ['In cucina', false]] },
      { text: 'Che animale vedono?', kind: 'explicit', options: [['Una volpe', true], ['Un elefante', false], ['Una mucca', false]] },
      { text: 'Perché la volpe scappa?', kind: 'inferential', options: [['Perché ha visto le persone', true], ['Perché ha fame', false], ['Perché vuole giocare', false]], explanation: 'L\'indizio è che la volpe li guarda e poi corre via.' },
    ],
    ['bosco', 'volpe', 'dietro', 'veloce'],
  ),
  s(
    'st-citta',
    'L\'autobus numero 5',
    4,
    '6-8 anni',
    [
      ['Anna aspetta l\'autobus alla fermata. Piove e tiene l\'ombrello aperto.', ['autobus', 'ombrello', 'pioggia']],
      ['Sull\'autobus c\'è il postino con un pacco. Il poliziotto regola il traffico.', ['postino', 'poliziotto', 'strada']],
      ['Anna scende davanti al panificio: compra il pane caldo.', ['panettiere', 'pane', 'caldo']],
    ],
    [
      { text: 'Come viaggia Anna?', kind: 'explicit', options: [['In autobus', true], ['In bicicletta', false], ['In aereo', false]] },
      { text: 'Chi regola il traffico?', kind: 'explicit', options: [['Il poliziotto', true], ['Il panettiere', false], ['Il postino', false]] },
      { text: 'Che cosa compra Anna?', kind: 'explicit', options: [['Il pane', true], ['Le scarpe', false], ['Il latte', false]] },
    ],
    ['autobus', 'postino', 'pane'],
  ),
  s(
    'st-giardino',
    'Il giardino di casa',
    3,
    '4-6 anni',
    [
      ['Nel giardino c\'è un albero con i fiori. La nonna innaffia le piante.', ['giardino', 'albero', 'fiore', 'pianta']],
      ['Un\'ape vola di fiore in fiore. Il cane la guarda curioso.', ['ape', 'fiore', 'cane']],
      ['Il gatto dorme all\'ombra, vicino alla porta.', ['gatto', 'dormire', 'accanto', 'porta']],
    ],
    [
      { text: 'Chi innaffia le piante?', kind: 'explicit', options: [['La nonna', true], ['Il cane', false], ['Il gatto', false]] },
      { text: 'Dove vola l\'ape?', kind: 'explicit', options: [['Di fiore in fiore', true], ['Sull\'autobus', false], ['In cucina', false]] },
      { text: 'Dove dorme il gatto?', kind: 'explicit', options: [['All\'ombra vicino alla porta', true], ['Sul tetto', false], ['Nel frigorifero', false]] },
    ],
    ['giardino', 'ape', 'accanto'],
  ),
  s(
    'st-torta',
    'La torta di compleanno',
    4,
    '6-8 anni',
    [
      ['Oggi è il compleanno di Giulia. La mamma prepara la torta con la farina e le uova.', ['torta', 'farina', 'uovo', 'festa']],
      ['La torta cuoce nel forno. Giulia prepara i piatti e le forchette sul tavolo.', ['forno', 'piatto', 'forchetta', 'tavolo']],
      ['Gli amici arrivano con i regali. Giulia spegne le candeline e sorride felice.', ['regalo', 'felice', 'amico']],
    ],
    [
      { text: 'Che cosa usa la mamma per la torta?', kind: 'explicit', options: [['Farina e uova', true], ['Pane e formaggio', false], ['Carote e patate', false]] },
      { text: 'Dove cuoce la torta?', kind: 'explicit', options: [['Nel forno', true], ['Nel frigorifero', false], ['Nel lavandino', false]] },
      { text: 'Perché Giulia è felice?', kind: 'inferential', options: [['È il suo compleanno e ci sono gli amici', true], ['Deve andare dal medico', false], ['Ha perso un gioco', false]] },
    ],
    ['torta', 'festa', 'regalo', 'felice'],
  ),
  s(
    'st-pioggia-scuola',
    'Il giorno bagnato',
    4,
    '6-8 anni',
    [
      ['Piove forte. Il papà accompagna Leo a scuola con l\'ombrello.', ['pioggia', 'ombrello', 'papa', 'scuola']],
      ['Le scarpe di Leo sono bagnate. In classe si toglie i calzini umidi.', ['scarpe', 'calzini', 'scuola']],
      ['La maestra accende la lampada perché è buio. Leo disegna una nuvola.', ['lampada', 'nuvola', 'matita']],
    ],
    [
      { text: 'Con che cosa si ripara Leo dalla pioggia?', kind: 'explicit', options: [['Con l\'ombrello', true], ['Con la palla', false], ['Con il libro', false]] },
      { text: 'Perché la maestra accende la lampada?', kind: 'inferential', options: [['Perché è buio', true], ['Perché fa caldo', false], ['Perché piove dentro', false]] },
      { text: 'Che cosa disegna Leo?', kind: 'explicit', options: [['Una nuvola', true], ['Un cane', false], ['Una torta', false]] },
    ],
    ['pioggia', 'lampada', 'nuvola'],
  ),
  s(
    'st-orto',
    'L\'orto del nonno',
    4,
    '6-8 anni',
    [
      ['Il nonno ha un orto dietro casa. Pianta i semi in primavera.', ['nonno', 'seme', 'pianta']],
      ['In estate crescono le carote e le zucchine. Il nonno le raccoglie con le mani.', ['carota', 'zucchina', 'mano']],
      ['A cena la famiglia mangia la minestra con le verdure dell\'orto.', ['minestra', 'cucchiaio', 'tavolo']],
    ],
    [
      { text: 'Quando pianta i semi il nonno?', kind: 'explicit', options: [['In primavera', true], ['In inverno', false], ['Di notte', false]] },
      { text: 'Che verdure raccoglie?', kind: 'explicit', options: [['Carote e zucchine', true], ['Mele e pere', false], ['Pane e latte', false]] },
      { text: 'Da dove vengono le verdure della minestra?', kind: 'inferential', options: [['Dall\'orto del nonno', true], ['Dal negozio di scarpe', false], ['Dalla scuola', false]] },
    ],
    ['giardino', 'carota', 'minestra'],
  ),
  s(
    'st-parco',
    'Il pomeriggio al parco',
    3,
    '4-6 anni',
    [
      ['Nel pomeriggio Emma va al parco con la palla.', ['pomeriggio', 'parco', 'palla']],
      ['Emma lancia la palla al cane. Il cane corre e la riporta.', ['palla', 'cane', 'correre']],
      ['Poi Emma beve l\'acqua dalla borraccia e torna a casa.', ['acqua', 'bere', 'casa']],
    ],
    [
      { text: 'Quando va al parco Emma?', kind: 'explicit', options: [['Nel pomeriggio', true], ['Di notte', false], ['La mattina presto', false]] },
      { text: 'Che cosa fa il cane?', kind: 'explicit', options: [['Corre e riporta la palla', true], ['Dorme', false], ['Cucina', false]] },
      { text: 'Che cosa beve Emma?', kind: 'explicit', options: [['L\'acqua', true], ['Il latte', false], ['Il tè', false]] },
    ],
    ['parco', 'palla', 'bere'],
  ),
  s(
    'st-inverno',
    'La neve in giardino',
    4,
    '6-8 anni',
    [
      ['Stanotte è nevicato. Il giardino è tutto bianco.', ['neve', 'giardino', 'bianco', 'notte']],
      ['Marco indossa il cappotto, i guanti e la sciarpa.', ['cappotto', 'guanti', 'sciarpa', 'freddo']],
      ['Con gli amici costruisce un pupazzo di neve. Poi entrano a bere una tazza di tè caldo.', ['amico', 'costruire', 'tazza', 'te', 'caldo']],
    ],
    [
      { text: 'Che cosa rende bianco il giardino?', kind: 'explicit', options: [['La neve', true], ['La pioggia', false], ['Le foglie', false]] },
      { text: 'Che cosa indossa Marco?', kind: 'explicit', options: [['Cappotto, guanti e sciarpa', true], ['Costume da bagno', false], ['Grembiule', false]] },
      { text: 'Perché bevono il tè caldo?', kind: 'inferential', options: [['Per riscaldarsi', true], ['Perché sono a scuola', false], ['Perché è estate', false]] },
    ],
    ['neve', 'cappotto', 'caldo'],
  ),
  s(
    'st-forme',
    'Il disegno di Elisa',
    5,
    '7-9 anni',
    [
      ['Elisa disegna una casa con il quadrato e il triangolo.', ['quadrato', 'triangolo', 'casa']],
      ['Il sole è un cerchio giallo. Le finestre sono rettangoli.', ['cerchio', 'giallo', 'rettangolo', 'finestra']],
      ['L\'insegnante appende il disegno alla lavagna. Elisa è orgogliosa.', ['insegnante', 'lavagna', 'felice']],
    ],
    [
      { text: 'Che forma ha il sole?', kind: 'explicit', options: [['Un cerchio', true], ['Un quadrato', false], ['Un triangolo', false]] },
      { text: 'Con quali forme fa il tetto?', kind: 'explicit', options: [['Con il triangolo', true], ['Con il cerchio', false], ['Con il rettangolo', false]] },
      { text: 'Perché Elisa è orgogliosa?', kind: 'inferential', options: [['Perché il suo disegno è alla lavagna', true], ['Perché ha fame', false], ['Perché piove', false]] },
    ],
    ['cerchio', 'triangolo', 'lavagna'],
  ),
  s(
    'st-emozioni',
    'Il giocattolo rotto',
    5,
    '7-9 anni',
    [
      ['Pietro gioca con il suo trenino. Corre veloce sul pavimento.', ['giocare', 'trenino', 'veloce']],
      ['Il trenino cade e si rompe. Pietro è triste e ha voglia di piangere.', ['rompere', 'triste', 'piangere']],
      ['La nonna lo aiuta a incollarlo. Pietro sorride: ora è contento.', ['nonno', 'aiuto', 'felice', 'colla']],
    ],
    [
      { text: 'Che cosa si rompe?', kind: 'explicit', options: [['Il trenino', true], ['La palla', false], ['Il libro', false]] },
      { text: 'Come si sente Pietro dopo la rottura?', kind: 'explicit', options: [['Triste', true], ['Rabbioso', false], ['Annoiato', false]] },
      { text: 'Che cosa fa la nonna?', kind: 'inferential', options: [['Lo ripara con la colla', true], ['Lo butta via', false], ['Lo porta a scuola', false]] },
    ],
    ['triste', 'felice', 'aiuto'],
  ),
  s(
    'st-analogia',
    'Il gioco delle somiglianze',
    6,
    '9-11 anni',
    [
      ['A scuola l\'insegnante chiede: "In che cosa sono simili una bicicletta e un\'automobile?"', ['bicicletta', 'automobile', 'insegnante']],
      ['I bambini rispondono: servono per spostarsi, hanno le ruote, vanno sulla strada.', ['strada', 'automobile']],
      ['Poi l\'insegnante chiede: "In che cosa sono diverse?". Una ha il motore, l\'altra i pedali.', ['bicicletta', 'automobile', 'strada']],
    ],
    [
      { text: 'In che cosa sono simili bicicletta e automobile?', kind: 'inferential', options: [['Hanno le ruote e vanno sulla strada', true], ['Sono tutte e due rosse', false], ['Vanno tutte e due sull\'acqua', false]] },
      { text: 'Qual è una differenza importante?', kind: 'inferential', options: [['L\'automobile ha il motore, la bicicletta i pedali', true], ['La bicicletta vola', false], ['L\'automobile non ha ruote', false]] },
      { text: 'Che cosa vuol dire "simile"?', kind: 'vocabulary', options: [['Che ha cose in comune', true], ['Che è identico', false], ['Che è il contrario', false]] },
    ],
    ['bicicletta', 'automobile', 'strada'],
  ),
  s(
    'st-inferenza-citta',
    'Il pacco misterioso',
    6,
    '9-11 anni',
    [
      ['Il postino suona il campanello due volte. Ha un pacco grande in mano.', ['postino', 'porta']],
      ['Sul pacco c\'è scritto il nome di Anna. È pesante e fa un rumore di carta.', ['pesante', 'carta', 'regalo']],
      ['Anna lo apre: dentro ci sono i libri che aveva ordinato.', ['libro', 'leggere', 'felice']],
    ],
    [
      { text: 'Chi porta il pacco?', kind: 'explicit', options: [['Il postino', true], ['Il medico', false], ['Il cuoco', false]] },
      { text: 'Che cosa contiene il pacco?', kind: 'explicit', options: [['Dei libri', true], ['Una torta', false], ['Delle scarpe', false]] },
      { text: 'Come capiamo che il pacco è pesante?', kind: 'inferential', options: [['Il testo lo dice e contiene libri', true], ['Perché è piccolo', false], ['Perché è rotondo', false]] },
    ],
    ['postino', 'libro', 'pesante'],
  ),
]

export const STORY_BY_ID = new Map(STORIES.map((st) => [st.id, st]))
