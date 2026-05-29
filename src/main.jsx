import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initDatabase } from './db/database'

// Enregistrement du service worker pour PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const { Workbox } = await import('workbox-window')
      const wb = new Workbox('/sw.js')
      
      // Écouter les mises à jour du service worker
      wb.addEventListener('waiting', (event) => {
        // Une nouvelle version est disponible
        if (confirm('Une nouvelle version de NoteSnap est disponible. Voulez-vous mettre à jour maintenant ?')) {
          wb.addEventListener('controlling', () => {
            window.location.reload()
          })
          event.wb.messageSkipWaiting()
        }
      })
      
      // Enregistrer le service worker
      await wb.register()
      console.log('[NoteSnap] Service worker enregistré avec succès')
    } catch (err) {
      console.error('[NoteSnap] Erreur d\'enregistrement du service worker :', err)
    }
  })
}

// Initialisation de la base de données IndexedDB avant le rendu
initDatabase().catch(err => {
  console.error('[NoteSnap] Erreur critique de base de données :', err)
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('[NoteSnap] Élément #root introuvable dans le DOM.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
