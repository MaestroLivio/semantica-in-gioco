import type { ReactNode } from 'react'

// Icone disegnate localmente: nessuna dipendenza, nessuna richiesta di rete e
// forme leggibili anche a dimensione ridotta. Ogni icona è decorativa perché
// il testo del pulsante resta sempre presente e accessibile.

export type IconName =
  | 'listen'
  | 'play'
  | 'next'
  | 'back'
  | 'help'
  | 'skip'
  | 'retry'
  | 'check'
  | 'close'
  | 'home'
  | 'star'
  | 'book'
  | 'map'
  | 'settings'
  | 'plus'
  | 'user'
  | 'lock'
  | 'download'
  | 'trash'
  | 'save'
  | 'print'
  | 'search'
  | 'grid'
  | 'shuffle'
  | 'mic'
  | 'stop'
  | 'pencil'

const ICONS: Record<IconName, ReactNode> = {
  listen: (
    <>
      <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4z" />
      <path d="M16 8.5a5 5 0 0 1 0 7" />
      <path d="M18.8 6a9 9 0 0 1 0 12" />
    </>
  ),
  play: <path d="M8 5.5 19 12 8 18.5z" fill="currentColor" stroke="none" />,
  next: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  back: (
    <>
      <path d="M20 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.2a2.8 2.8 0 1 1 4.1 2.5c-.8.45-1.1 1-1.1 1.9" />
      <path d="M12.1 17h.01" />
    </>
  ),
  skip: (
    <>
      <path d="M6 5.5 15 12l-9 6.5z" fill="currentColor" stroke="none" />
      <path d="M18 5v14" />
    </>
  ),
  retry: (
    <>
      <path d="M20 11a8 8 0 1 0-.7 4.5" />
      <path d="M20 4v5h-5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6.5 9.5V20h11V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  star: (
    <path
      d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z"
      fill="currentColor"
      stroke="none"
    />
  ),
  book: (
    <>
      <path d="M4 5.5c3-1 5.3-.4 8 1.2v13c-2.7-1.6-5-2.2-8-1.2z" />
      <path d="M20 5.5c-3-1-5.3-.4-8 1.2v13c2.7-1.6 5-2.2 8-1.2z" />
    </>
  ),
  map: (
    <>
      <path d="m3.5 6.5 5-2 7 2 5-2v13l-5 2-7-2-5 2z" />
      <path d="M8.5 4.5v13" />
      <path d="M15.5 6.5v13" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <path d="M4 17h4" />
      <path d="M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.3 3.6-5 7-5s6.2 1.7 7 5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 20h14" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h7V4" />
      <path d="M8 20v-6h8v6" />
    </>
  ),
  print: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7" rx="1.5" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </>
  ),
  shuffle: (
    <>
      <path d="M4 7h3l10 10h3" />
      <path d="m17 14 3 3-3 3" />
      <path d="M4 17h3l10-10h3" />
      <path d="m17 4 3 3-3 3" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />,
  pencil: (
    <>
      <path d="m4 20 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" />
      <path d="M14 7l3 3" />
    </>
  ),
}

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  )
}
