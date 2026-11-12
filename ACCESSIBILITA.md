# Accessibilità

Obiettivo: WCAG 2.2 livello AA, ove applicabile, con attenzione specifica a bambini con bisogni comunicativi, cognitivi e motori.

## Requisiti implementati

### Percezione e contrasto

- Palette con contrasto elevato testo/sfondo; modalità **Alto contrasto** che porta bordi e testi a nero e colori a tonalità scure.
- Lo stato delle risposte non è comunicato solo dal colore: contorno più spesso, simbolo ✓/!, testo di feedback e `aria-pressed`.
- Le immagini hanno sempre un testo alternativo derivato dalla definizione del concetto.
- Il testo è ridimensionabile (layout fluido, `clamp()`, nessun testo in immagini).
- Modalità **Essenziale**: una o due immagini, nessuna decorazione, meno stimoli simultanei.
- Modalità **Solo caratteri maiuscoli**: tutte le scritte dell'interfaccia, comprese le etichette sotto i simboli, sono mostrate in maiuscolo. È un'opzione per profilo, utile per chi sta imparando le lettere capitali; non modifica i contenuti salvati né la lettura vocale.

### Tastiera e tecnologie assistive

- Tutti i controlli sono elementi nativi (`button`, `input`, `select`, `fieldset/legend`).
- Focus visibile con outline dedicato (`:focus-visible`, spessore 4px).
- Skip link "Vai al contenuto principale".
- Scorciatoie nel player: `1-9` seleziona l'alternativa, `R` ripete la consegna, `H` mostra un aiuto, `Invio` conferma.
- Ruoli e stati ARIA: `role="radiogroup"` per i segmenti, `role="progressbar"`, `role="status"` con `aria-live="polite"` per i feedback, `role="dialog"` con `aria-modal` per le finestre.
- Le mappe semantiche hanno un equivalente testuale: elenco di relazioni tipizzate navigabile, non solo grafo.

### Motorio

- Bersagli generosi: 56px su desktop, 64px su dispositivi touch; pulsanti "grandi" 68px.
- Il trascinamento non è mai obbligatorio: ogni attività drag ha un'alternativa per selezione (categorizzazione: tocca elemento → tocca contenitore; spazio: tocca la zona).
- **Scansione assistita**: evidenzia in sequenza le alternative; attivazione con Spazio o Invio. Utile con sensori o interruttori.
- Nessun limite di tempo e nessuna richiesta a tempo.
- Layout responsive per tablet, LIM e desktop, con orientamento libero.

### Uditivo e comunicativo

- Ogni consegna può essere riprodotta e ripetuta illimitatamente.
- Pulsante audio sempre visibile nel player; controlli di volume e velocità per profilo.
- I suoni decorativi sono disattivati per impostazione predefinita e comunque disattivabili.
- Barra CAA sempre disponibile durante sessioni, storie e ambienti: nove parole funzionali (Voglio, Non voglio, Ancora, Basta, Aiuto, Non so, Mi piace, Non mi piace, Ripeti), ciascuna con simbolo, etichetta nascondibile e lettura vocale.
- La barra permette di comporre una frase e di pronunciarla; la risposta può essere data con i simboli invece che a voce.
- Il riconoscimento vocale non è usato per valutare la pronuncia. Le risposte espressive si registrano su conferma.
- Se manca una voce italiana, l'app mostra un avviso e propone le registrazioni personalizzate.

### Cognitivo

- Una sola consegna principale per schermata.
- Modalità **Essenziale** con pochi elementi; progressi mostrati come "3 di 8" oltre alla barra.
- Errori trattati come occasioni: indizio, distrattore rimosso, nuovo tentativo, modello.
- Nessuna penalizzazione per l'uso di aiuti; autonomia e aiuto sono registrati separatamente.
- Stabilità dello stato "consolidato": richiede contesti diversi, non una singola prestazione.

### Animazioni

- Animazioni brevi e non essenziali; **Riduci le animazioni** e `prefers-reduced-motion` disattivano transizioni.
- Nessun lampeggio o movimento automatico continuo.

## Come verificare

1. **Tastiera**: percorri l'app con Tab e Invio; verifica che il focus sia sempre visibile e che non ci siano trappole.
2. **Contrasto**: attiva Alto contrasto e controlla bordi, etichette, feedback.
3. **Scansione**: attiva la scansione nelle impostazioni, verifica il ciclo automatico e l'attivazione con Spazio/Invio.
4. **Alternativa al drag**: nella categorizzazione seleziona un elemento e poi un contenitore; nella scena spaziale tocca una zona.
5. **Testo nascosto**: disattiva "Mostra il testo scritto" e verifica che le attività iniziali restino comprensibili con audio e immagini.
6. **Audio assente**: disattiva il volume di sistema o usa un dispositivo senza voce italiana; verifica il messaggio e la possibilità di procedere.
7. **Zoom**: porta lo zoom del browser al 200%; verifica che nulla sia tagliato.
8. **LIM**: apri su uno schermo grande e verifica la dimensione dei bersagli e la leggibilità a distanza.
9. **Solo maiuscoli**: attiva l'opzione in *Aspetto*, verifica che consegne, etichette dei simboli, pulsanti e barra CAA siano in maiuscolo e che nessun testo venga tagliato; ricarica la pagina per controllare che la scelta resti attiva.

## Limiti noti

- I test automatici non sostituiscono una verifica con tecnologie assistive reali (NVDA, VoiceOver, TalkBack).
- La scansione assistita è pensata per un singolo interruttore; non gestisce più dispositivi contemporaneamente.
- Il contrasto delle immagini ARASAAC dipende dal pittogramma; l'app fornisce sempre testo alternativo e audio, ma non modifica le immagini originali.
- Il PIN dell'area adulti non è una misura di sicurezza per i dati (vedi privacy).
