import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import SplashScreen from './components/SplashScreen'
import NotesPage from './pages/NotesPage'
import FoldersPage from './pages/FoldersPage'
import SettingsPage from './pages/SettingsPage'
import NoteEditorPage from './pages/NoteEditorPage'
import FolderViewPage from './pages/FolderViewPage'
import NoteDetailPage from './pages/NoteDetailPage'
import SearchPage from './pages/SearchPage'

/**
 * App.jsx — Point d'entrée de l'application NoteSnap
 *
 * Phase 3 : Navigation complète avec React Router
 * - Page d'accueil (Home)
 * - Page des dossiers
 * - Page de vue détaillée d'un dossier
 * - Page de recherche avancée
 * - Page des paramètres
 * - Éditeur de notes
 * - Page de lecture seule d'une note
 */
function AppContent() {
  // Initialise le thème global (dark par défaut, persisté dans localStorage)
  useTheme()

  return (
    <Routes>
      {/* Page d'accueil */}
      <Route path="/" element={<NotesPage />} />
      
      {/* Dossiers */}
      <Route path="/folders" element={<FoldersPage />} />
      <Route path="/folder/:id" element={<FolderViewPage />} />
      <Route path="/folder/uncategorized" element={<FolderViewPage />} />
      
      {/* Recherche */}
      <Route path="/search" element={<SearchPage />} />
      
      {/* Notes */}
      <Route path="/note/new" element={<NoteEditorPage />} />
      <Route path="/note/:id" element={<NoteDetailPage />} />
      <Route path="/note/:id/edit" element={<NoteEditorPage />} />
      
      {/* Paramètres */}
      <Route path="/settings" element={<SettingsPage />} />
      
      {/* Route par défaut */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </>
  )
}

export default App
