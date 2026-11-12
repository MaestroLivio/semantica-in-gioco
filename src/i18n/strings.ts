// Dizionario dell'interfaccia. Il testo inglese è in inglese britannico
// (colour, organisation, licence, programme, recognise, behaviour).
// I contenuti didattici (lemmi, definizioni, consegne) NON sono qui: hanno i
// propri campi nei dati, così restano revisionabili da un insegnante.

export type Language = 'it' | 'en'

export const LANGUAGES: { id: Language; label: string; htmlLang: string }[] = [
  { id: 'it', label: 'Italiano', htmlLang: 'it' },
  { id: 'en', label: 'English', htmlLang: 'en-GB' },
]

export const STRINGS = {
  // ——— struttura dell'app ———
  'app.tagline': { it: 'parole, immagini e significati', en: 'words, pictures and meanings' },
  'app.boot': { it: "Sto preparando l'atlante dei significati…", en: 'Preparing the atlas of meanings…' },
  'app.skipLink': { it: 'Vai al contenuto principale', en: 'Skip to main content' },
  'app.nav.main': { it: 'Azioni principali', en: 'Main actions' },
  'app.nav.accessibility': { it: 'Accessibilità', en: 'Accessibility' },
  'app.nav.info': { it: 'Info', en: 'Info' },
  'app.nav.adults': { it: 'Area adulti', en: 'Adults’ area' },
  'app.storage.error': {
    it: 'I progressi non verranno salvati. Prova ad aprire l’app in una finestra non anonima.',
    en: 'Progress will not be saved. Try opening the app in a non-private window.',
  },
  'app.footer.disclaimer': {
    it: 'Strumento educativo di supporto all’intervento: non è un dispositivo diagnostico e non sostituisce la valutazione logopedica.',
    en: 'An educational tool that supports intervention: it is not a diagnostic device and does not replace a speech and language assessment.',
  },
  'app.footer.privacy': {
    it: 'I dati restano su questo dispositivo. Nessun invio automatico a servizi esterni.',
    en: 'Data stays on this device. Nothing is sent automatically to external services.',
  },
  'app.language': { it: 'Lingua', en: 'Language' },
  'app.language.change': { it: 'Cambia la lingua dell’interfaccia', en: 'Change the interface language' },

  // ——— PIN area adulti ———
  'pin.title': { it: 'Area adulti protetta', en: 'Protected adults’ area' },
  'pin.prompt': { it: 'Inserisci il PIN impostato dall’adulto.', en: 'Enter the PIN set by the adult.' },
  'pin.label': { it: 'PIN', en: 'PIN' },
  'pin.enter': { it: 'Entra', en: 'Enter' },
  'pin.cancel': { it: 'Annulla', en: 'Cancel' },
  'pin.error': {
    it: 'PIN non corretto. Riprova o chiedi all’adulto di riferimento.',
    en: 'Incorrect PIN. Try again or ask the adult who set it.',
  },
  'pin.note': {
    it: 'Il PIN è un filtro locale per evitare accessi accidentali: non protegge i dati da chi usa lo stesso dispositivo.',
    en: 'The PIN is a local filter against accidental access: it does not protect the data from anyone using this device.',
  },

  // ——— componenti comuni ———
  'common.close': { it: 'Chiudi', en: 'Close' },
  'common.cancel': { it: 'Annulla', en: 'Cancel' },
  'common.back': { it: 'Indietro', en: 'Back' },
  'common.listen': { it: 'Ascolta', en: 'Listen' },
  'common.repeat': { it: 'Ripeti la consegna', en: 'Repeat the instruction' },
  'common.start': { it: 'Inizia', en: 'Start' },
  'common.stop': { it: 'Ferma', en: 'Stop' },
  'common.next': { it: 'Avanti', en: 'Next' },
  'common.retry': { it: 'Riprova', en: 'Try again' },

  // ——— home ———
  'home.eyebrow': {
    it: 'Ambiente educativo per la competenza semantica',
    en: 'An educational environment for semantic competence',
  },
  'home.lead': {
    it: 'Un atlante di parole da esplorare: immagini, suoni e relazioni per capire, categorizzare, descrivere e raccontare. Dai 3 agli 11 anni, con percorsi costruiti sulle competenze del bambino.',
    en: 'An atlas of words to explore: pictures, sounds and relationships for understanding, categorising, describing and telling stories. For ages 3 to 11, with pathways built around each child’s skills.',
  },
  'home.start': { it: 'Inizia a giocare', en: 'Start playing' },
  'home.adults': { it: 'Area adulti', en: 'Adults’ area' },
  'home.profiles': { it: 'Profili', en: 'Profiles' },
  'home.profiles.note': {
    it: 'Ogni profilo usa solo uno pseudonimo. Non chiediamo nome, età esatta o diagnosi: le attività si scelgono per competenze e obiettivi.',
    en: 'Each profile uses a nickname only. We do not ask for a name, an exact age or a diagnosis: activities are chosen by skills and goals.',
  },
  'home.newProfile': { it: 'Nuovo profilo', en: 'New profile' },
  'home.pseudonym': { it: 'pseudonimo', en: 'nickname' },
  'home.create.title': { it: 'Crea un profilo', en: 'Create a profile' },
  'home.create.label': { it: 'Pseudonimo (per esempio “Gufo blu”)', en: 'Nickname (for example “Blue Owl”)' },
  'home.create.note': {
    it: 'Non inserire nome e cognome reali. I dati restano su questo dispositivo e possono essere esportati o cancellati dall’area adulti.',
    en: 'Do not enter a real first and last name. Data stays on this device and can be exported or deleted from the adults’ area.',
  },
  'home.create.submit': { it: 'Crea e inizia', en: 'Create and start' },
  'home.ageBand': { it: 'anni', en: 'years' },
  'home.principles': { it: 'Come funziona', en: 'How it works' },
  'home.principle.skill.title': { it: 'La competenza, non l’età', en: 'Skill, not age' },
  'home.principle.skill.body': {
    it: 'Sei livelli di complessità modificabili, con sottolivelli e supporti indipendenti. Una competenza avanzata può essere affrontata con un’interfaccia semplice.',
    en: 'Six adjustable levels of complexity, with independent sub-levels and supports. An advanced skill can be worked on with a simple interface.',
  },
  'home.principle.noSpeech.title': { it: 'Si può rispondere senza parlare', en: 'You can answer without speaking' },
  'home.principle.noSpeech.body': {
    it: 'Tocco, selezione, simboli, gesti osservati dall’adulto, scansione assistita. La comprensione non richiede la pronuncia.',
    en: 'Touch, selection, symbols, gestures observed by the adult, assisted scanning. Understanding does not require speech.',
  },
  'home.principle.errors.title': { it: 'Errori come occasioni', en: 'Mistakes as opportunities' },
  'home.principle.errors.body': {
    it: 'Nessun messaggio punitivo: indizi graduati, distrattori ridotti, modello corretto e un nuovo tentativo.',
    en: 'No punitive messages: graded cues, fewer distractors, the correct model and another try.',
  },
  'home.principle.offline.title': { it: 'Offline e locale', en: 'Offline and local' },
  'home.principle.offline.body': {
    it: 'Le immagini e le attività sono nell’app. Progressi e contenuti personalizzati restano sul dispositivo.',
    en: 'Pictures and activities are part of the app. Progress and custom content stay on the device.',
  },

  // ——— barra CAA ———
  'caa.show': { it: 'Simboli', en: 'Symbols' },
  'caa.hide': { it: 'Nascondi simboli', en: 'Hide symbols' },
  'caa.open': { it: 'Apri la barra dei simboli', en: 'Open the symbol bar' },
  'caa.close': { it: 'Nascondi la barra dei simboli', en: 'Hide the symbol bar' },
  'caa.words': { it: 'Parole per comunicare', en: 'Words for communicating' },
  'caa.add': { it: 'Aggiungi alla frase', en: 'Add to the phrase' },
  'caa.phrase': { it: 'Frase:', en: 'Phrase:' },
  'caa.speak': { it: 'Parla', en: 'Speak' },
  'caa.speakAria': { it: 'Pronuncia la frase composta', en: 'Speak the composed phrase' },
  'caa.deleteLast': { it: 'Cancella l’ultimo simbolo', en: 'Delete the last symbol' },
  'caa.delete': { it: 'Cancella', en: 'Delete' },
  'caa.clear': { it: 'Pulisci', en: 'Clear' },
  'caa.clearAria': { it: 'Cancella la frase', en: 'Clear the phrase' },
  'caa.repeatWord': { it: 'Ripeti la parola {word}', en: 'Repeat the word {word}' },

  // ——— impostazioni ———
  'settings.title': { it: 'Accessibilità e preferenze', en: 'Accessibility and preferences' },
  'settings.intro': {
    it: 'Le impostazioni valgono per {name}. Sono modificabili in qualsiasi momento dall’adulto o dal bambino, senza perdere i progressi.',
    en: 'These settings apply to {name}. They can be changed at any time by the adult or the child, without losing progress.',
  },
  'settings.noProfile': {
    it: 'Seleziona un profilo per modificare le impostazioni.',
    en: 'Select a profile to change the settings.',
  },
  'settings.voiceMissing.title': { it: 'Voce italiana non disponibile.', en: 'Italian voice not available.' },
  'settings.voiceMissing.body': {
    it: 'Questo dispositivo non espone una voce italiana per la sintesi vocale. Puoi scegliere un’altra voce qui sotto oppure usare le registrazioni personalizzate dall’area adulti. Le attività restano utilizzabili con le etichette scritte e le immagini.',
    en: 'This device does not offer an Italian voice for speech synthesis. You can choose another voice below or use custom recordings from the adults’ area. Activities remain usable with written labels and pictures.',
  },
  'settings.section.communication': { it: 'Comunicazione', en: 'Communication' },
  'settings.communicationMode': { it: 'Modalità comunicativa preferita', en: 'Preferred communication mode' },
  'settings.mode.touch': { it: 'Tocco', en: 'Touch' },
  'settings.mode.caa': { it: 'CAA', en: 'AAC' },
  'settings.mode.verbal': { it: 'Verbale', en: 'Verbal' },
  'settings.mode.mixed': { it: 'Misto', en: 'Mixed' },
  'settings.showText': { it: 'Mostra il testo scritto', en: 'Show written text' },
  'settings.showText.hint': {
    it: 'Se disattivato, le attività usano solo immagini e audio.',
    en: 'When off, activities use pictures and audio only.',
  },
  'settings.symbolLabels': { it: 'Etichette sotto i simboli', en: 'Labels under the symbols' },
  'settings.symbolLabels.hint': {
    it: 'Le etichette possono essere nascoste per allenare l’accesso al significato.',
    en: 'Labels can be hidden to train access to meaning.',
  },
  'settings.alternatives': { it: 'Numero massimo di alternative visive', en: 'Maximum number of picture options' },
  'settings.scan': { it: 'Scansione assistita', en: 'Assisted scanning' },
  'settings.scan.hint': {
    it: 'Evidenzia le alternative in sequenza. Si attiva con Spazio o Invio.',
    en: 'Highlights the options in turn. Activated with Space or Enter.',
  },
  'settings.motor': { it: 'Modalità di interazione motoria', en: 'Motor interaction mode' },
  'settings.motor.tap': { it: 'Solo tocco', en: 'Touch only' },
  'settings.motor.drag': { it: 'Trascinamento', en: 'Drag and drop' },
  'settings.motor.both': { it: 'Entrambi', en: 'Both' },
  'settings.section.appearance': { it: 'Aspetto', en: 'Appearance' },
  'settings.visualMode': { it: 'Modalità visiva', en: 'Visual mode' },
  'settings.visual.essential': { it: 'Essenziale', en: 'Essential' },
  'settings.visual.standard': { it: 'Standard', en: 'Standard' },
  'settings.visual.exploration': { it: 'Esplorazione', en: 'Exploration' },
  'settings.visual.note': {
    it: 'Essenziale: una o due immagini, pochi elementi, nessuna decorazione. Esplorazione: ambientazioni illustrate e attività contestualizzate.',
    en: 'Essential: one or two pictures, few elements, no decoration. Exploration: illustrated settings and activities in context.',
  },
  'settings.highContrast': { it: 'Alto contrasto', en: 'High contrast' },
  'settings.reducedMotion': { it: 'Riduci le animazioni', en: 'Reduce animations' },
  'settings.uppercase': { it: 'Solo caratteri maiuscoli', en: 'Capitals only' },
  'settings.uppercase.hint': {
    it: 'Tutte le scritte dell’app diventano MAIUSCOLE, comprese le etichette sotto le immagini. Utile per chi sta imparando le lettere capitali.',
    en: 'All text in the app becomes CAPITALS, including labels under pictures. Useful for children learning capital letters.',
  },
  'settings.sessionLength': { it: 'Durata predefinita della sessione', en: 'Default session length' },
  'settings.activities': { it: 'attività', en: 'activities' },
  'settings.section.audio': { it: 'Audio', en: 'Audio' },
  'settings.rate': { it: 'Velocità della voce', en: 'Speech rate' },
  'settings.volume': { it: 'Volume', en: 'Volume' },
  'settings.voices': { it: '{count} voci disponibili', en: '{count} voices available' },
  'settings.voices.withItalian': { it: ', con voce italiana', en: ', including an Italian voice' },
  'settings.voices.withoutItalian': { it: ', senza voce italiana', en: ', without an Italian voice' },
  'settings.voices.note': {
    it: '. La voce si imposta dal dispositivo; qui è indicata la disponibilità.',
    en: '. The voice is configured on the device; availability is shown here.',
  },
  'settings.tryVoice': { it: 'Prova la voce', en: 'Try the voice' },
  'settings.tryVoice.text': {
    it: 'Ciao! Sono la voce di Semantica in Gioco.',
    en: 'Hello! This is the voice of Semantica in Gioco.',
  },
  'settings.autoAudio': { it: 'Leggi automaticamente la consegna', en: 'Read the instruction aloud automatically' },
  'settings.decorativeSounds': { it: 'Suoni decorativi', en: 'Decorative sounds' },
  'settings.decorativeSounds.hint': {
    it: 'Sempre disattivabili. I feedback non usano suoni fastidiosi.',
    en: 'Can always be switched off. Feedback never uses harsh sounds.',
  },
  'settings.section.learning': { it: 'Apprendimento', en: 'Learning' },
  'settings.autoAdaptive': { it: 'Adattamento automatico della difficoltà', en: 'Automatic difficulty adjustment' },
  'settings.autoAdaptive.hint': {
    it: 'Se disattivato, l’adulto controlla interamente livelli, alternative e aiuti.',
    en: 'When off, the adult controls levels, options and cues entirely.',
  },
  'settings.cues': { it: 'Quantità di aiuti', en: 'Amount of cueing' },
  'settings.cues.none': { it: 'Nessuno', en: 'None' },
  'settings.cues.light': { it: 'Leggeri', en: 'Light' },
  'settings.cues.full': { it: 'Completi', en: 'Full' },
  'settings.masterySessions': {
    it: 'Sessioni diverse per considerare consolidata una competenza',
    en: 'Different sessions needed to consider a skill consolidated',
  },
  'settings.masteryKinds': { it: 'Tipi di attività diversi richiesti', en: 'Different activity types required' },
  'settings.masteryAccuracy': { it: 'Accuratezza minima', en: 'Minimum accuracy' },
  'settings.mastery.note': {
    it: 'Il consolidamento richiede la stessa competenza in sessioni e contesti diversi: non basta una percentuale alta in una singola sessione.',
    en: 'Consolidation requires the same skill across different sessions and contexts: a high score in a single session is not enough.',
  },
  'settings.backToActivities': { it: 'Torna alle attività', en: 'Back to activities' },
  'settings.toAdults': { it: 'Area adulti', en: 'Adults’ area' },
  // ——— aggiornamenti (solo app desktop) ———
  'update.title': { it: 'Aggiornamenti', en: 'Updates' },
  'update.version': { it: 'Versione installata: {version}', en: 'Installed version: {version}' },
  'update.check': { it: 'Controlla ora', en: 'Check now' },
  'update.checking': { it: 'Controllo degli aggiornamenti…', en: 'Checking for updates…' },
  'update.upToDate': {
    it: 'Hai già la versione più recente ({version}).',
    en: 'You already have the latest version ({version}).',
  },
  'update.available': {
    it: 'Aggiornamento {version} disponibile: lo preparo in background.',
    en: 'Update {version} is available: preparing it in the background.',
  },
  'update.downloading': {
    it: 'Scarico la versione {version} per questo computer… {progress}%',
    en: 'Downloading version {version} for this computer… {progress}%',
  },
  'update.ready': {
    it: "La versione {version} è pronta: l'app si chiude e apre l'installer.",
    en: "Version {version} is ready: the app will close and open the installer.",
  },
  'update.installing': {
    it: "Chiusura dell'app e apertura dell'installer…",
    en: 'Closing the app and opening the installer…',
  },
  'update.install': { it: 'Installa e riavvia', en: 'Install and restart' },
  'update.autoInstall': {
    it: "Installa automaticamente all'avvio",
    en: 'Install automatically at startup',
  },
  'update.autoInstall.hint': {
    it: 'Se un aggiornamento è già scaricato, all\'avvio l\'app si chiude e apre l\'installer senza chiedere. Durante una sessione aspetta comunque, per non perdere il lavoro.',
    en: 'If an update is already downloaded, the app closes and opens the installer at startup without asking. It still waits during a session so no work is lost.',
  },
  'update.notes': { it: 'Note della versione', en: 'Release notes' },
  'update.unsupported': {
    it: "La release {version} non contiene un file per questo sistema ({platform} {arch}): si aggiorna a mano dalla pagina delle release.",
    en: 'Release {version} has no file for this system ({platform} {arch}): update manually from the releases page.',
  },
  'update.error': {
    it: 'Non ho potuto controllare gli aggiornamenti: {message}',
    en: 'I could not check for updates: {message}',
  },
  'update.idle': {
    it: "Il controllo avviene a ogni avvio dell'app.",
    en: 'The check runs every time the app starts.',
  },

  'settings.section.language': { it: 'Lingua', en: 'Language' },
  'settings.language.note': {
    it: 'La lingua vale per l’interfaccia e per le voci dell’adulto. I contenuti lessicali tradotti sono indicati nella scheda dei contenuti.',
    en: 'The language applies to the interface and to the adults’ area. Translated vocabulary is reported in the content panel.',
  },

  // ——— pannello voce ———
  'voice.title': { it: 'Voce e modello', en: 'Voice and model' },
  'voice.intro': {
    it: 'La voce predefinita è Paola, neurale e italiana: viene eseguita sul dispositivo e produce lo stesso suono su ogni computer. Si scarica una sola volta ({size}), poi funziona offline. Senza il modello l’app usa la voce del sistema, che cambia da dispositivo a dispositivo.',
    en: 'The default voice is Paola, a neural Italian voice: it runs on the device and sounds the same on every computer. It is downloaded once ({size}) and then works offline. Without the model the app uses the system voice, which varies from device to device.',
  },
  'voice.engine': { it: 'Motore vocale', en: 'Speech engine' },
  'voice.engine.auto': { it: 'Automatico', en: 'Automatic' },
  'voice.engine.auto.hint': {
    it: 'Neurale se già installata, altrimenti dispositivo',
    en: 'Neural if already installed, otherwise the device voice',
  },
  'voice.engine.neural': { it: 'Neurale', en: 'Neural' },
  'voice.engine.recorded': { it: 'Pregenerato', en: 'Pre-recorded' },
  'voice.engine.system': { it: 'Dispositivo', en: 'Device' },
  'voice.state.idle': { it: 'Non ancora avviata', en: 'Not started yet' },
  'voice.state.loading': { it: 'Preparazione in corso', en: 'Preparing' },
  'voice.state.ready': { it: 'Pronta', en: 'Ready' },
  'voice.state.error': { it: 'Errore', en: 'Error' },
  'voice.state.unavailable': { it: 'Non disponibile', en: 'Unavailable' },
  'voice.kind.neural': { it: 'Voce neurale locale', en: 'Local neural voice' },
  'voice.kind.recorded': { it: 'Pacchetto audio pregenerato', en: 'Pre-recorded audio pack' },
  'voice.kind.system': { it: 'Voce del dispositivo', en: 'Device voice' },
  'voice.engineInUse': { it: 'Motore in uso', en: 'Engine in use' },
  'voice.voice': { it: 'Voce', en: 'Voice' },
  'voice.model': { it: 'Modello', en: 'Model' },
  'voice.installed': { it: 'installato', en: 'installed' },
  'voice.notInstalled': { it: 'non installato', en: 'not installed' },
  'voice.licence': { it: 'Licenza', en: 'Licence' },
  'voice.offline': { it: 'Offline', en: 'Offline' },
  'voice.offline.yes': { it: 'Sì, nessuna connessione necessaria', en: 'Yes, no connection needed' },
  'voice.offline.no': { it: 'Non ancora disponibile', en: 'Not available yet' },
  'voice.cache': { it: 'Cache audio', en: 'Audio cache' },
  'voice.sentences': { it: 'frasi', en: 'phrases' },
  'voice.preparing': { it: 'Preparazione del modello: {percent}%', en: 'Preparing the model: {percent}%' },
  'voice.install': { it: 'Scarica la voce neurale', en: 'Download the neural voice' },
  'voice.verify': { it: 'Verifica la voce neurale', en: 'Check the neural voice' },
  'voice.trySlow': { it: 'Prova la velocità lenta', en: 'Try the slow rate' },
  'voice.trySlow.text': {
    it: 'Questa è la velocità lenta. Ascoltiamo con calma.',
    en: 'This is the slow rate. Let us listen carefully.',
  },
  'voice.remove': { it: 'Rimuovi modello e cache', en: 'Remove model and cache' },
  'voice.clearCache': { it: 'Svuota la cache audio', en: 'Empty the audio cache' },
  'voice.slowRate': { it: 'Velocità della modalità lenta', en: 'Slow-mode rate' },
  'voice.repeats': { it: 'Letture della consegna', en: 'Readings of the instruction' },
  'voice.repeats.once': { it: 'Una volta', en: 'Once' },
  'voice.repeats.twice': { it: 'Due volte', en: 'Twice' },
  'voice.repeats.thrice': { it: 'Tre volte', en: 'Three times' },
  'voice.pauseBefore': { it: 'Pausa prima della consegna', en: 'Pause before the instruction' },
  'voice.pauseAfter': { it: 'Pausa dopo la consegna', en: 'Pause after the instruction' },
  'voice.none': { it: 'Nessuna', en: 'None' },
  'voice.repeatTarget': { it: 'Ripeti solo la parola target', en: 'Repeat only the target word' },
  'voice.repeatTarget.hint': {
    it: 'Nella ripetizione non viene riletta tutta la frase, solo la parola dell’attività.',
    en: 'On repetition the whole sentence is not read again, only the activity word.',
  },
  'voice.readFeedback': { it: 'Leggi i feedback', en: 'Read feedback aloud' },
  'voice.readFeedback.hint': {
    it: 'Le risposte vengono commentate a voce. Nessun suono fastidioso in caso di errore.',
    en: 'Answers are commented on aloud. No harsh sound on an incorrect answer.',
  },
  'voice.installOk': {
    it: 'Voce neurale pronta: funziona senza rete da adesso in poi.',
    en: 'Neural voice ready: it now works without a connection.',
  },
  'voice.installKo': {
    it: 'Download non riuscito. La voce del dispositivo resta disponibile.',
    en: 'Download failed. The device voice remains available.',
  },
  'voice.removed': {
    it: 'Modello rimosso e cache audio svuotata. I dati dei bambini non sono stati toccati.',
    en: 'Model removed and audio cache emptied. Children’s data was not touched.',
  },

  // ——— informazioni e licenze ———
  'about.title': { it: 'Informazioni, licenze e limiti', en: 'Information, licences and limits' },
  'about.what.title': { it: 'Che cos’è', en: 'What it is' },
  'about.what.body': {
    it: 'Semantica in Gioco è un ambiente educativo per lo sviluppo delle competenze lessicali e semantiche, pensato per bambini dai 3 agli 11 anni e per gli adulti che li accompagnano: insegnanti, insegnanti di sostegno, logopedisti, educatori e genitori.',
    en: 'Semantica in Gioco is an educational environment for developing vocabulary and semantic skills, designed for children aged 3 to 11 and for the adults who support them: teachers, special educational needs teachers, speech and language therapists, educators and parents.',
  },
  'about.what.disclaimer': {
    it: 'Non è un dispositivo diagnostico e non sostituisce la valutazione o il trattamento logopedico. I dati raccolti descrivono le risposte date nell’app, non le capacità del bambino.',
    en: 'It is not a diagnostic device and does not replace a speech and language assessment or treatment. The data collected describes the answers given in the app, not the child’s abilities.',
  },
  'about.content.title': { it: 'Contenuti in questa versione', en: 'Content in this version' },
  'about.content.concepts': { it: '{count} concetti illustrati con relazioni semantiche tipizzate', en: '{count} illustrated concepts with typed semantic relations' },
  'about.content.categories': { it: '{count} categorie semantiche', en: '{count} semantic categories' },
  'about.content.exercises': { it: '{count} esercizi verificati nella banca curata (oltre a quelli generabili)', en: '{count} checked exercises in the curated bank (plus generated ones)' },
  'about.content.stories': { it: '{count} storie illustrate con domande esplicite e inferenziali', en: '{count} illustrated stories with explicit and inferential questions' },
  'about.content.maps': { it: '{count} mappe semantiche pronte', en: '{count} ready-made semantic maps' },
  'about.content.environments': { it: '{count} ambienti esplorabili con missioni', en: '{count} explorable environments with missions' },
  'about.content.structure': { it: '20 moduli didattici, 10 percorsi, 6 livelli con sottolivelli', en: '20 teaching modules, 10 pathways, 6 levels with sub-levels' },
  'about.content.note': {
    it: 'Nessun contenuto è segnaposto: le istruzioni e le frasi sono in italiano e verificate. Le attività con più risposte corrette le accettano tutte.',
    en: 'No content is a placeholder: instructions and sentences are written and checked. Activities with more than one correct answer accept all of them.',
  },
  'about.pictograms.title': { it: 'Pittogrammi e licenze', en: 'Pictograms and licences' },
  'about.pictograms.body': {
    it: 'I pittogrammi utilizzati per gli stimoli visivi provengono da ARASAAC (Centro Aragonés para la Comunicación Aumentativa y Alternativa, Governo di Aragona), autore Sergio Palao, distribuiti con licenza Creative Commons BY-NC-SA 4.0.',
    en: 'The pictograms used as visual stimuli come from ARASAAC (Centro Aragonés para la Comunicación Aumentativa y Alternativa, Government of Aragon), author Sergio Palao, released under the Creative Commons BY-NC-SA 4.0 licence.',
  },
  'about.pictograms.attribution': {
    it: 'Attribuzione: ARASAAC — Sergio Palao — https://arasaac.org — CC BY-NC-SA 4.0',
    en: 'Attribution: ARASAAC — Sergio Palao — https://arasaac.org — CC BY-NC-SA 4.0',
  },
  'about.pictograms.nonCommercial': {
    it: 'Uso non commerciale: l’app è uno strumento educativo senza pubblicità né vendite.',
    en: 'Non-commercial use: the app is an educational tool with no advertising and no sales.',
  },
  'about.pictograms.shareAlike': {
    it: 'Condivisione allo stesso modo: le immagini derivate restano soggette alla stessa licenza; non vengono relicenziate come materiale indipendente.',
    en: 'Share-alike: derived images remain under the same licence and are not relicensed as independent material.',
  },
  'about.pictograms.local': {
    it: 'Le immagini sono scaricate localmente dallo script scripts/fetch-pictograms.mjs, per il funzionamento offline.',
    en: 'The images are downloaded locally by the scripts/fetch-pictograms.mjs script, so that the app works offline.',
  },
  'about.pictograms.personal': {
    it: 'Le immagini personali caricate dall’adulto restano di proprietà di chi le carica e non vengono condivise. L’app non incorpora librerie di simboli protette senza rispettarne le condizioni.',
    en: 'Personal images uploaded by the adult remain the property of the person who uploads them and are not shared. The app does not include protected symbol libraries without respecting their terms.',
  },
  'about.privacy.title': { it: 'Dati e privacy', en: 'Data and privacy' },
  'about.privacy.local': {
    it: 'Architettura local-first: profili, tentativi, annotazioni, foto e registrazioni restano sul dispositivo.',
    en: 'Local-first architecture: profiles, attempts, notes, photos and recordings stay on the device.',
  },
  'about.privacy.noTracking': {
    it: 'Nessun tracciamento pubblicitario, nessuna analytics, nessun invio automatico di dati a server esterni.',
    en: 'No advertising tracking, no analytics, no automatic sending of data to external servers.',
  },
  'about.privacy.noAuth': {
    it: 'Nessuna autenticazione richiesta ai bambini e nessun account obbligatorio.',
    en: 'No sign-in required for children and no mandatory account.',
  },
  'about.privacy.export': {
    it: 'Importazione/esportazione JSON, backup e cancellazione effettiva disponibili nell’area adulti.',
    en: 'JSON import/export, backup and effective deletion are available in the adults’ area.',
  },
  'about.privacy.minimal': {
    it: 'Minimizzazione: solo pseudonimo, fascia d’età e impostazioni didattiche.',
    en: 'Data minimisation: only a nickname, an age band and teaching settings.',
  },
  'about.privacy.sync': {
    it: 'Un’eventuale sincronizzazione cloud non è implementata: se in futuro sarà aggiunta, dovrà essere disattivata per impostazione predefinita e progettata separatamente.',
    en: 'Cloud synchronisation is not implemented: if it is added later, it must be off by default and designed separately.',
  },
  'about.limits.title': { it: 'Limiti dichiarati', en: 'Declared limits' },
  'about.limits.speechRecognition': {
    it: 'Il riconoscimento vocale non è utilizzato per valutare la correttezza: le risposte espressive si registrano su conferma dell’adulto o del bambino.',
    en: 'Speech recognition is not used to judge accuracy: expressive answers are recorded with confirmation from the adult or the child.',
  },
  'about.limits.tts': {
    it: 'La sintesi vocale dipende dalle voci installate sul dispositivo. Se manca una voce italiana, l’app lo segnala e propone le registrazioni personalizzate.',
    en: 'Speech synthesis depends on the voices installed on the device. If no Italian voice is available, the app says so and offers custom recordings.',
  },
  'about.limits.generated': {
    it: 'Le attività generate automaticamente richiedono una revisione didattica dell’adulto prima dell’uso con un bambino: l’area adulti mostra gli item scartati dalla validazione e permette di escludere parole.',
    en: 'Automatically generated activities need teaching review by the adult before use with a child: the adults’ area shows items rejected by validation and lets you exclude words.',
  },
  'about.limits.pin': {
    it: 'Il PIN dell’area adulti è un filtro locale contro gli accessi accidentali, non una protezione crittografica.',
    en: 'The adults’ area PIN is a local filter against accidental access, not cryptographic protection.',
  },
  'about.back': { it: 'Torna all’inizio', en: 'Back to the start' },
  'about.adults': { it: 'Area adulti', en: 'Adults’ area' },
  'about.languageContent.title': { it: 'Lingua dei contenuti', en: 'Content language' },
  'about.languageContent.body': {
    it: 'L’interfaccia è disponibile in italiano e in inglese britannico. I contenuti lessicali (lemmi, definizioni, consegne, storie) sono al momento disponibili solo in italiano: in inglese l’app li mostra in italiano e lo dichiara, invece di mostrare traduzioni automatiche non revisionate.',
    en: 'The interface is available in Italian and in British English. Vocabulary content (lemmas, definitions, instructions, stories) is currently available in Italian only: in English the app shows it in Italian and says so, rather than showing unreviewed machine translations.',
  },

  // ——— schermata del bambino ———
  'child.greeting': { it: 'Ciao {name}', en: 'Hello {name}' },
  'child.title': { it: 'Che cosa esploriamo oggi?', en: 'What shall we explore today?' },
  'child.summary': {
    it: 'Ciao {name}. Che cosa esploriamo oggi? {words} parole scoperte. {sessions} sessioni svolte.',
    en: 'Hello {name}. What shall we explore today? {words} words discovered. {sessions} sessions done.',
  },
  'child.stats': {
    it: '{words} parole scoperte · {sessions} sessioni svolte',
    en: '{words} words discovered · {sessions} sessions done',
  },
  'child.stats.due': { it: ' · {count} parole da riprendere', en: ' · {count} words to revisit' },
  'child.listenSummary': { it: 'Ascolta il riepilogo', en: 'Listen to the summary' },
  'child.review': { it: 'Ripasso ({count})', en: 'Revision ({count})' },
  'child.review.label': { it: 'Ripasso delle parole', en: 'Word revision' },
  'child.atlas': { it: 'Il mio atlante', en: 'My atlas' },
  'child.reviewCard.title': { it: 'Da riprendere', en: 'To revisit' },
  'child.reviewCard.restart': {
    it: 'Ricomincia da queste parole',
    en: 'Start again from these words',
  },
  'child.reviewCard.listen': { it: 'Ascolta {word}: {definition}', en: 'Listen to {word}: {definition}' },
  'child.activities.title': { it: 'Attività', en: 'Activities' },
  'child.activities.note': {
    it: '20 moduli con livelli modificabili. Tocca un modulo per scegliere il livello.',
    en: '20 modules with adjustable levels. Tap a module to choose the level.',
  },
  'child.module.levels': { it: 'Livelli {from}–{to}', en: 'Levels {from}–{to}' },
  'child.module.consolidated': {
    it: ' · {count} parole consolidate',
    en: ' · {count} words consolidated',
  },
  'child.module.listen': { it: 'Ascolta il modulo {title}', en: 'Listen to the module {title}' },
  'child.module.play': { it: 'Gioca', en: 'Play' },
  'child.module.startAria': { it: 'Inizia il modulo {title}', en: 'Start the module {title}' },
  'child.env.title': { it: 'Ambienti', en: 'Environments' },
  'child.env.note': {
    it: 'Esplorazione libera senza valutazione e missioni con un obiettivo semantico.',
    en: 'Free exploration with no assessment, and missions with a semantic goal.',
  },
  'child.labs.title': { it: 'Storie e mappe', en: 'Stories and maps' },
  'child.labs.note': {
    it: 'Racconti illustrati e reti di significati da esplorare liberamente.',
    en: 'Illustrated stories and networks of meanings to explore freely.',
  },
  'child.stories.title': { it: 'Storie illustrate', en: 'Illustrated stories' },
  'child.stories.body': {
    it: '{count} microstorie con domande esplicite e inferenziali.',
    en: '{count} short stories with explicit and inferential questions.',
  },
  'child.stories.listen': { it: 'Ascolta la sezione storie', en: 'Listen to the stories section' },
  'child.stories.open': { it: 'Apri le storie', en: 'Open the stories' },
  'child.maps.title': { it: 'Mappe semantiche', en: 'Semantic maps' },
  'child.maps.body': {
    it: '{count} reti pronte con relazioni tipizzate: è un tipo di, serve per, si usa con…',
    en: '{count} ready-made networks with typed relations: is a type of, is used for, is used with…',
  },
  'child.maps.listen': { it: 'Ascolta la sezione mappe', en: 'Listen to the maps section' },
  'child.maps.open': { it: 'Esplora le mappe', en: 'Explore the maps' },
  'child.quickAccess': { it: 'Accesso rapido', en: 'Quick access' },
  'child.settings': { it: 'Impostazioni di accessibilità', en: 'Accessibility settings' },
  'child.switchProfile': { it: 'Cambia profilo', en: 'Switch profile' },
  'child.level.title': { it: 'Scegli il livello', en: 'Choose the level' },
  'child.level.note': {
    it: 'Il livello indica la difficoltà dell’attività, non l’età. Puoi cambiarlo quando vuoi: la stessa competenza può essere affrontata con un’interfaccia più semplice.',
    en: 'The level shows how hard the activity is, not the child’s age. You can change it whenever you like: the same skill can be practised through a simpler interface.',
  },
  'child.level.start': { it: 'Inizia', en: 'Start' },
  'child.level.1': { it: '1 · Scoperta dei significati', en: '1 · Discovering meanings' },
  'child.level.2': { it: '2 · Prime relazioni', en: '2 · First relations' },
  'child.level.3': { it: '3 · Organizzazione semantica', en: '3 · Semantic organisation' },
  'child.level.4': { it: '4 · Descrizione e recupero', en: '4 · Description and retrieval' },
  'child.level.5': { it: '5 · Semantica contestuale', en: '5 · Meaning in context' },
  'child.level.6': { it: '6 · Ragionamento semantico', en: '6 · Semantic reasoning' },
  'child.noProfile.title': { it: 'Nessun profilo selezionato', en: 'No profile selected' },
  'child.noProfile.body': {
    it: 'Torna alla schermata iniziale e scegli o crea un profilo.',
    en: 'Go back to the start screen and choose or create a profile.',
  },
} satisfies Record<string, Record<Language, string>>

export type StringKey = keyof typeof STRINGS
