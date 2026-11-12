# Inventario delle licenze

Ogni risorsa ha una licenza propria. Questo documento separa le opere: una
licenza non si estende automaticamente alle altre.

## Codice sorgente

| Componente | Licenza | Note |
|---|---|---|
| Semantica in Gioco (codice applicativo) | da scegliere dal titolare | Il codice software e i contenuti didattici sono opere distinte: applicare CC BY-SA 4.0 ai contenuti non significa applicarla al codice. |
| React, React DOM | MIT | `package.json` |
| Vite, TypeScript, Vitest, Playwright, Electron, electron-builder | MIT / Apache-2.0 secondo il pacchetto | solo sviluppo e distribuzione |
| `piper-tts-web` 1.1.2 | **MIT** | Jonas Plamann; include `@huggingface/transformers` e `onnxruntime-web` |

## Contenuti originali

Testi, esercizi, storie, mappe, percorsi, definizioni e strutture semantiche
originali possono essere distribuiti, a scelta del titolare, con **CC BY-SA 4.0**,
con attribuzione. Questa scelta non si applica ai pittogrammi ARASAAC né ai
modelli vocali.

## Pittogrammi

| Risorsa | Licenza | Obblighi |
|---|---|---|
| Pittogrammi ARASAAC (`public/pictograms`) | **CC BY-NC-SA 4.0** | attribuzione a Sergio Palao / Governo di Aragona, uso **non commerciale**, condividi allo stesso modo |

Un'opera derivata dai pittogrammi (per esempio una scheda stampata che li
contiene) eredita CC BY-NC-SA 4.0 e **non** può essere ridistribuita come
CC BY-SA 4.0. Per questo l'attribuzione è visibile in *Informazioni e licenze*.

Le copie servite dall'app sono **conversioni in WebP** dei file originali
downloadati da ARASAAC (stessa immagine, formato più leggero): restano opere
derivate sotto CC BY-NC-SA 4.0, con la stessa attribuzione e lo stesso uso non
commerciale. La conversione non aggiunge né toglie contenuto informativo.

## Voce neurale

| Risorsa | Licenza | Fonte |
|---|---|---|
| Motore Piper (via `piper-tts-web`, WebAssembly) | MIT | <https://github.com/Poket-Jony/piper-tts-web> |
| Modello `it_IT-paola-medium` (pesi) | **MIT** | <https://huggingface.co/rhasspy/piper-voices> |
| Dataset di addestramento della voce Paola | **CC0 1.0** | <https://huggingface.co/datasets/paolapersico1/Voice-Dataset-Italian> |
| Voce alternativa `it_IT-riccardo-x_low` (non installata) | pesi MIT, dataset M-AILABS (CC BY 4.0) | da verificare prima di un eventuale uso |

L'audio generato con il modello Paola è un'opera derivata dai pesi MIT e dal
dataset CC0: può essere incluso nei pacchetti dell'app con l'attribuzione
indicata sopra. **Nessuna frase viene inviata a servizi esterni**: la sintesi
avviene sul dispositivo.

## Registrazioni personalizzate

Le registrazioni dell'adulto restano sul dispositivo e non vengono distribuite
con l'app. La loro licenza è quella di chi le ha prodotte.

## Verifiche da completare

- Confermare la licenza del dataset Paola direttamente sul repository del dataset
  prima di una distribuzione pubblica (la scheda del modello rimanda alla URL).
- Se in futuro si aggiungono voci diverse, ripetere la verifica su pesi,
  dataset e condizioni di redistribuzione: non tutte le voci Piper hanno la
  stessa provenienza.
