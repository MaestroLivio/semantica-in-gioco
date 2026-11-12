# Installazione — Semantica in Gioco 1.0.0

L'app nasce come PWA e viene distribuita anche come applicazione desktop autonoma (Electron), con la stessa interfaccia e gli stessi contenuti locali. Tutti i file sono in `release/`.

Nessun installer è firmato digitalmente: non ci sono certificati di code signing in questo progetto. Questo è il motivo degli avvisi di sistema descritti sotto; non indica un file corrotto. I pacchetti sono generati localmente da questa build.

## Riepilogo dei file

| File | Sistema | Note |
|---|---|---|
| `semantica-in-gioco-1.0.0-mac-arm64.dmg` | macOS Apple Silicon (M1–M4) | Trascina l'app in *Applicazioni* |
| `semantica-in-gioco-1.0.0-mac-x64.dmg` | macOS Intel | Trascina l'app in *Applicazioni* |
| `semantica-in-gioco-1.0.0-mac-arm64.zip` / `-mac-x64.zip` | macOS | Alternativa portatile al DMG |
| `semantica-in-gioco-1.0.0-windows-x64-installer.exe` | Windows 10/11 x64 | Installer NSIS, installazione per utente |
| `semantica-in-gioco-1.0.0-win-x64.zip` | Windows 10/11 x64 | Versione portatile, nessuna installazione |
| `semantica-in-gioco-1.0.0-linux-x86_64.AppImage` | Linux x64 | Un solo file, nessuna installazione |
| `semantica-in-gioco-1.0.0-linux-arm64.AppImage` | Linux ARM64 | Per Chromebook ARM in modalità Linux e dispositivi ARM |
| `semantica-in-gioco-1.0.0-linux-amd64.deb` | Debian/Ubuntu x64, Crostini x64 | `sudo apt install ./file.deb` |
| `semantica-in-gioco-1.0.0-linux-arm64.deb` | Debian/Ubuntu ARM64, Crostini ARM | `sudo apt install ./file.deb` |
| `semantica-in-gioco-1.0.0-linux-x64.tar.gz` / `-arm64.tar.gz` | Linux | Archivio portatile |
| `semantica-in-gioco-pwa.zip` | Qualsiasi browser, **ChromeOS**, **Android** | Build statica da pubblicare su HTTPS; su Android è l'unica via di installazione |

## macOS

1. Apri il DMG corrispondente al processore (Apple Silicon: `arm64`; Intel: `x64`).
2. Trascina **Semantica in Gioco** nella cartella *Applicazioni*.
3. Al primo avvio macOS blocca l'app non firmata. Apri *Impostazioni di Sistema → Privacy e sicurezza*, scorri fino al messaggio su Semantica in Gioco e scegli **Apri comunque**; in alternativa tasto destro sull'app → *Apri* → *Apri*.
4. Se l'app resta bloccata da Gatekeeper: `xattr -dr com.apple.quarantine "/Applications/Semantica in Gioco.app"`.

Requisiti: macOS 10.15 o successivo. I dati restano nel contenitore dell'app (`~/Library/Application Support/Semantica in Gioco`) e sono separati da quelli del browser.

## Windows

1. Esegui `semantica-in-gioco-1.0.0-windows-x64-installer.exe`.
2. Se compare SmartScreen: *Ulteriori informazioni* → *Esegui comunque* (l'installer non è firmato).
3. Scegli la cartella di installazione; vengono creati collegamenti su desktop e menu Start.
4. In alternativa scompatta `semantica-in-gioco-1.0.0-win-x64.zip` ed esegui `Semantica in Gioco.exe` senza installare nulla.
5. Per rimuovere l'app usa *Impostazioni → App → Semantica in Gioco → Disinstalla*.

Requisiti: Windows 10/11 a 64 bit. I dati sono nel profilo utente (`%APPDATA%\Semantica in Gioco`).

## Linux

**AppImage (consigliato)**
```bash
chmod +x semantica-in-gioco-1.0.0-linux-x86_64.AppImage
./semantica-in-gioco-1.0.0-linux-x86_64.AppImage
```
Su alcune distribuzioni serve `libfuse2` (`sudo apt install libfuse2`). Se il sandbox di Chromium viene bloccato dal kernel, avvia con `--no-sandbox` solo come ultima risorsa e in un ambiente fidato.

**Debian/Ubuntu**
```bash
sudo apt install ./semantica-in-gioco-1.0.0-linux-amd64.deb
```
L'app compare nel menu delle applicazioni. Rimozione: `sudo apt remove semantica-in-gioco`.

**Archivio portatile**
```bash
tar -xzf semantica-in-gioco-1.0.0-linux-x64.tar.gz
./semantica-in-gioco-1.0.0-linux-x64/semantica-in-gioco
```

Requisiti: distribuzione x64 o arm64 con GLIBC recente. Dati in `~/.config/Semantica in Gioco`.

## ChromeOS e Android

Né ChromeOS né Android eseguono `.dmg`, `.exe` o AppImage. Su entrambi la via supportata è la **PWA**; sui Chromebook che supportano Linux si può usare anche il pacchetto **.deb**. Non esiste un pacchetto Android nativo: Electron non produce APK e in questo progetto non c'è un contenitore Capacitor/TWA.

**PWA (tutti i Chromebook)**
1. Pubblica il contenuto di `dist/` (o scompatta `semantica-in-gioco-pwa.zip`) su un hosting **HTTPS**: Cloudflare Pages, GitHub Pages, Netlify, un server scolastico. In locale funziona anche `http://localhost`.
2. Apri l'indirizzo in Chrome sul Chromebook.
3. Menu ⋮ → **Installa Semantica in Gioco** (o l'icona di installazione nella barra degli indirizzi).
4. L'app si apre in una finestra propria, compare nel launcher e funziona **offline** dopo la prima visita, grazie al service worker.

Per l'uso in classe senza internet: pubblica la build su un server della rete locale con HTTPS valido, oppure installa la PWA una volta con rete e poi lavora offline.

**Linux su ChromeOS (Crostini)**
1. *Impostazioni → Informazioni su ChromeOS → Sviluppatori → Ambiente di sviluppo Linux*.
2. Nel terminale Linux: `sudo apt install ./semantica-in-gioco-1.0.0-linux-arm64.deb` sui Chromebook ARM, `-amd64.deb` sui modelli Intel.
3. Avvia dal launcher di ChromeOS.

**Android (tablet e telefoni)**
1. Pubblica `semantica-in-gioco-pwa.zip` (o `dist/`) su un hosting **HTTPS**.
2. Apri l'indirizzo in Chrome su Android.
3. Menu ⋮ → **Aggiungi a schermata Home** / **Installa app**.
4. L'app parte a schermo intero e funziona offline dopo la prima visita.

Non esiste un file `.apk` da installare: per distribuirlo fuori dal Play Store servirebbe un progetto Capacitor o una Trusted Web Activity, che richiedono Android SDK e, per la TWA, un dominio HTTPS pubblicato. Se serve, si può aggiungere in un secondo momento senza cambiare l'app web.

## Dati, backup e privacy

L'app desktop non invia nulla in rete: contenuti, profili, tentativi e registrazioni restano nel profilo locale dell'app. La cartella dei dati è separata da quella del browser, quindi un backup esportato dalla PWA non compare automaticamente nella versione desktop: usa **Area adulti → Dati e report → Esporta backup JSON** e importalo nell'altra versione. La cancellazione avviene dalla stessa scheda ed è effettiva.

## Ricostruire i pacchetti

```bash
npm install
npm run dist:mac     # DMG + ZIP arm64 e x64
npm run dist:win     # installer NSIS + ZIP x64
npm run dist:linux   # AppImage, deb, tar.gz (arm64 e x64)
npm run pack:pwa     # release/semantica-in-gioco-pwa.zip
npm run start:desktop  # build + avvio Electron senza pacchettizzare
```

Su macOS, per personalizzare le risorse dell'eseguibile Windows serve wine. In questa macchina si trova dentro Wineskin:

```bash
WINE_BIN="$HOME/Applications/Wineskin/CabriPlus.app/Contents/SharedSupport/wine/bin/wine64"
mkdir -p /tmp/winebin && ln -sf "$WINE_BIN" /tmp/winebin/wine
export PATH="/tmp/winebin:$PATH" WINEPREFIX=/tmp/wineprefix-sg WINEDEBUG=-all
npm run dist:win
```

Il prefisso in `/tmp` evita di toccare quello usato dalle app Wineskin dell'utente.

## Limiti noti dei pacchetti

- **Nessuna firma digitale**: macOS e Windows mostrano avvisi; per distribuire senza avvisi servono certificati Apple Developer ID e un certificato di code signing Windows.
- **Nessun aggiornamento automatico**: le nuove versioni vanno installate manualmente.
- L'installer Windows di questa build è stato prodotto senza wine: electron-builder ha aggiornato le risorse dell'eseguibile con i propri strumenti e la firma è stata saltata. Il formato (PE32, NSIS) è stato verificato; l'icona e i metadati dell'eseguibile non sono stati ispezionati a video in questa sessione. Resta assente solo la firma digitale.
- **Android non ha un pacchetto nativo**: si installa la PWA da Chrome. Un `.apk` richiederebbe Android SDK e un contenitore Capacitor/TWA.
- Il pacchetto macOS è stato avviato e verificato a runtime (interfaccia caricata, immagini presenti, nessun errore). Windows e Linux sono stati costruiti e controllati nel formato e nel contenuto, ma non avviati su un sistema reale in questa sessione: resta consigliata una prova di installazione su ciascun sistema prima della distribuzione.
- ChromeOS richiede HTTPS per l'installazione PWA; aprire il file `index.html` da disco non installa l'app.
- L'app desktop serve la propria build tramite un protocollo interno (`app://bundle`), non da `file://`: è ciò che permette il caricamento dei moduli e il funzionamento dell'interfaccia.
