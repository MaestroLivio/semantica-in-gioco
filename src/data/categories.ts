import type { Category } from '../engine/types'

// 26 categorie semantiche. `kind` distingue le categorie tassonomiche
// ("è un tipo di") da quelle tematiche (raggruppamenti per contesto).
// I campi inglesi sono facoltativi e servono solo all'interfaccia: i contenuti
// restano in italiano finché non vengono revisionati da un insegnante.
export const CATEGORIES: Category[] = [
  { id: 'animali', label: 'Animali', singular: 'un animale', kind: 'taxonomic', color: '#7c9a6d', definition: 'Esseri viventi che si muovono e si nutrono.', labelEn: 'Animals', singularEn: 'an animal', definitionEn: 'Living things that move and feed themselves.' },
  { id: 'frutta', label: 'Frutta', singular: 'un frutto', kind: 'taxonomic', color: '#c96a4e', definition: 'Frutti dolci che si mangiano a tavola o a merenda.', labelEn: 'Fruit', singularEn: 'a piece of fruit', definitionEn: 'Sweet fruits eaten at the table or as a snack.' },
  { id: 'verdura', label: 'Verdura', singular: 'una verdura', kind: 'taxonomic', color: '#6f9a54', definition: 'Ortaggi che si mangiano cotti o crudi.', labelEn: 'Vegetables', singularEn: 'a vegetable', definitionEn: 'Vegetables eaten cooked or raw.' },
  { id: 'alimenti', label: 'Alimenti', singular: 'un alimento', kind: 'taxonomic', color: '#c9a24e', definition: 'Cose che si mangiano per nutrirsi.', labelEn: 'Food', singularEn: 'a food', definitionEn: 'Things people eat to get nourishment.' },
  { id: 'bevande', label: 'Bevande', singular: 'una bevanda', kind: 'taxonomic', color: '#6d9bb5', definition: 'Cose liquide che si bevono.', labelEn: 'Drinks', singularEn: 'a drink', definitionEn: 'Liquid things people drink.' },
  { id: 'vestiti', label: 'Vestiti', singular: 'un vestito', kind: 'taxonomic', color: '#8d7bab', definition: 'Cose che si indossano per coprirsi.', labelEn: 'Clothes', singularEn: 'a piece of clothing', definitionEn: 'Things people wear to cover themselves.' },
  { id: 'giocattoli', label: 'Giocattoli', singular: 'un giocattolo', kind: 'taxonomic', color: '#c98a4e', definition: 'Cose che servono per giocare.', labelEn: 'Toys', singularEn: 'a toy', definitionEn: 'Things used for playing.' },
  { id: 'veicoli', label: 'Veicoli', singular: 'un veicolo', kind: 'taxonomic', color: '#5b7fb8', definition: 'Mezzi che servono per spostarsi.', labelEn: 'Vehicles', singularEn: 'a vehicle', definitionEn: 'Means of transport used to get around.' },
  { id: 'scuola-oggetti', label: 'Oggetti scolastici', singular: 'un oggetto scolastico', kind: 'taxonomic', color: '#b5705f', definition: 'Cose che si usano a scuola per leggere, scrivere e disegnare.', labelEn: 'School things', singularEn: 'a school item', definitionEn: 'Things used at school to read, write and draw.' },
  { id: 'mobili', label: 'Mobili', singular: 'un mobile', kind: 'taxonomic', color: '#9a7b5a', definition: 'Oggetti grandi che arredano la casa.', labelEn: 'Furniture', singularEn: 'a piece of furniture', definitionEn: 'Large objects that furnish a home.' },
  { id: 'utensili', label: 'Utensili', singular: 'un utensile', kind: 'taxonomic', color: '#7f8b96', definition: 'Oggetti che si usano in cucina o per le faccende.', labelEn: 'Kitchen tools', singularEn: 'a tool', definitionEn: 'Objects used in the kitchen or for household chores.' },
  { id: 'corpo', label: 'Parti del corpo', singular: 'una parte del corpo', kind: 'taxonomic', color: '#c98f8a', definition: 'Parti del corpo umano.', labelEn: 'Parts of the body', singularEn: 'a part of the body', definitionEn: 'Parts of the human body.' },
  { id: 'luoghi', label: 'Luoghi', singular: 'un luogo', kind: 'taxonomic', color: '#7e9a8e', definition: 'Posti dove si va o dove si sta.', labelEn: 'Places', singularEn: 'a place', definitionEn: 'Places people go to or stay in.' },
  { id: 'professioni', label: 'Professioni', singular: 'una professione', kind: 'taxonomic', color: '#8a7f9e', definition: 'Lavori che le persone fanno.', labelEn: 'Jobs', singularEn: 'a job', definitionEn: 'Work that people do.' },
  { id: 'strumenti-musicali', label: 'Strumenti musicali', singular: 'uno strumento musicale', kind: 'taxonomic', color: '#a87ba0', definition: 'Oggetti che producono musica.', labelEn: 'Musical instruments', singularEn: 'a musical instrument', definitionEn: 'Objects that make music.' },
  { id: 'natura', label: 'Elementi naturali', singular: 'un elemento naturale', kind: 'taxonomic', color: '#6b9377', definition: 'Cose che si trovano in natura, senza essere fabbricate.', labelEn: 'Natural elements', singularEn: 'a natural element', definitionEn: 'Things found in nature that are not manufactured.' },
  { id: 'casa-oggetti', label: 'Oggetti di casa', singular: 'un oggetto di casa', kind: 'thematic', color: '#9a8f6f', definition: 'Oggetti che si usano nelle case.', labelEn: 'Household objects', singularEn: 'a household object', definitionEn: 'Objects used in the home.' },
  { id: 'igiene', label: 'Igiene', singular: 'un oggetto per l\'igiene', kind: 'thematic', color: '#74a3a3', definition: 'Oggetti che servono per lavarsi e stare puliti.', labelEn: 'Hygiene', singularEn: 'a hygiene item', definitionEn: 'Objects used to wash and stay clean.' },
  { id: 'persone', label: 'Persone e famiglia', singular: 'una persona', kind: 'taxonomic', color: '#b9896f', definition: 'Persone che conosciamo, grandi e piccole.', labelEn: 'People and family', singularEn: 'a person', definitionEn: 'People we know, young and old.' },
  { id: 'piante', label: 'Piante e fiori', singular: 'una pianta', kind: 'taxonomic', color: '#6f9a54', definition: 'Piante e loro parti.', labelEn: 'Plants and flowers', singularEn: 'a plant', definitionEn: 'Plants and their parts.' },
  { id: 'colori', label: 'Colori', singular: 'un colore', kind: 'taxonomic', color: '#c95f6a', definition: 'Colori che vediamo intorno a noi.', labelEn: 'Colours', singularEn: 'a colour', definitionEn: 'Colours we see around us.' },
  { id: 'forme', label: 'Forme', singular: 'una forma', kind: 'taxonomic', color: '#5f8fc9', definition: 'Forme geometriche che riconosciamo.', labelEn: 'Shapes', singularEn: 'a shape', definitionEn: 'Geometric shapes we recognise.' },
  { id: 'azioni', label: 'Azioni', singular: 'un\'azione', kind: 'taxonomic', color: '#c98a4e', definition: 'Cose che le persone o gli animali fanno.', labelEn: 'Actions', singularEn: 'an action', definitionEn: 'Things people or animals do.' },
  { id: 'qualita', label: 'Qualità e contrari', singular: 'una qualità', kind: 'taxonomic', color: '#8d7bab', definition: 'Come sono le cose: grandi, morbide, calde…', labelEn: 'Qualities and opposites', singularEn: 'a quality', definitionEn: 'What things are like: big, soft, warm…' },
  { id: 'spazio', label: 'Parole dello spazio', singular: 'una parola dello spazio', kind: 'taxonomic', color: '#5b8fb8', definition: 'Parole che dicono dove si trovano le cose.', labelEn: 'Position words', singularEn: 'a position word', definitionEn: 'Words that say where things are.' },
  { id: 'tempo', label: 'Parole del tempo', singular: 'una parola del tempo', kind: 'taxonomic', color: '#b08a5a', definition: 'Parole che dicono quando succedono le cose.', labelEn: 'Time words', singularEn: 'a time word', definitionEn: 'Words that say when things happen.' },
  { id: 'astratti', label: 'Parole astratte ed emozioni', singular: 'una parola astratta', kind: 'thematic', color: '#96709e', definition: 'Cose che non si toccano: emozioni, idee, esperienze.', labelEn: 'Abstract words and emotions', singularEn: 'an abstract word', definitionEn: 'Things you cannot touch: emotions, ideas, experiences.' },
  { id: 'materiali', label: 'Materiali', singular: 'un materiale', kind: 'taxonomic', color: '#8a8577', definition: 'Sostanze con cui sono fatte le cose: legno, carta, farina.', labelEn: 'Materials', singularEn: 'a material', definitionEn: 'Substances things are made of: wood, paper, flour.' },
]

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))

/** Categorie alimentari usate nel supermercato (sottocategorie tematiche). */
export const FOOD_SUBCATEGORIES = ['frutta', 'verdura', 'alimenti', 'bevande'] as const

/** Etichette nella lingua scelta, con l'italiano come riserva. */
export function categoryLabel(category: Category, language: 'it' | 'en'): string {
  return language === 'en' ? category.labelEn ?? category.label : category.label
}

export function categorySingular(category: Category, language: 'it' | 'en'): string {
  return language === 'en' ? category.singularEn ?? category.singular : category.singular
}

export function categoryDefinition(category: Category, language: 'it' | 'en'): string {
  return language === 'en' ? category.definitionEn ?? category.definition : category.definition
}
