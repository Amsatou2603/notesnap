import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import FolderCard from '../components/FolderCard/FolderCard'
import EmptyState from '../components/EmptyState/EmptyState'
import { useFolders } from '../hooks/useFolders'
import { useNotes } from '../hooks/useNotes'
import { FOLDER_COLORS, FOLDER_ICONS } from '../hooks/useFolders'

/**
 * FoldersPage — Page de gestion des dossiers
 *
 * Affiche :
 * - Liste des dossiers avec nombre de notes
 * - FAB pour créer un nouveau dossier
 */
export default function FoldersPage() {
  const navigate = useNavigate()
  const { folders, loading, createFolder, updateFolder, deleteFolder, getFolderNoteCount } = useFolders()
  const { notes } = useNotes()
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)

  const handleCreateFolder = async () => {
    const name = prompt('Nom du nouveau dossier :')
    if (!name || !name.trim()) return

    try {
      const id = await createFolder({
        name: name.trim(),
        color: FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)],
        icon: FOLDER_ICONS[Math.floor(Math.random() * FOLDER_ICONS.length)]
      })
      navigate(`/folder/${id}`)
    } catch (err) {
      alert(`Erreur lors de la création : ${err.message}`)
    }
  }

  const handleEditFolder = (folder) => {
    const name = prompt('Nouveau nom du dossier :', folder.name)
    if (!name || !name.trim()) return

    try {
      updateFolder(folder.id, { name: name.trim() })
    } catch (err) {
      alert(`Erreur lors de la modification : ${err.message}`)
    }
  }

  const handleDeleteFolder = async (folder) => {
    const noteCount = await getFolderNoteCount(folder.id)
    
    if (noteCount > 0) {
      if (!confirm(`Ce dossier contient ${noteCount} note${noteCount > 1 ? 's' : ''}. Supprimer le dossier et toutes ses notes ?`)) {
        return
      }
    } else {
      if (!confirm(`Supprimer le dossier "${folder.name}" ?`)) {
        return
      }
    }

    try {
      const { deleteNotesByFolder } = useNotes()
      await deleteNotesByFolder(folder.id)
      await deleteFolder(folder.id)
    } catch (err) {
      alert(`Erreur lors de la suppression : ${err.message}`)
    }
  }

  const handleFolderClick = (folder) => {
    navigate(`/folder/${folder.id}`)
  }

  // Obtenir le nombre de notes pour chaque dossier
  const folderNoteCounts = React.useMemo(() => {
    const counts = {}
    folders.forEach(folder => {
      const count = notes.filter(note => note.folderId === folder.id).length
      counts[folder.id] = count
    })
    return counts
  }, [folders, notes])

  return (
    <Layout title="Mes dossiers">
      <div className="folders-page">
        {/* État de chargement */}
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Chargement des dossiers...</p>
          </div>
        )}

        {/* Liste vide */}
        {!loading && folders.length === 0 && (
          <EmptyState
            icon="📁"
            title="Aucun dossier"
            description="Créez des dossiers pour organiser vos notes"
            action={
              <button className="btn-primary" onClick={handleCreateFolder}>
                Créer un dossier
              </button>
            }
            variant="folders"
          />
        )}

        {/* Liste des dossiers */}
        {!loading && folders.length > 0 && (
          <div className="folders-grid">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                noteCount={folderNoteCounts[folder.id] || 0}
                onClick={() => handleFolderClick(folder)}
                onEdit={() => handleEditFolder(folder)}
                onDelete={() => handleDeleteFolder(folder)}
              />
            ))}
          </div>
        )}

        {/* FAB */}
        {!loading && (
          <button className="fab" onClick={handleCreateFolder} aria-label="Créer un dossier">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>
    </Layout>
  )
}
