import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initDatabase } from './db/database'

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
