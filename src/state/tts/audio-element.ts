// Riproduzione di un blob audio con controllo di velocità e volume.
// `preservesPitch` evita che la modalità lenta trasformi la voce in un suono
// artificiale: cambia il ritmo, non il timbro.

export interface AudioPlayback {
  promise: Promise<void>
  stop: () => void
  duration: number
}

export function playAudioBlob(
  blob: Blob,
  options: { rate: number; volume: number; onStart?: () => void },
): AudioPlayback {
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.preload = 'auto'
  const rate = Math.min(1.6, Math.max(0.5, options.rate))
  audio.playbackRate = rate
  audio.volume = Math.min(1, Math.max(0, options.volume))
  // Su Safari/WebKit la proprietà ha un nome diverso.
  const withPitch = audio as HTMLAudioElement & { preservesPitch?: boolean; webkitPreservesPitch?: boolean }
  withPitch.preservesPitch = true
  withPitch.webkitPreservesPitch = true

  let settled = false
  let dispose = () => {}

  const promise = new Promise<void>((resolve) => {
    dispose = () => {
      if (settled) return
      settled = true
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.onended = () => dispose()
    audio.onerror = () => dispose()
    audio
      .play()
      .then(() => options.onStart?.())
      .catch(() => dispose())
  })

  return {
    promise,
    stop: () => dispose(),
    duration: Number.isFinite(audio.duration) ? audio.duration : 0,
  }
}
