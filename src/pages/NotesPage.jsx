import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import NoteCard from '../components/NoteCard/NoteCard'
import SearchBar from '../components/SearchBar/SearchBar'
import EmptyState from '../components/EmptyState/EmptyState'
import ShareSheet from '../components/ShareSheet/ShareSheet'
import { useNotes } from '../hooks/useNotes'
import { useFolders } from '../hooks/useFolders'
import { useSearch } from '../hooks/useSearch'
import { formatRelativeTime, groupByTimePeriod } from '../utils/dateUtils'

/**
 * NotesPage — Page d'accueil (Home)
 *
 * Affiche :
 * - Statistiques rapides
 * - Accès rapide aux dossiers
 * - Notes récentes groupées par période
 * - Barre de recherche
 * - FAB pour créer une nouvelle note
 */
export default function NotesPage() {
  const navigate = useNavigate()
  const { notes, loading, createNote, deleteNote } = useNotes()
  const { folders } = useFolders()
  const { query, setQuery, results, isSearching, isEmpty, resetSearch } = useSearch(notes)

  const [shareSheetNote, setShareSheetNote] = useState(null)
  const [showRecentOnly, setShowRecentOnly] = useState(false)

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalNotes = notes.length
    const totalFolders = folders.length
    const uncategorizedNotes = notes.filter(n => !n.folderId).length
    const highPriorityNotes = notes.filter(n => n.priority === 'high').length
    const notesWithPhotos = notes.filter(n => n.photos && n.photos.length > 0).length
    
    return {
      totalNotes,
      totalFolders,
      uncategorizedNotes,
      highPriorityNotes,
      notesWithPhotos
    }
  }, [notes, folders])

  // Dossiers récents (avec le plus de notes)
  const recentFolders = useMemo(() => {
    const folderCounts = {}
    notes.forEach(note => {
      if (note.folderId) {
        folderCounts[note.folderId] = (folderCounts[note.folderId] || 0) + 1
      }
    })
    
    return folders
      .map(folder => ({
        ...folder,
        noteCount: folderCounts[folder.id] || 0
      }))
      .sort((a, b) => b.noteCount - a.noteCount)
      .slice(0, 4)
  }, [folders, notes])

  // Notes récentes (limitées à 6 pour l'accueil)
  const recentNotes = useMemo(() => {
    return notes
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 6)
  }, [notes])

  // Grouper les notes par période
  const groupedNotes = useMemo(() => {
    if (isSearching) {
      return { 'Résultats de recherche': results }
    }
    return groupByTimePeriod(results, 'updatedAt')
  }, [results, isSearching])

  const handleCreateNote = async () => {
    try {
      const id = await createNote({
        title: '',
        content: '',
        priority: 'none',
        tags: [],
        photos: []
      })
      navigate(`/note/${id}`)
    } catch (err) {
      alert(`Erreur lors de la création : ${err.message}`)
    }
  }

  const handleNoteClick = (note) => {
    navigate(`/note/${note.id}`)
  }

  const handleEditNote = (note) => {
    navigate(`/note/${note.id}`)
  }

  const handleDeleteNote = async (note) => {
    if (!confirm(`Supprimer la note "${note.title || 'Sans titre'}" ?`)) {
      return
    }

    try {
      await deleteNote(note.id)
    } catch (err) {
      alert(`Erreur lors de la suppression : ${err.message}`)
    }
  }

  const handleShare = (note) => {
    setShareSheetNote(note)
  }

  const handleFolderClick = (folder) => {
    navigate(`/folder/${folder.id}`)
  }

  const handleSearchClick = () => {
    navigate('/search')
  }

  const getFolderForNote = (note) => {
    if (!note.folderId) return null
    return folders.find(f => f.id === note.folderId)
  }

  const displayNotes = isSearching ? results : (showRecentOnly ? recentNotes : results)

  return (
    <Layout title="Accueil">
      <div className="home-page">
        {/* Statistiques rapides */}
        {!isSearching && !loading && stats.totalNotes > 0 && (
          <div className="home-stats">
            <div className="stat-card stat-card-primary" onClick={() => navigate('/folders')}>
              <span className="stat-number">{stats.totalNotes}</span>
              <span className="stat-label">Note{stats.totalNotes > 1 ? 's' : ''}</span>
            </div>
            <div className="stat-card" onClick={() => navigate('/folders')}>
              <span className="stat-number">{stats.totalFolders}</span>
              <span className="stat-label">Dossier{stats.totalFolders > 1 ? 's' : ''}</span>
            </div>
            {stats.highPriorityNotes > 0 && (
              <div className="stat-card stat-card-warning">
                <span className="stat-number">{stats.highPriorityNotes}</span>
                <span className="stat-label">Priorité haute</span>
              </div>
            )}
            {stats.uncategorizedNotes > 0 && (
              <div className="stat-card" onClick={() => navigate('/folder/uncategorized')}>
                <span className="stat-number">{stats.uncategorizedNotes}</span>
                <span className="stat-label">Sans dossier</span>
              </div>
            )}
          </div>
        )}

        {/* Accès rapide aux dossiers */}
        {!isSearching && !loading && recentFolders.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">Dossiers</h2>
              <button className="btn-link" onClick={() => navigate('/folders')}>
                Voir tout →
              </button>
            </div>
            <div className="folders-grid-compact">
              {recentFolders.map(folder => (
                <button
                  key={folder.id}
                  className="folder-quick-access"
                  onClick={() => handleFolderClick(folder)}
                  style={{ '--folder-color': folder.color }}
                >
                  <span className="folder-icon">{folder.icon}</span>
                  <span className="folder-name">{folder.name}</span>
                  <span className="folder-count">{folder.noteCount}</span>
                </button>
              ))}
              <button
                className="folder-quick-access folder-quick-access-add"
                onClick={() => navigate('/folders')}
              >
                <span className="folder-icon">+</span>
                <span className="folder-name">Gérer</span>
              </button>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="home-search-section">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une note..."
            autoFocus={false}
            onClick={handleSearchClick}
          />
          {!isSearching && !loading && stats.totalNotes > 0 && (
            <button
              className="toggle-recent"
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              aria-pressed={showRecentOnly}
            >
              {showRecentOnly ? 'Voir toutes les notes' : 'Voir les récentes'}
            </button>
          )}
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Chargement des notes...</p>
          </div>
        )}

        {/* Liste vide */}
        {!loading && isEmpty && (
          <EmptyState
            icon={isSearching ? '🔍' : '📝'}
            title={isSearching ? 'Aucun résultat' : 'Bienvenue sur NoteSnap'}
            description={isSearching 
              ? 'Essayez d\'autres termes de recherche' 
              : 'Créez votre première note pour commencer'}
            action={
              !isSearching && (
                <button className="btn-primary" onClick={handleCreateNote}>
                  Créer une note
                </button>
              )
            }
            variant="notes"
          />
        )}

        {/* Liste des notes groupées */}
        {!loading && !isEmpty && (
          <div className="notes-grouped">
            {Object.entries(groupedNotes).map(([period, periodNotes]) => (
              <div key={period} className="notes-period-section">
                <h3 className="period-title">{period}</h3>
                <div className="notes-grid">
                  {periodNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      folder={getFolderForNote(note)}
                      onClick={() => handleNoteClick(note)}
                      onEdit={() => handleEditNote(note)}
                      onDelete={() => handleDeleteNote(note)}
                      onShare={() => handleShare(note)}
                      highlighted={isSearching}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAB */}
        {!loading && (
          <button className="fab" onClick={handleCreateNote} aria-label="Créer une note">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}

        {/* ShareSheet */}
        {shareSheetNote && (
          <ShareSheet
            note={shareSheetNote}
            folder={getFolderForNote(shareSheetNote)}
            onClose={() => setShareSheetNote(null)}
          />
        )}
      </div>
    </Layout>
  )
}
