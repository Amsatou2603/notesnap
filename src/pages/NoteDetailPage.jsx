import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import ShareSheet from '../components/ShareSheet/ShareSheet'
import { useNotes } from '../hooks/useNotes'
import { useFolders } from '../hooks/useFolders'
import { formatRelativeTime, formatDateLong } from '../utils/dateUtils'
import { exportNoteToPDF, exportNoteToText } from '../utils/exportUtils'

/**
 * NoteDetailPage — Page de lecture seule d'une note
 *
 * Affiche :
 * - Contenu complet de la note
 * - Métadonnées (dates, dossier, tags, priorité)
 * - Galerie photos avec swipe horizontal
 * - Actions (éditer, supprimer, partager, exporter)
 */
export default function NoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notes, deleteNote, getNoteById } = useNotes()
  const { folders } = useFolders()
  
  const [note, setNote] = useState(null)
  const [folder, setFolder] = useState(null)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [photoOverlayOpen, setPhotoOverlayOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true)
        const noteData = id === 'new' ? null : await getNoteById(Number(id))
        if (noteData) {
          setNote(noteData)
          if (noteData.folderId) {
            const folderData = folders.find(f => f.id === noteData.folderId)
            setFolder(folderData || null)
          }
        } else {
          navigate('/')
        }
      } catch (err) {
        console.error('Erreur chargement note:', err)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    loadNote()
  }, [id, getNoteById, folders, navigate])

  const handleEdit = () => {
    navigate(`/note/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer la note "${note?.title || 'Sans titre'}" ?`)) {
      return
    }
    try {
      await deleteNote(Number(id))
      navigate(folder ? `/folder/${folder.id}` : '/')
    } catch (err) {
      alert(`Erreur lors de la suppression : ${err.message}`)
    }
  }

  const handleShare = () => {
    setShareSheetOpen(true)
  }

  const handleExportPDF = async () => {
    try {
      await exportNoteToPDF(note, folder)
    } catch (err) {
      alert(`Erreur lors de l'export PDF : ${err.message}`)
    }
  }

  const handleExportText = () => {
    try {
      exportNoteToText(note)
    } catch (err) {
      alert(`Erreur lors de l'export texte : ${err.message}`)
    }
  }

  const handlePhotoClick = (index) => {
    setCurrentPhotoIndex(index)
    setPhotoOverlayOpen(true)
  }

  const handleClosePhotoOverlay = () => {
    setPhotoOverlayOpen(false)
  }

  const handleNextPhoto = () => {
    if (note?.photos && currentPhotoIndex < note.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }
  }

  const handlePreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

  // Touch handlers pour swipe horizontal
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX
    handleSwipe()
  }

  const handleSwipe = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current
    
    if (diff > swipeThreshold) {
      handleNextPhoto()
    } else if (diff < -swipeThreshold) {
      handlePreviousPhoto()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!photoOverlayOpen) return
      
      if (e.key === 'ArrowRight') {
        handleNextPhoto()
      } else if (e.key === 'ArrowLeft') {
        handlePreviousPhoto()
      } else if (e.key === 'Escape') {
        handleClosePhotoOverlay()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [photoOverlayOpen, currentPhotoIndex])

  const getPriorityBadge = (priority) => {
    const labels = {
      high: { label: 'Haute', className: 'priority-high' },
      medium: { label: 'Moyenne', className: 'priority-medium' },
      low: { label: 'Basse', className: 'priority-low' },
      none: { label: 'Aucune', className: 'priority-none' }
    }
    return labels[priority] || labels.none
  }

  if (loading) {
    return (
      <Layout title="Chargement...">
        <div className="loading-state">
          <div className="spinner" />
          <p>Chargement de la note...</p>
        </div>
      </Layout>
    )
  }

  if (!note) {
    return (
      <Layout title="Note introuvable">
        <div className="empty-state">
          <span className="empty-state__icon">📝</span>
          <h2 className="empty-state__title">Note introuvable</h2>
          <p className="empty-state__description">Cette note n'existe pas ou a été supprimée.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
        </div>
      </Layout>
    )
  }

  const priorityBadge = getPriorityBadge(note.priority)

  return (
    <Layout title={note.title || 'Note sans titre'}>
      <div className="note-detail-page">
        {/* En-tête de la note */}
        <div className="note-detail-header">
          <h1 className="note-detail-title">{note.title || 'Sans titre'}</h1>
          
          <div className="note-detail-meta">
            {folder && (
              <div className="meta-item">
                <span className="meta-icon">📁</span>
                <span className="meta-text">{folder.name}</span>
              </div>
            )}
            
            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <span className="meta-text">{formatRelativeTime(note.updatedAt)}</span>
            </div>
            
            <div className="meta-item">
              <span className="meta-icon">⏱️</span>
              <span className="meta-text" title={formatDateLong(note.createdAt)}>
                Créée {formatRelativeTime(note.createdAt)}
              </span>
            </div>
          </div>

          {note.priority && note.priority !== 'none' && (
            <div className="note-detail-priority">
              <span className={`badge ${priorityBadge.className}`}>
                ⚑ {priorityBadge.label}
              </span>
            </div>
          )}

          {Array.isArray(note.tags) && note.tags.length > 0 && (
            <div className="note-detail-tags">
              {note.tags.map((tag, index) => (
                <span key={index} className="chip">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Contenu de la note */}
        {note.content && (
          <div className="note-detail-content">
            <div className="content-text">
              {note.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph || '\u00A0'}</p>
              ))}
            </div>
          </div>
        )}

        {/* Galerie photos */}
        {Array.isArray(note.photos) && note.photos.length > 0 && (
          <div className="note-detail-photos">
            <h3 className="photos-title">
              Photos ({note.photos.length})
            </h3>
            <div className="photos-grid">
              {note.photos.map((photo, index) => (
                <button
                  key={index}
                  className="photo-thumbnail"
                  onClick={() => handlePhotoClick(index)}
                  aria-label={`Agrandir la photo ${index + 1}`}
                >
                  <img src={photo} alt={`Photo ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="note-detail-actions">
          <button
            className="btn-secondary"
            onClick={handleEdit}
            aria-label="Modifier la note"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Modifier
          </button>
          
          <button
            className="btn-secondary"
            onClick={handleShare}
            aria-label="Partager la note"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Partager
          </button>
          
          <button
            className="btn-secondary"
            onClick={handleExportPDF}
            aria-label="Exporter en PDF"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            PDF
          </button>
          
          <button
            className="btn-secondary"
            onClick={handleExportText}
            aria-label="Exporter en texte"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Texte
          </button>
          
          <button
            className="btn-danger"
            onClick={handleDelete}
            aria-label="Supprimer la note"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Supprimer
          </button>
        </div>

        {/* Overlay galerie photos */}
        {photoOverlayOpen && note.photos && note.photos.length > 0 && (
          <div 
            className="photo-overlay"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              className="photo-overlay-close"
              onClick={handleClosePhotoOverlay}
              aria-label="Fermer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <button
              className="photo-overlay-nav photo-overlay-prev"
              onClick={handlePreviousPhoto}
              disabled={currentPhotoIndex === 0}
              aria-label="Photo précédente"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="photo-overlay-content">
              <img
                src={note.photos[currentPhotoIndex]}
                alt={`Photo ${currentPhotoIndex + 1}`}
                className="photo-overlay-image"
              />
              <div className="photo-overlay-counter">
                {currentPhotoIndex + 1} / {note.photos.length}
              </div>
            </div>

            <button
              className="photo-overlay-nav photo-overlay-next"
              onClick={handleNextPhoto}
              disabled={currentPhotoIndex === note.photos.length - 1}
              aria-label="Photo suivante"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* ShareSheet */}
        {shareSheetOpen && (
          <ShareSheet
            note={note}
            folder={folder}
            onClose={() => setShareSheetOpen(false)}
          />
        )}
      </div>
    </Layout>
  )
}
