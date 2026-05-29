import React, { useState } from 'react'
import styles from './FolderPicker.module.css'
import CreateFolderModal from './CreateFolderModal'

/**
 * FolderPicker — Sélecteur de dossier
 *
 * Permet de choisir ou créer un dossier pour une note
 * Affiche une liste de dossiers avec option "Sans dossier"
 * Utilise une modal native React pour la création (compatible Safari iOS)
 */
export default function FolderPicker({ folders, selectedFolderId, onSelect, onCreateFolder, allowCreate = true }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const selectedFolder = folders.find(f => f.id === selectedFolderId)

  const handleCreateFolder = (name) => {
    onCreateFolder(name)
    setIsOpen(false)
  }

  return (
    <div className={styles.folderPicker}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedFolder ? (
          <div className={styles.selected}>
            <span className={styles.folderIcon} style={{ color: selectedFolder.color }}>
              {selectedFolder.icon}
            </span>
            <span className={styles.folderName}>{selectedFolder.name}</span>
          </div>
        ) : (
          <span className={styles.placeholder}>Sans dossier</span>
        )}
        <svg
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.list} role="listbox">
            {/* Option "Sans dossier" */}
            <button
              type="button"
              className={`${styles.option} ${selectedFolderId === null ? styles.selected : ''}`}
              onClick={() => {
                onSelect(null)
                setIsOpen(false)
              }}
              role="option"
              aria-selected={selectedFolderId === null}
            >
              <span className={styles.optionIcon}>📄</span>
              <span className={styles.optionName}>Sans dossier</span>
              {selectedFolderId === null && (
                <svg className={styles.check} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>

            {/* Liste des dossiers */}
            {folders.map(folder => (
              <button
                key={folder.id}
                type="button"
                className={`${styles.option} ${selectedFolderId === folder.id ? styles.selected : ''}`}
                onClick={() => {
                  onSelect(folder.id)
                  setIsOpen(false)
                }}
                role="option"
                aria-selected={selectedFolderId === folder.id}
              >
                <span className={styles.optionIcon} style={{ color: folder.color }}>
                  {folder.icon}
                </span>
                <span className={styles.optionName}>{folder.name}</span>
                {selectedFolderId === folder.id && (
                  <svg className={styles.check} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {allowCreate && onCreateFolder && (
            <button
              type="button"
              className={styles.createButton}
              onClick={() => {
                setIsCreateModalOpen(true)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Nouveau dossier
            </button>
          )}
        </div>
      )}

      {/* Backdrop pour fermer au clic extérieur */}
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modal de création de dossier */}
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateFolder}
      />
    </div>
  )
}
