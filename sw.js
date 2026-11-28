/* Service worker di Semantica in Gioco.
   Offline dopo la prima visita: la app shell e i pittogrammi già visti
   restano disponibili. Nessuna richiesta viene inviata a servizi esterni. */

const VERSION = 'sig-v2'
const SHELL = 'sig-shell-' + VERSION
const MEDIA = 'sig-media-' + VERSION
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL && key !== MEDIA).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function isMedia(url) {
  return /\/pictograms\/[^/]+\.(png|svg|webp)$/.test(url.pathname) || /\/icons\//.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html'))),
    )
    return
  }

  if (isMedia(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(MEDIA).then((cache) => cache.put(request, copy))
            return response
          }),
      ),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(MEDIA).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
