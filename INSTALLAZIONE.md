# Installazione — Semantica in Gioco 1.2.0

L'app nasce come PWA e viene distribuita anche come applicazione desktop autonoma (Electron), con la stessa interfaccia e gli stessi contenuti locali.

**Download:** <https://github.com/MaestroLivio/semantica-in-gioco/releases>. La release 1.2.0 contiene l'installer macOS Apple Silicon (`arm64`), l'installer Windows x64 e l'archivio della build web. Le altre architetture si generano da sorgente con i comandi in fondo.

Nessun installer è firmato digitalmente: non ci sono certificati di code signing in questo progetto. Questo è il motivo degli avvisi di sistema descritti sotto; non indica un file corrotto.

## Riepilogo dei file della release 1.2.0

| File | Sistema | Note |
|---|---|---|
| `semantica-in-gioco-1.2.0-mac-arm64.dmg` | macOS Apple Silicon (M1–M4) | Trascina l'app in *Applicazioni* |
| `semantica-in-gioco-1.2.0-mac-arm64.zip` | macOS Apple Silicon | Alternativa portatile al DMG |
| `semantica-in-gioco-1.2.0-windows-x64-installer.exe` | Windows 10/11 x64 | Installer NSIS, installazione per utente |
| `semantica-in-gioco-1.2.0-windows-x64.zip` | Windows 10/11 x64 | Versione portatile, nessuna installazione |
| `semantica-in-gioco-1.2.0-web.zip` | Qualsiasi browser, **ChromeOS**, **Android** | Build statica da pubblicare su HTTPS |

I pacchetti Linux e macOS Intel restano alla 1.0.0 e si rigenerano con `npm run dist:linux` e `npm run dist:mac`.

## Aggiornamenti

L'app desktop controlla le release GitHub a ogni avvio. Se trova una versione più recente scarica il file della propria piattaforma e architettura, poi si chiude e apre l'installer: su macOS il DMG (va trascinato in *Applicazioni*), su Windows l'EXE NSIS.

- Durante una sessione non si chiude da sola: aspetta che il lavoro sia concluso.
- *Impostazioni → Aggiornamenti* mostra la versione installata, lo stato, il pulsante **Controlla ora**, l'interruttore **Installa automaticamente all'avvio** e il collegamento alle note della release.
- Senza rete, o se la release non contiene un file per il proprio sistema, l'app resta sulla versione installata e lo dichiara nel pannello.
- Il file scaricato non è firmato: gli avvisi di Gatekeeper e SmartScreen restano quelli descritti sotto.

## macOS

1. Apri il DMG `arm64` (Apple Silicon).
2. Trascina **Semantica in Gioco** nella cartella *Applicazioni*.
3. Al primo avvio macOS blocca l'app non firmata. Apri *Impostazioni di Sistema → Privacy e sicurezza*, scorri fino al messaggio su Semantica in Gioco e scegli **Apri comunque**; in alternativa tasto destro sull'app → *Apri* → *Apri*.
4. Se l'app resta bloccata da Gatekeeper: `xattr -dr com.apple.quarantine "/Applications/Semantica in Gioco.app"`.

Requisiti: macOS 10.15 o successivo su Apple Silicon. I dati restano nel contenitore dell'app (`~/Library/Application Support/Semantica in Gioco`) e sono separati da quelli del browser.

## Windows

1. Esegui `semantica-in-gioco-1.2.0-windows-x64-installer.exe`.
2. Se compare SmartScreen: *Ulteriori informazioni* → *Esegui comunque* (l'installer non è firmato).
3. Scegli la cartella di installazione; vengono creati collegamenti su desktop e menu Start.
4. In alternativa scompatta `semantica-in-gioco-1.2.0-windows-x64.zip` ed esegui `Semantica in Gioco.exe` senza installare nulla.
5. Per rimuovere l'app usa *Impostazioni → App → Semantica in Gioco → Disinstalla*.

Requisiti: Windows 10/11 a 64 bit. I dati sono nel profilo utente (`%APPDATA%\Semantica in Gioco`).

## Linux

I pacchetti Linux non sono inclusi nella release 1.2.0 (restano alla 1.0.0). Si rigenerano con `npm run dist:linux`.

**AppImage (consigliato)**
```bash
chmod +x semantica-in-gioco-1.2.0-linux-amd64.AppImage
./semantica-in-gioco-1.2.0-linux-amd64.AppImage
```
Su alcune distribuzioni serve `libfuse2` (`sudo apt install libfuse2`). Se il sandbox di Chromium viene bloccato dal kernel, avvia con `--no-sandbox` solo come ultima risorsa e in un ambiente fidato.

**Debian/Ubuntu**
```bash
sudo apt install ./semantica-in-gioco-1.2.0-linux-amd64.deb
```
L'app compare nel menu delle applicazioni. Rimozione: `sudo apt remove semantica-in-gioco`.

Requisiti: distribuzione x64 o arm64 con GLIBC recente. Dati in `~/.config/Semantica in Gioco`.

## ChromeOS e Android

Né ChromeOS né Android eseguono `.dmg`, `.exe` o AppImage. Su entrambi la via supportata è la **PWA**; sui Chromebook che supportano Linux si può usare anche il pacchetto **.deb**. Non esiste un pacchetto Android nativo: Electron non produce APK e in questo progetto non c'è un contenitore Capacitor/TWA.

**PWA (tutti i Chromebook)**
1. Pubblica il contenuto di `dist/` (o scompatta `semantica-in-gioco-1.2.0-web.zip`) su un hosting **HTTPS**: GitHub Pages, Cloudflare Pages, Netlify, un server scolastico. In locale funziona anche `http://localhost`.
2. Apri l'indirizzo in Chrome sul Chromebook.
3. Menu ⋮ → **Installa Semantica in Gioco** (o l'icona di installazione nella barra degli indirizzi).
4. L'app si apre in una finestra propria, compare nel launcher e funziona **offline** dopo la prima visita, grazie al service worker.

Per l'uso in classe senza internet: pubblica la build su un server della rete locale con HTTPS valido, oppure installa la PWA una volta con rete e poi lavora offline.

**Linux su ChromeOS (Crostini)**
1. *Impostazioni → Informazioni su ChromeOS → Sviluppatori → Ambiente di sviluppo Linux*.
2. Nel terminale Linux: `sudo apt install ./semantica-in-gioco-1.2.0-linux-arm64.deb` sui Chromebook ARM, `-amd64.deb` sui modelli Intel.
3. Avvia dal launcher di ChromeOS.

**Android (tablet e telefoni)**
1. Pubblica `semantica-in-gioco-1.2.0-web.zip` (o `dist/`) su un hosting **HTTPS**.
2. Apri l'indirizzo in Chrome su Android.
3. Menu ⋮ → **Aggiungi a schermata Home** / **Installa app**.
4. L'app parte a schermo intero e funziona offline dopo la prima visita.

## Dati, backup e privacy

L'app desktop non invia nulla in rete tranne la richiesta HTTPS all'API delle release GitHub per cercare aggiornamenti: in quella richiesta non vengono inviati profili, tentativi, immagini o registrazioni. I contenuti e i dati restano nel profilo locale dell'app. La cartella dei dati è separata da quella del browser, quindi un backup esportato dalla PWA non compare automaticamente nella versione desktop: usa **Area adulti → Dati e report → Esporta backup JSON** e importalo nell'altra versione. La cancellazione avviene dalla stessa scheda ed è effettiva.

## Ricostruire i pacchetti

```bash
npm install
npm run dist:mac:arm    # DMG + ZIP per Apple Silicon
npm run dist:win:x64    # installer NSIS + ZIP per Windows x64
npm run dist:mac        # DMG + ZIP arm64 e x64
npm run dist:win        # installer NSIS + ZIP x64
npm run dist:linux      # AppImage, deb, tar.gz (arm64 e x64)
npm run build:web       # build statica senza voce neurale
npm run start:desktop   # build + avvio Electron senza pacchettizzare
```

Su macOS, per personalizzare le risorse dell'eseguibile Windows serve wine. In questa macchina si trova dentro Wineskin:

```bash
WINE_BIN="$HOME/Applications/Wineskin/CabriPlus.app/Contents/SharedSupport/wine/bin/wine64"
mkdir -p /tmp/winebin && ln -sf "$WINE_BIN" /tmp/winebin/wine
export PATH="/tmp/winebin:$PATH" WINEPREFIX=/tmp/wineprefix-sg WINEDEBUG=-all
npm run dist:win:x64
```

Il prefisso in `/tmp` evita di toccare quello usato dalle app Wineskin dell'utente.

## Limiti noti dei pacchetti

- **Nessuna firma digitale**: macOS e Windows mostrano avvisi; per distribuire senza avvisi servono certificati Apple Developer ID e un certificato di code signing Windows. L'aggiornamento automatico apre l'installer, ma non può evitare questi avvisi.
- **Integrità dell'aggiornamento**: il file arriva via HTTPS dall'API GitHub con il nome atteso per piattaforma e architettura, ma non c'è ancora un controllo di un checksum pubblicato nella release. Va aggiunto prima di considerare l'aggiornamento resistente a manomissioni dell'hosting.
- **Solo macOS arm64 e Windows x64 sono nella release 1.2.0**: gli altri pacchetti restano alla 1.0.0 finché non vengono rigenerati.
- **Windows non è stato avviato su un sistema reale** in questa sessione: l'installer è stato costruito e controllato nel formato, ma va provato su una macchina Windows prima della distribuzione.
- **Android non ha un pacchetto nativo**: si installa la PWA da Chrome. Un `.apk` richiederebbe Android SDK e un contenitore Capacitor/TWA.
- ChromeOS richiede HTTPS per l'installazione PWA; aprire il file `index.html` da disco non installa l'app.
- L'app desktop serve la propria build tramite un protocollo interno (`app://bundle`), non da `file://`: è ciò che permette il caricamento dei moduli e il funzionamento dell'interfaccia.
