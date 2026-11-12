# Modello didattico

Questo documento spiega **perché** l'app è fatta così. I contenuti e il codice
cambiano, il modello didattico resta il riferimento per ogni modifica.

> Semantica in Gioco è uno strumento educativo di supporto all'intervento. Non è
> un dispositivo diagnostico, non produce valutazioni cliniche e non sostituisce
> il giudizio di insegnanti, logopedisti ed educatori.

---

## 1. Il problema didattico

Un bambino con difficoltà lessicali non ha soprattutto bisogno di **più
domande**: ha bisogno di (a) vedere che cosa significa una parola, (b) essere
aiutato a collegarla a ciò che già sa, (c) usarla in contesti diversi, (d) non
perdere ciò che ha imparato dopo qualche giorno.

Un'app che chiede solo "tocca la mela" misura una prestazione, non insegna. Per
questo la versione 1.2 introduce una **struttura di insegnamento esplicita**
dentro ogni sessione, e una **scheda parola** che si può leggere senza rispondere.

Tre vincoli hanno guidato il ridisegno:

1. il bambino deve poter partecipare **senza saper leggere** e **senza parlare**;
2. l'errore deve produrre **informazione**, non un giudizio;
3. ciò che si impara a schermo deve poter essere **usato fuori dallo schermo**.

---

## 2. Il ciclo della sessione

Ogni sessione segue quattro fasi, sempre nello stesso ordine. La sequenza è
mostrata al bambino con una frase breve e ascoltabile, e all'adulto con una
ragione didattica.

| Fase | Che cosa vede il bambino | Che cosa fa l'adulto | Perché |
|---|---|---|---|
| **Riscaldamento** | «Cominciamo con una parola che conosci già» | Osserva come entra nel compito | Attivazione e successo iniziale: riduce l'ansia da prestazione e riporta l'attenzione sul compito |
| **Guardiamo insieme** | La risposta è visibile, il ragionamento è scritto e ascoltabile | Verbalizza i passaggi, non anticipa la risposta | Esempio svolto: prima si mostra la procedura, poi si chiede di eseguirla |
| **Proviamo insieme** | Indizi disponibili, un distrattore può essere tolto | Dà tempo, ripete la consegna, non corregge la pronuncia | Pratica guidata: si costruisce la procedura con l'aiuto |
| **Provi tu** | Nessuna riduzione automatica delle alternative, nessun timer | Osserva e registra l'autonomia | Pratica autonoma: è qui che si vede che cosa il bambino sa fare da solo |
| **Chiusura** | Parole incontrate e un compito da fare senza dispositivo | Sceglie il compito adatto alla giornata | Transfer: la parola serve se serve nella vita |

La chiusura non è un riepilogo di punteggi: elenca le parole, le fa riascoltare
e propone due o tre azioni concrete (per esempio: «Prendi la forchetta e il
piatto e usali insieme»).

**Perché non si parte dalla verifica.** Chiedere subito una prestazione a un
bambino che non ha ancora il concetto produce errori che non insegnano nulla.
L'esempio svolto iniziale gli permette di vedere il ragionamento, e la pratica
autonoma arriva solo dopo che la procedura è stata costruita.

---

## 3. L'errore come informazione

Nessun messaggio dell'app dice «sbagliato». Ogni errore produce un'analisi
costruita sui dati reali del lessico, in quattro famiglie:

| Tipo di errore | Che cosa significa | Che cosa dice l'app |
|---|---|---|
| **Stesso gruppo, parola diversa** | Il bambino ha la categoria ma non il confine tra i membri | «Anche *pera* è un frutto: sta nello stesso gruppo di *mela*. La differenza è questa: …» |
| **Due gruppi diversi** | Il bambino sta ancora scegliendo per somiglianza percettiva o per caso | «*Cane* è un animale, mentre *mela* è un frutto: sono due gruppi diversi» |
| **Sono collegati** | Il bambino ha recuperato un'associazione tematica invece del referente | «*Spazzolino* e *denti* sono collegati: *spazzolino* si usa con *denti*. Però la parola chiesta era…» |
| **Selezione parziale** | Sa riconoscere alcuni membri del gruppo, non tutti | «Hai trovato 2 elementi su 3. Manca ancora…» |

L'analisi non è un messaggio generico: usa la categoria, la definizione e la
relazione reale fra i due concetti. È il principio dell'**analisi contrastiva**:
la differenza fra due parole vicine insegna più della ripetizione della parola
giusta.

Dopo due tentativi l'app mostra il **modello completo** con i passaggi del
ragionamento. Non è una resa: è un'altra occasione di apprendimento per
imitazione, e resta registrata come risposta con aiuto.

Gli aiuti non vengono mai negati. Nella pratica autonoma, però, l'app **non
toglie più automaticamente un distrattore**: togliere alternative è una
scaffolding che va scomparso, altrimenti il bambino non affronta mai la scelta
completa.

---

## 4. La scheda parola

La scheda parola è la parte di **insegnamento** che mancava. Si apre:

- dalla **parola del giorno** nella home del bambino, senza nessuna domanda;
- dall'**atlante**, per rivedere una parola già incontrata;
- come modello durante la fase «Guardiamo insieme».

Contiene immagine, definizione, categoria, funzione, caratteristiche, luogo,
parole collegate e un esempio. Tutto è ascoltabile, riga per riga.

La griglia segue l'**analisi delle caratteristiche semantiche**: categoria
(«è un tipo di»), funzione («a che cosa serve»), parti («com'è fatto»), luogo,
uso, esempio. Sono le stesse dimensioni che l'app chiede negli esercizi di
descrizione: il bambino non deve indovinare un formato che non ha mai visto.

---

## 5. Generalizzazione

Una parola appresa in un solo formato resta legata a quel formato. L'app lavora
sulla generalizzazione in tre modi:

1. **Rappresentazioni multiple**: lo stesso concetto può comparire con
   pittogrammi diversi (schematico e non schematico).
2. **Tipi di attività diversi**: la stessa parola viene chiesta con immagine,
   etichetta, categoria, funzione, descrizione, racconto. Lo stato «consolidato»
   richiede almeno tre tipi di attività diversi e due sessioni diverse.
3. **Transfer dichiarato**: ogni sessione termina con un compito da svolgere
   con oggetti reali, non con un'altra domanda.

---

## 6. Memoria e ritmo

- **Ripetizione distribuita**: intervalli 1, 3, 7, 14 giorni (poi 30),
  personalizzabili. Un errore riporta al primo passo; un concetto in difficoltà
  entra nella coda anche senza ripasso scaduto.
- **Interleaving**: quando l'adulto sceglie più moduli, le attività si alternano
  e non si ripete due volte di seguito la stessa richiesta.
- **Nessun timer**: il tempo è registrato per l'osservazione, mai usato per
  penalizzare. Un bambino con bisogni motori o comunicativi può essere lento
  senza conseguenze sul livello.
- **Carico cognitivo**: modalità essenziale, una consegna per schermata,
  alternative ridotte solo quando servono davvero.

---

## 7. Il ruolo dell'adulto

L'app non sostituisce l'adulto: gli dà un copione. Nella sessione è disponibile
un pannello «Per l'adulto» con l'obiettivo del modulo e le indicazioni operative.

Comportamenti previsti dal modello:

- **modellare** prima di chiedere (fase «Guardiamo insieme»);
- **aspettare** almeno cinque secondi prima di suggerire;
- **ripetere** la consegna quante volte serve, senza commenti sul tempo;
- **non correggere la pronuncia**: l'app non valuta l'articolazione;
- **accettare** risposte con gesti, sguardo, simboli CAA o conferma dell'adulto;
- **osservare** che cosa rende più facile la risposta (indizio di contesto,
  categoria, funzione) e annotarlo;
- **non usare l'app come test**: le soglie di consolidamento sono criteri
  descrittivi, non punteggi.

---

## 8. Comunicazione aumentativa e accessibilità

La CAA non è un'aggiunta: la barra con nove parole funzionali (Voglio, Non
voglio, Ancora, Basta, Aiuto, Non so, Mi piace, Non mi piace, Ripeti) è
disponibile durante sessioni, storie e ambienti. Permette di:

- rispondere senza parlare;
- chiedere una pausa o un aiuto;
- comporre e ascoltare una frase.

Le scelte di accessibilità (alto contrasto, animazioni ridotte, modalità
essenziale, solo maiuscole, scansione assistita, alternativa al trascinamento)
sono descritte in [ACCESSIBILITA.md](ACCESSIBILITA.md).

---

## 9. Che cosa l'app non fa

- Non formula diagnosi e non assegna punteggi globali.
- Non valuta la pronuncia e non usa il riconoscimento vocale per la correttezza.
- Non sostituisce la valutazione logopedica né un programma individualizzato.
- Non garantisce un guadagno clinico misurabile: è uno strumento didattico, e
  come tale va scelto e adattato dall'adulto.
- Gli esercizi generati automaticamente richiedono una revisione didattica
  prima dell'uso con un bambino.

---

## 10. Come verificare che il modello funzioni

Non con un punteggio unico, ma con tre domande osservative, ripetute nel tempo:

1. La parola compare **spontaneamente**, senza aiuto, in una situazione nuova?
2. Il bambino **generalizza** a rappresentazioni e attività diverse?
3. Il bambino **usa** la parola fuori dallo schermo, in una routine reale?

Le annotazioni osservative dell'area adulti servono a rispondere a queste
domande, e la dashboard separa comprensione recettiva, competenza espressiva,
profondità semantica e autonomia.
