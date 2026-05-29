import React from 'react'
import Layout from '../components/Layout/Layout'
import { useTheme } from '../hooks/useTheme'
import { clearDatabase, getDatabaseStats } from '../db/database'
import { exportDataToJSON, parseImportJSON } from '../utils/exportUtils'
import { useNotes } from '../hooks/useNotes'
import { useFolders } from '../hooks/useFolders'

/**
 * SettingsPage — Page des paramètres
 *
 * Permet :
 * - Changer le thème
 * - Exporter les données
 * - Importer les données
 * - Réinitialiser l'application
 */
export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme()
  const { notes } = useNotes()
  const { folders } = useFolders()
  const [stats, setStats] = React.useState({ noteCount: 0, folderCount: 0 })

  React.useEffect(() => {
    getDatabaseStats().then(setStats)
  }, [notes, folders])

  const handleExport = () => {
    try {
      exportDataToJSON(notes, folders)
    } catch (err) {
      alert(`Erreur lors de l'export : ${err.message}`)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        const data = await parseImportJSON(file)
        
        const importMode = confirm(
          `Importer ${data.notes.length} note${data.notes.length > 1 ? 's' : ''} et ${data.folders.length} dossier${data.folders.length > 1 ? 's' : ''} ?\n\n` +
          `Cliquez sur OK pour fusionner (garder les données existantes)\n` +
          `Cliquez sur Annuler pour remplacer (supprimer les données existantes)`
        )
        
        const mergeMode = importMode

        if (!mergeMode) {
          // Mode remplacement : confirmer suppression
          if (!confirm('⚠️ Toutes vos données actuelles seront supprimées. Continuer ?')) {
            return
          }
          
          // Supprimer toutes les données existantes
          await clearDatabase()
        }

        // Import des dossiers
        const { createFolder, folders: existingFolders } = useFolders()
        const folderIdMap = {} // Mapping ancien ID -> nouveau ID
        
        for (const folder of data.folders) {
          try {
            // Vérifier si un dossier avec le même nom existe déjà
            const existingFolder = existingFolders.find(f => 
              f.name.toLowerCase() === folder.name.toLowerCase()
            )
            
            if (existingFolder && mergeMode) {
              // Mode fusion : utiliser le dossier existant
              folderIdMap[folder.id] = existingFolder.id
            } else {
              // Créer un nouveau dossier
              const newFolderId = await createFolder(folder)
              folderIdMap[folder.id] = newFolderId
            }
          } catch (err) {
            console.warn('Erreur import dossier:', err)
            // Continuer avec les autres dossiers
          }
        }

        // Import des notes
        const { createNote, notes: existingNotes } = useNotes()
        let importedCount = 0
        let skippedCount = 0
        
        for (const note of data.notes) {
          try {
            // Vérifier si une note avec le même titre et contenu existe déjà
            const existingNote = existingNotes.find(n =>
              n.title === note.title && 
              n.content === note.content &&
              Math.abs(n.createdAt - note.createdAt) < 1000 // Même timestamp (±1s)
            )
            
            if (existingNote && mergeMode) {
              // Mode fusion : ignorer les doublons
              skippedCount++
              continue
            }
            
            // Mapper l'ID de dossier si nécessaire
            const noteData = { ...note }
            if (note.folderId && folderIdMap[note.folderId]) {
              noteData.folderId = folderIdMap[note.folderId]
            } else if (note.folderId && !folderIdMap[note.folderId]) {
              // Dossier introuvable : mettre dans "Sans dossier"
              noteData.folderId = null
            }
            
            await createNote(noteData)
            importedCount++
          } catch (err) {
            console.warn('Erreur import note:', err)
            // Continuer avec les autres notes
          }
        }

        const message = mergeMode
          ? `Import terminé !\n\n${importedCount} note${importedCount > 1 ? 's' : ''} importée${importedCount > 1 ? 's' : ''}${skippedCount > 0 ? `\n${skippedCount} doublon${skippedCount > 1 ? 's' : ''} ignoré${skippedCount > 1 ? 's' : ''}` : ''}`
          : `Import terminé !\n\n${importedCount} note${importedCount > 1 ? 's' : ''} importée${importedCount > 1 ? 's' : ''}`
        
        alert(message)
        window.location.reload()
      } catch (err) {
        alert(`Erreur lors de l'import : ${err.message}`)
      }
    }

    input.click()
  }

  const handleReset = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes vos données ?\n\nCette action est irréversible.')) {
      return
    }

    if (!confirm('Dernière confirmation : tout sera supprimé définitivement.')) {
      return
    }

    try {
      await clearDatabase()
      alert('Toutes les données ont été supprimées.')
      window.location.reload()
    } catch (err) {
      alert(`Erreur lors de la réinitialisation : ${err.message}`)
    }
  }

  return (
    <Layout title="Paramètres">
      <div className="settings-page">
        <div className="settings-section">
          <h2 className="settings-section-title">Apparence</h2>
          
          <div className="settings-item">
            <div className="settings-item-content">
              <span className="settings-item-label">Mode sombre</span>
              <span className="settings-item-description">
                {isDark ? 'Activé' : 'Désactivé'}
              </span>
            </div>
            <button
              className="toggle-switch"
              onClick={toggleTheme}
              aria-pressed={isDark}
            >
              <span className={`toggle-slider ${isDark ? 'active' : ''}`} />
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">Données</h2>
          
          <div className="settings-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.noteCount}</span>
              <span className="stat-label">Note{stats.noteCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.folderCount}</span>
              <span className="stat-label">Dossier{stats.folderCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-content">
              <span className="settings-item-label">Exporter les données</span>
              <span className="settings-item-description">
                Télécharger une sauvegarde JSON
              </span>
            </div>
            <button className="btn-secondary" onClick={handleExport}>
              Exporter
            </button>
          </div>

          <div className="settings-item">
            <div className="settings-item-content">
              <span className="settings-item-label">Importer les données</span>
              <span className="settings-item-description">
                Restaurer depuis une sauvegarde
              </span>
            </div>
            <button className="btn-secondary" onClick={handleImport}>
              Importer
            </button>
          </div>
        </div>

        <div className="settings-section danger">
          <h2 className="settings-section-title">Zone de danger</h2>
          
          <div className="settings-item">
            <div className="settings-item-content">
              <span className="settings-item-label">Réinitialiser tout</span>
              <span className="settings-item-description">
                Supprimer toutes les données
              </span>
            </div>
            <button className="btn-danger" onClick={handleReset}>
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="settings-info">
          <p className="app-version">
            NoteSnap v1.0.0
          </p>
          <p className="storage-info">
            Les données sont stockées localement sur votre appareil.
          </p>
        </div>
      </div>
    </Layout>
  )
}
