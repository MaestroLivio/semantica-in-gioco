import { isValidElement, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { speak, stopSpeaking } from '../state/speech'
import { Icon, type IconName } from './icons'
import { useI18n } from '../i18n'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

// Icona dedotta dall'etichetta: così ogni pulsante dell'app ha un simbolo
// coerente anche quando non viene specificato esplicitamente. La proprietà
// `icon` permette di sceglierne uno più preciso quando serve.
const ICON_RULES: { pattern: RegExp; icon: IconName }[] = [
  { pattern: /ascolta|riproduci|pronuncia|parla|voce/i, icon: 'listen' },
  { pattern: /simboli/i, icon: 'grid' },
  { pattern: /ferma|stop/i, icon: 'stop' },
  { pattern: /registra|microfono/i, icon: 'mic' },
  { pattern: /aiuto|indizio|suggeriment/i, icon: 'help' },
  { pattern: /passa|salta/i, icon: 'skip' },
  { pattern: /riprova|ricomincia|ripasso|riprendi|ancora/i, icon: 'retry' },
  { pattern: /chiudi|annulla/i, icon: 'close' },
  { pattern: /indietro|precedent|torna|esci/i, icon: 'back' },
  { pattern: /avanti|successiv|continua/i, icon: 'next' },
  { pattern: /elimina|cancella|pulisci|butta/i, icon: 'trash' },
  { pattern: /esporta|scarica|csv|importa/i, icon: 'download' },
  { pattern: /stampa/i, icon: 'print' },
  { pattern: /mappa|atlante|percors/i, icon: 'map' },
  { pattern: /storia|storie|raccont|contenut|material/i, icon: 'book' },
  { pattern: /accessibilit|impostazioni|opzioni/i, icon: 'settings' },
  { pattern: /adulti|blocca|pin/i, icon: 'lock' },
  { pattern: /riepilogo|progress|statistic/i, icon: 'star' },
  { pattern: /info|informazioni|licen/i, icon: 'help' },
  { pattern: /nuovo|aggiungi|crea/i, icon: 'plus' },
  { pattern: /profilo/i, icon: 'user' },
  { pattern: /taccuino|nota|osservazion/i, icon: 'pencil' },
  { pattern: /conferma|accetta|salva|entra|detto|fatto|concludi/i, icon: 'check' },
  { pattern: /inizia|gioca|leggi|apri|vedi|esplora|vai|bambino/i, icon: 'play' },
]

function labelText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(labelText).join(' ')
  if (isValidElement<{ children?: ReactNode }>(node)) return labelText(node.props.children)
  return ''
}

function iconForLabel(text: string): IconName | undefined {
  return ICON_RULES.find((rule) => rule.pattern.test(text))?.icon
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  ariaLabel,
  title,
  type = 'button',
  className = '',
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  ariaLabel?: string
  title?: string
  type?: 'button' | 'submit'
  className?: string
  icon?: IconName
}) {
  const resolvedIcon = icon ?? iconForLabel(labelText(children))
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${resolvedIcon ? 'btn--with-icon' : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
    >
      {resolvedIcon && (
        <span className="btn__icon" aria-hidden="true">
          <Icon name={resolvedIcon} />
        </span>
      )}
      <span className="btn__label">{children}</span>
    </button>
  )
}

export function SpeakButton({
  text,
  rate,
  volume,
  voiceURI,
  label,
  size = 'md',
}: {
  text: string
  rate?: number
  volume?: number
  voiceURI?: string | null
  label?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const { t } = useI18n()
  const resolvedLabel = label ?? t('common.repeat')
  return (
    <Btn
      variant="secondary"
      size={size}
      ariaLabel={resolvedLabel}
      title={resolvedLabel}
      onClick={() => speak(text, { rate, volume, voiceURI })}
      className="speak-button"
      icon="listen"
    >
      <span className="speak-button__text">{t('common.listen')}</span>
    </Btn>
  )
}

export function SpeakInline({
  text,
  rate,
  volume,
  voiceURI,
  label,
  className = '',
}: {
  text: string
  rate?: number
  volume?: number
  voiceURI?: string | null
  label?: string
  className?: string
}) {
  const spoken = text.replace(/\s+/g, ' ').trim()
  const { t } = useI18n()
  const resolvedLabel = label ?? `${t('common.listen')}: ${spoken}`
  return (
    <button
      type="button"
      className={`speak-inline ${className}`.trim()}
      aria-label={resolvedLabel}
      title={resolvedLabel}
      onClick={(event) => {
        event.stopPropagation()
        speak(spoken, { rate, volume, voiceURI })
      }}
    >
      <Icon name="listen" />
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint?: string
}) {
  const id = useId()
  return (
    <div className="toggle">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <label htmlFor={id}>
        <span className="toggle__label">{label}</span>
        {hint && (
          <span className="toggle__hint" id={`${id}-hint`}>
            {hint}
          </span>
        )}
      </label>
    </div>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  describedBy,
}: {
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (value: T) => void
  label: string
  describedBy?: string
}) {
  const id = useId()
  return (
    <fieldset className="segmented" aria-describedby={describedBy}>
      <legend id={id}>{label}</legend>
      <div className="segmented__options" role="radiogroup" aria-labelledby={id}>
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={opt.value === value}
            title={opt.hint}
            className={`segmented__option ${opt.value === value ? 'is-active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function Range({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  format,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label: string
  format?: (value: number) => string
}) {
  const id = useId()
  return (
    <div className="range">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={format ? format(value) : String(value)}
      />
      <output htmlFor={id}>{format ? format(value) : value}</output>
    </div>
  )
}

export function Feedback({ status, children }: { status: 'correct' | 'retry' | 'info'; children: ReactNode }) {
  return (
    <div className={`feedback feedback--${status}`} role="status" aria-live="polite">
      <span className="feedback__icon" aria-hidden="true">
        {status === 'correct' ? '★' : status === 'retry' ? '↺' : 'ℹ'}
      </span>
      <div className="feedback__text">{children}</div>
    </div>
  )
}

export function Progress({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <div className="progress">
      <div className="progress__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total} aria-label={label}>
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress__label">
        {value} / {total}
      </span>
    </div>
  )
}

export function Card({ children, className = '', as = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'article' | 'div' }) {
  const Tag = as
  return <Tag className={`card ${className}`.trim()}>{children}</Tag>
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal ${wide ? 'modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2>{title}</h2>
          <Btn variant="ghost" size="sm" onClick={onClose} ariaLabel={t('common.close')}>
            ✕
          </Btn>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

/** Evidenziazione a scansione: utile con sensori, interruttori o tastiera. */
export function useScan(enabled: boolean, count: number, onActivate: (index: number) => void, intervalMs = 1800) {
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  indexRef.current = index

  useEffect(() => {
    if (!enabled || count === 0) return
    setIndex(0)
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, intervalMs)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onActivate(indexRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [enabled, count, intervalMs, onActivate])

  return enabled ? index : -1
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {children && <div>{children}</div>}
    </div>
  )
}

/** Lettura vocale controllata: interrompe la precedente e supporta la ripetizione. */
export function useAutoSpeak(text: string | undefined, options: { enabled: boolean; rate?: number; volume?: number; voiceURI?: string | null }) {
  const { enabled, rate, volume, voiceURI } = options
  useEffect(() => {
    if (!enabled || !text) return
    const timer = window.setTimeout(() => speak(text, { rate, volume, voiceURI }), 250)
    return () => {
      window.clearTimeout(timer)
      stopSpeaking()
    }
  }, [text, enabled, rate, volume, voiceURI])
}
