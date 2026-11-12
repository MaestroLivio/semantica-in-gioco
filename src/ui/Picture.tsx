import type { ReactNode } from 'react'

export type PictureState = 'neutral' | 'correct' | 'wrong' | 'dimmed'

interface PictureProps {
  src?: string
  alt: string
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg' | 'hero'
  state?: PictureState
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  scanned?: boolean
  badge?: ReactNode
  className?: string
}

/**
 * Stimolo visivo con etichetta opzionale. L'immagine è sempre accompagnata da
 * un testo alternativo: lo stato non è comunicato solo dal colore, ma anche
 * da un contorno e da un'icona.
 */
export function Picture({
  src,
  alt,
  label,
  showLabel = false,
  size = 'md',
  state = 'neutral',
  selected = false,
  onClick,
  disabled,
  scanned,
  badge,
  className = '',
}: PictureProps) {
  const classes = [
    'picture',
    `picture--${size}`,
    selected ? 'is-selected' : '',
    state !== 'neutral' ? `is-${state}` : '',
    scanned ? 'is-scanned' : '',
    onClick ? 'is-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <span className="picture__frame">
        {src ? <img src={src} alt={alt} loading="lazy" draggable={false} /> : <span className="picture__missing">Immagine non disponibile</span>}
        {selected && (
          <span className="picture__marker" aria-hidden="true">
            ✓
          </span>
        )}
        {state === 'correct' && (
          <span className="picture__marker picture__marker--correct" aria-hidden="true">
            ✓
          </span>
        )}
        {state === 'wrong' && (
          <span className="picture__marker picture__marker--wrong" aria-hidden="true">
            !
          </span>
        )}
        {badge}
      </span>
      {showLabel && label && <span className="picture__label">{label}</span>}
    </>
  )

  if (!onClick) {
    return (
      <figure className={classes} aria-label={alt}>
        {content}
      </figure>
    )
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={label ? `${label}. ${alt}` : alt}
      aria-pressed={selected}
    >
      {content}
    </button>
  )
}
