import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import FolderPicker from '../components/FolderPicker/FolderPicker'
import PhotoCapture from '../components/PhotoCapture/PhotoCapture'
import ShareSheet from '../components/ShareSheet/ShareSheet'
import { useNotes } from '../hooks/useNotes'
import { useFolders } from '../hooks/useFolders'
import { FOLDER_COLORS, FOLDER_ICONS } from '../hooks/useFolders'

/**
 * NoteEditorPage — Page d'édition/création de note
 *
 * Permet :
 * - Créer une nouvelle note
 * - Modifier une note existante
 * - Changer le dossier
 * - Ajouter des photos avec overlay galerie et swipe
 * - Définir la priorité
 * - Ajouter des tags
 * - Textarea auto-resize
 */
export default function NoteEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notes, createNote, updateNote, deleteNote } = useNotes()
  const { folders, createFolder } = useFolders()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [folderId, setFolderId] = useState(null)
  const [priority, setPriority] = useState('none')
  const [tags, setTags] = useState('')
  const [photos, setPhotos] = useState([])
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [photoOverlayOpen, setPhotoOverlayOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  
  const textareaRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // Auto-resize du textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const autoResize = () => {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
      
      textarea.addEventListener('input', autoResize)
      autoResize() // Initial resize
      
      return () => textarea.removeEventListener('input', autoResize)
    }
  }, [])

  useEffect(() => {
    if (id && id !== 'new') {
      const note = notes.find(n => n.id === Number(id))
      if (note) {
        setTitle(note.title || '')
        setContent(note.content || '')
        setFolderId(note.folderId)
        setPriority(note.priority || 'none')
        setTags(Array.isArray(note.tags) ? note.tags.join(', ') : '')
        setPhotos(note.photos || [])
        setIsNew(false)
      }
    }
  }, [id, notes])

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && photos.length === 0) {
      alert('Veuillez remplir au moins le titre, le contenu ou ajouter une photo.')
      return
    }

    setLoading(true)

    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const noteData = {
        title: title.trim(),
        content: content.trim(),
        folderId,
        priority,
        tags: tagsArray,
        photos
      }

      if (isNew) {
        const newId = await createNote(noteData)
        navigate(`/note/${newId}`)
      } else {
        await updateNote(Number(id), noteData)
      }

      navigate('/')
    } catch (err) {
      alert(`Erreur lors de la sauvegarde : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette note ?')) {
      return
    }

    try {
      await deleteNote(Number(id))
      navigate('/')
    } catch (err) {
      alert(`Erreur lors de la suppression : ${err.message}`)
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
    if (photos && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }
  }

  const handlePreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

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

  // Keyboard navigation pour l'overlay photos
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

  const handleCreateFolder = async () => {
    const name = prompt('Nom du nouveau dossier :')
    if (!name || !name.trim()) return

    try {
      const newFolderId = await createFolder({
        name: name.trim(),
        color: FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)],
        icon: FOLDER_ICONS[Math.floor(Math.random() * FOLDER_ICONS.length)]
      })
      setFolderId(newFolderId)
    } catch (err) {
      alert(`Erreur lors de la création : ${err.message}`)
    }
  }

  const currentNote = isNew ? null : notes.find(n => n.id === Number(id))
  const currentFolder = folderId ? folders.find(f => f.id === folderId) : null

  return (
    <Layout title={isNew ? 'Nouvelle note' : 'Modifier la note'}>
      <div className="note-editor-page">
        <div className="editor-form">
          {/* Titre */}
          <div className="form-group">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la note"
              className="form-input"
              autoFocus={isNew}
            />
          </div>

          {/* Dossier */}
          <div className="form-group">
            <FolderPicker
              folders={folders}
              selectedFolderId={folderId}
              onSelect={setFolderId}
              onCreateFolder={handleCreateFolder}
              allowCreate={true}
            />
          </div>

          {/* Priorité */}
          <div className="form-group">
            <label className="form-label">Priorité</label>
            <div className="priority-options">
              {['none', 'low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`priority-option ${priority === p ? 'active' : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p === 'none' && 'Aucune'}
                  {p === 'low' && 'Basse'}
                  {p === 'medium' && 'Moyenne'}
                  {p === 'high' && 'Haute'}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Étiquettes</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="travail, idées, important..."
              className="form-input"
            />
            <p className="form-helper">Séparez les étiquettes par des virgules</p>
          </div>

          {/* Photos */}
          <div className="form-group">
            <label className="form-label">Photos</label>
            <PhotoCapture
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={5}
            />
          </div>

          {/* Contenu */}
          <div className="form-group">
            <label className="form-label">Contenu</label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez votre note ici..."
              className="form-textarea auto-resize"
              rows={3}
              style={{ minHeight: '120px', maxHeight: '500px', overflowY: 'auto' }}
            />
          </div>

          {/* Aperçu des photos avec overlay */}
          {photos.length > 0 && (
            <div className="form-group">
              <label className="form-label">Photos ({photos.length})</label>
              <div className="editor-photos-preview">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    type="button"
                    className="photo-preview-item"
                    onClick={() => handlePhotoClick(index)}
                    aria-label={`Agrandir la photo ${index + 1}`}
                  >
                    <img src={photo} alt={`Photo ${index + 1}`} />
                    <button
                      type="button"
                      className="photo-preview-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPhotos(photos.filter((_, i) => i !== index))
                      }}
                      aria-label="Supprimer la photo"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="editor-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            Annuler
          </button>
          
          {!isNew && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShareSheetOpen(true)}
            >
              Partager
            </button>
          )}

          {!isNew && (
            <button
              type="button"
              className="btn-danger"
              onClick={handleDelete}
            >
              Supprimer
            </button>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        {/* ShareSheet */}
        {shareSheetOpen && currentNote && (
          <ShareSheet
            note={currentNote}
            folder={currentFolder}
            onClose={() => setShareSheetOpen(false)}
          />
        )}

        {/* Overlay galerie photos */}
        {photoOverlayOpen && photos.length > 0 && (
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
                src={photos[currentPhotoIndex]}
                alt={`Photo ${currentPhotoIndex + 1}`}
                className="photo-overlay-image"
              />
              <div className="photo-overlay-counter">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            </div>

            <button
              className="photo-overlay-nav photo-overlay-next"
              onClick={handleNextPhoto}
              disabled={currentPhotoIndex === photos.length - 1}
              aria-label="Photo suivante"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
