import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import NoteCard from '../components/NoteCard/NoteCard'
import SearchBar from '../components/SearchBar/SearchBar'
import EmptyState from '../components/EmptyState/EmptyState'
import ShareSheet from '../components/ShareSheet/ShareSheet'
import { useNotes } from '../hooks/useNotes'
import { useFolders } from '../hooks/useFolders'
import { useSearch } from '../hooks/useSearch'
import { formatRelativeTime } from '../utils/dateUtils'
import { exportNoteToPDF, exportNotesListToPDF } from '../utils/exportUtils'

/**
 * FolderViewPage — Page de vue détaillée d'un dossier
 *
 * Affiche :
 * - Informations du dossier (nom, couleur, icône, nombre de notes)
 * - Liste des notes du dossier
 * - Recherche dans le dossier
 * - Tri des notes
 * - Actions groupées (export PDF)
 */
export default function FolderViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notes, loading, deleteNote } = useNotes()
  const { folders, getFolderById, deleteFolder, moveNotesToUncategorized } = useFolders()
  
  const [folder, setFolder] = useState(null)
  const [folderNotes, setFolderNotes] = useState([])
  const [shareSheetNote, setShareSheetNote] = useState(null)
  const [sortBy, setSortBy] = useState('updatedAt_desc')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const sortMenuRef = useRef(null)

  const { query, setQuery, results, isSearching, isEmpty, activeSort, setActiveSort, SORT_OPTIONS } = useSearch(folderNotes, {
    debounceMs: 300
  })

  // Charger le dossier
  useEffect(() => {
    const loadFolder = async () => {
      if (id && id !== 'uncategorized') {
        try {
          const folderData = await getFolderById(Number(id))
          setFolder(folderData)
        } catch (err) {
          console.error('Erreur chargement dossier:', err)
          navigate('/folders')
        }
      }
    }
    loadFolder()
  }, [id, getFolderById, navigate])

  // Filtrer les notes du dossier
  useEffect(() => {
    if (id === 'uncategorized') {
      setFolderNotes(notes.filter(n => !n.folderId))
    } else if (folder) {
      setFolderNotes(notes.filter(n => n.folderId === folder.id))
    }
  }, [notes, folder, id])

  // Gérer le clic en dehors du menu de tri
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateNote = () => {
    navigate('/note/new')
  }

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

  const handleDeleteFolder = async () => {
    if (!folder) return

    const noteCount = folderNotes.length
    let confirmMessage = `Supprimer le dossier "${folder.name}" ?`
    
    if (noteCount > 0) {
      confirmMessage = `Ce dossier contient ${noteCount} note${noteCount > 1 ? 's' : ''}.\n\nVoulez-vous :\n1. Supprimer le dossier et toutes ses notes\n2. Déplacer les notes vers "Sans dossier" et supprimer le dossier`
      
      const choice = confirm(confirmMessage + '\n\nCliquez sur OK pour supprimer tout, ou Annuler pour déplacer les notes.')
      
      if (!choice) {
        // Déplacer les notes
        try {
          await moveNotesToUncategorized(folder.id)
          await deleteFolder(folder.id)
          navigate('/folders')
        } catch (err) {
          alert(`Erreur : ${err.message}`)
        }
        return
      }
    } else {
      if (!confirm(confirmMessage)) {
        return
      }
    }

    try {
      const { deleteNotesByFolder } = useNotes()
      await deleteNotesByFolder(folder.id)
      await deleteFolder(folder.id)
      navigate('/folders')
    } catch (err) {
      alert(`Erreur lors de la suppression : ${err.message}`)
    }
  }

  const handleExportPDF = async () => {
    try {
      const folderToExport = id === 'uncategorized' ? { name: 'Sans dossier', id: null } : folder
      await exportNotesListToPDF(folderNotes, folders, {
        title: folderToExport.name,
        subtitle: `${folderNotes.length} note${folderNotes.length > 1 ? 's' : ''}`
      })
    } catch (err) {
      alert(`Erreur lors de l'export PDF : ${err.message}`)
    }
  }

  const handleSortChange = (sortOption) => {
    setActiveSort(sortOption)
    setShowSortMenu(false)
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

  const folderName = id === 'uncategorized' ? 'Sans dossier' : (folder?.name || 'Dossier')
  const folderColor = id === 'uncategorized' ? '#606080' : (folder?.color || '#6C63FF')
  const folderIcon = id === 'uncategorized' ? '📄' : (folder?.icon || '📁')

  return (
    <Layout title={folderName}>
      <div className="folder-view-page">
        {/* En-tête du dossier */}
        <div className="folder-header" style={{ '--folder-color': folderColor }}>
          <div className="folder-info">
            <div className="folder-icon-badge" style={{ backgroundColor: folderColor }}>
              <span className="folder-icon">{folderIcon}</span>
            </div>
            <div className="folder-details">
              <h1 className="folder-name">{folderName}</h1>
              <p className="folder-meta">
                {folderNotes.length} note{folderNotes.length > 1 ? 's' : ''}
                {folder && folder.createdAt && ` • Créé ${formatRelativeTime(folder.createdAt)}`}
              </p>
            </div>
          </div>
          
          <div className="folder-actions">
            <button
              className="btn-icon"
              onClick={handleExportPDF}
              title="Exporter en PDF"
              aria-label="Exporter en PDF"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            
            {id !== 'uncategorized' && (
              <button
                className="btn-icon btn-icon-danger"
                onClick={handleDeleteFolder}
                title="Supprimer le dossier"
                aria-label="Supprimer le dossier"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Barre de recherche et tri */}
        <div className="folder-toolbar">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={`Rechercher dans ${folderName}...`}
            autoFocus={false}
          />
          
          <div className="sort-wrapper" ref={sortMenuRef}>
            <button
              className="sort-button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              aria-expanded={showSortMenu}
              aria-haspopup="true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="16" y2="12" />
                <line x1="4" y1="18" x2="12" y2="18" />
              </svg>
              <span>{getSortLabel()}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`chevron ${showSortMenu ? 'open' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            
            {showSortMenu && (
              <div className="sort-menu">
                <button
                  className={`sort-option ${activeSort === SORT_OPTIONS.UPDATED_DESC ? 'active' : ''}`}
                  onClick={() => handleSortChange(SORT_OPTIONS.UPDATED_DESC)}
                >
                  Plus récent
                </button>
                <button
                  className={`sort-option ${activeSort === SORT_OPTIONS.UPDATED_ASC ? 'active' : ''}`}
                  onClick={() => handleSortChange(SORT_OPTIONS.UPDATED_ASC)}
                >
                  Plus ancien
                </button>
                <button
                  className={`sort-option ${activeSort === SORT_OPTIONS.TITLE_ASC ? 'active' : ''}`}
                  onClick={() => handleSortChange(SORT_OPTIONS.TITLE_ASC)}
                >
                  Titre A-Z
                </button>
                <button
                  className={`sort-option ${activeSort === SORT_OPTIONS.TITLE_DESC ? 'active' : ''}`}
                  onClick={() => handleSortChange(SORT_OPTIONS.TITLE_DESC)}
                >
                  Titre Z-A
                </button>
                <button
                  className={`sort-option ${activeSort === SORT_OPTIONS.PRIORITY_DESC ? 'active' : ''}`}
                  onClick={() => handleSortChange(SORT_OPTIONS.PRIORITY_DESC)}
                >
                  Priorité
                </button>
              </div>
            )}
          </div>
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
            title={isSearching ? 'Aucun résultat' : 'Aucune note dans ce dossier'}
            description={isSearching 
              ? 'Essayez d\'autres termes de recherche' 
              : 'Créez votre première note dans ce dossier'}
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

        {/* Liste des notes */}
        {!loading && !isEmpty && (
          <div className="notes-grid">
            {results.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                folder={folder}
                onClick={() => handleNoteClick(note)}
                onEdit={() => handleEditNote(note)}
                onDelete={() => handleDeleteNote(note)}
                highlighted={isSearching}
              />
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
            folder={folder}
            onClose={() => setShareSheetNote(null)}
          />
        )}
      </div>
    </Layout>
  )
}
