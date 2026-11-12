import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { StoreProvider } from './state/store'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root non trovato')

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)

// Service worker: l'app funziona offline dopo la prima visita.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // L'offline non è disponibile: l'app resta utilizzabile online.
    })
  })
}
