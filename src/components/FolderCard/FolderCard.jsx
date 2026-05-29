import React from 'react'
import styles from './FolderCard.module.css'

/**
 * FolderCard — Carte de dossier avec glassmorphism
 *
 * Affiche un dossier avec :
 * - Icône et couleur personnalisés
 * - Nom du dossier
 * - Nombre de notes
 * - Actions rapides (éditer, supprimer)
 */
export default function FolderCard({ folder, noteCount, onClick, onEdit, onDelete, selected = false }) {
  return (
    <article
      className={`${styles.folderCard} ${selected ? styles.selected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* En-tête avec icône et actions */}
      <div className={styles.header}>
        <div
          className={styles.icon}
          style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
        >
          {folder.icon}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(folder)
            }}
            aria-label="Modifier le dossier"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(folder)
            }}
            aria-label="Supprimer le dossier"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Nom du dossier */}
      <h3 className={styles.name}>{folder.name}</h3>

      {/* Nombre de notes */}
      <div className={styles.noteCount}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
        <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Indicateur de sélection */}
      {selected && <div className={styles.selectedIndicator} />}
    </article>
  )
}
