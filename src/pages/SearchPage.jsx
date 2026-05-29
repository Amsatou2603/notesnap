import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import NoteCard from '../components/NoteCard/NoteCard'
import EmptyState from '../components/EmptyState/EmptyState'
import ShareSheet from '../components/ShareSheet/ShareSheet'
import { useNotes } from '../hooks/useNotes'
import { useFolders } from '../hooks/useFolders'
import { useSearch } from '../hooks/useSearch'

/**
 * SearchPage — Page de recherche avancée
 *
 * Affiche :
 * - Barre de recherche avec focus automatique
 * - Filtres par dossier
 * - Filtres par priorité
 * - Filtres par tags
 * - Options de tri
 * - Résultats en temps réel avec mise en évidence
 */
export default function SearchPage() {
  const navigate = useNavigate()
  const { notes, loading, deleteNote } = useNotes()
  const { folders } = useFolders()
  
  const [shareSheetNote, setShareSheetNote] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedPriority, setSelectedPriority] = useState(null)
  const [selectedTags, setSelectedTags] = useState([])
  const filtersRef = useRef(null)
  const searchInputRef = useRef(null)

  const {
    query,
    setQuery,
    results,
    allTags,
    isEmpty,
    isSearching,
    hasFilters,
    activeFolderId,
    activePriority,
    activeTags,
    activeSort,
    setActiveFolderId,
    setActivePriority,
    setActiveTags,
    toggleTag,
    resetSearch,
    setActiveSort,
    SORT_OPTIONS
  } = useSearch(notes, { debounceMs: 300 })

  // Focus automatique sur la recherche au montage
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Synchroniser les filtres locaux avec le hook
  useEffect(() => {
    setActiveFolderId(selectedFolder?.id ?? undefined)
  }, [selectedFolder, setActiveFolderId])

  useEffect(() => {
    setActivePriority(selectedPriority)
  }, [selectedPriority, setActivePriority])

  useEffect(() => {
    setActiveTags(selectedTags)
  }, [selectedTags, setActiveTags])

  // Gérer le clic en dehors des filtres
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNoteClick = (note) => {
    navigate(`/note/${note.id}`)
  }

  const handleEditNote = (note) => {
    navigate(`/note/${note.id}/edit`)
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

  const handleTagToggle = (tag) => {
    toggleTag(tag)
    setSelectedTags(prev => {
      const tagLower = tag.toLowerCase()
      if (prev.some(t => t.toLowerCase() === tagLower)) {
        return prev.filter(t => t.toLowerCase() !== tagLower)
      }
      return [...prev, tag]
    })
  }

  const handleClearFilters = () => {
    setSelectedFolder(null)
    setSelectedPriority(null)
    setSelectedTags([])
    resetSearch()
  }

  const handleSortChange = (sortOption) => {
    setActiveSort(sortOption)
  }

  const getSortLabel = () => {
    switch (activeSort) {
      case SORT_OPTIONS.UPDATED_DESC:
        return 'Plus récent'
      case SORT_OPTIONS.UPDATED_ASC:
        return 'Plus ancien'
      case SORT_OPTIONS.TITLE_ASC:
        return 'Titre A-Z'
      case SORT_OPTIONS.TITLE_DESC:
        return 'Titre Z-A'
      case SORT_OPTIONS.PRIORITY_DESC:
        return 'Priorité'
      default:
        return 'Plus récent'
    }
  }

  const getFolderForNote = (note) => {
    if (!note.folderId) return null
    return folders.find(f => f.id === note.folderId)
  }

  const activeFilterCount = [
    selectedFolder,
    selectedPriority,
    ...selectedTags
  ].filter(Boolean).length

  return (
    <Layout title="Recherche">
      <div className="search-page">
        {/* Barre de recherche principale */}
        <div className="search-header">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher des notes..."
              className="search-input"
              aria-label="Rechercher"
            />
            {query && (
              <button
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label="Effacer la recherche"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="search-actions">
            <button
              className={`filter-toggle ${hasFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-label="Filtres"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>

            <div className="sort-select">
              <select
                value={activeSort}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Trier par"
              >
                <option value={SORT_OPTIONS.UPDATED_DESC}>Plus récent</option>
                <option value={SORT_OPTIONS.UPDATED_ASC}>Plus ancien</option>
                <option value={SORT_OPTIONS.TITLE_ASC}>Titre A-Z</option>
                <option value={SORT_OPTIONS.TITLE_DESC}>Titre Z-A</option>
                <option value={SORT_OPTIONS.PRIORITY_DESC}>Priorité</option>
              </select>
            </div>
          </div>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="filters-panel" ref={filtersRef}>
            <div className="filters-header">
              <h3 className="filters-title">Filtres</h3>
              {hasFilters && (
                <button
                  className="filters-clear"
                  onClick={handleClearFilters}
                  aria-label="Effacer tous les filtres"
                >
                  Effacer tout
                </button>
              )}
            </div>

            {/* Filtre par dossier */}
            <div className="filter-section">
              <label className="filter-label">Dossier</label>
              <div className="filter-options">
                <button
                  className={`filter-option ${!selectedFolder ? 'active' : ''}`}
                  onClick={() => setSelectedFolder(null)}
                >
                  Tous les dossiers
                </button>
                <button
                  className={`filter-option ${selectedFolder?.id === null ? 'active' : ''}`}
                  onClick={() => setSelectedFolder({ id: null, name: 'Sans dossier' })}
                >
                  Sans dossier
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    className={`filter-option ${selectedFolder?.id === folder.id ? 'active' : ''}`}
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <span className="folder-icon" style={{ color: folder.color }}>
                      {folder.icon}
                    </span>
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre par priorité */}
            <div className="filter-section">
              <label className="filter-label">Priorité</label>
              <div className="filter-options">
                <button
                  className={`filter-option ${!selectedPriority ? 'active' : ''}`}
                  onClick={() => setSelectedPriority(null)}
                >
                  Toutes
                </button>
                {['high', 'medium', 'low'].map(priority => (
                  <button
                    key={priority}
                    className={`filter-option filter-option-${priority} ${selectedPriority === priority ? 'active' : ''}`}
                    onClick={() => setSelectedPriority(priority)}
                  >
                    {priority === 'high' && '🔴 Haute'}
                    {priority === 'medium' && '🟡 Moyenne'}
                    {priority === 'low' && '🟢 Basse'}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre par tags */}
            {allTags.length > 0 && (
              <div className="filter-section">
                <label className="filter-label">Étiquettes</label>
                <div className="filter-tags">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      className={`filter-tag ${selectedTags.some(t => t.toLowerCase() === tag.toLowerCase()) ? 'active' : ''}`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Indicateur de filtres actifs */}
        {hasFilters && !showFilters && (
          <div className="active-filters-bar">
            <div className="active-filters-list">
              {selectedFolder && (
                <span className="active-filter">
                  📁 {selectedFolder.name}
                  <button onClick={() => setSelectedFolder(null)} aria-label="Retirer">
                    ×
                  </button>
                </span>
              )}
              {selectedPriority && (
                <span className="active-filter">
                  ⚑ {selectedPriority === 'high' ? 'Haute' : selectedPriority === 'medium' ? 'Moyenne' : 'Basse'}
                  <button onClick={() => setSelectedPriority(null)} aria-label="Retirer">
                    ×
                  </button>
                </span>
              )}
              {selectedTags.map(tag => (
                <span key={tag} className="active-filter">
                  #{tag}
                  <button onClick={() => handleTagToggle(tag)} aria-label="Retirer">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button
              className="clear-filters-btn"
              onClick={handleClearFilters}
              aria-label="Effacer tous les filtres"
            >
              Effacer tout
            </button>
          </div>
        )}

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
            title={isSearching ? 'Aucun résultat' : 'Commencez votre recherche'}
            description={isSearching 
              ? 'Essayez d\'autres termes ou ajustez vos filtres' 
              : 'Tapez des mots-clés pour rechercher dans vos notes'}
            variant="search"
          />
        )}

        {/* Résultats */}
        {!loading && !isEmpty && (
          <>
            <div className="search-results-header">
              <p className="results-count">
                {results.length} résultat{results.length > 1 ? 's' : ''}
                {isSearching && ` pour "${query}"`}
              </p>
            </div>
            
            <div className="notes-grid">
              {results.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  folder={getFolderForNote(note)}
                  onClick={() => handleNoteClick(note)}
                  onEdit={() => handleEditNote(note)}
                  onDelete={() => handleDeleteNote(note)}
                  highlighted={isSearching}
                />
              ))}
            </div>
          </>
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
