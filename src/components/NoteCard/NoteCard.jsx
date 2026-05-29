import React from 'react'
import { formatRelativeTime } from '../../utils/dateUtils'
import styles from './NoteCard.module.css'

/**
 * NoteCard — Carte de note avec glassmorphism
 *
 * Affiche une note avec :
 * - Titre et aperçu du contenu
 * - Photo miniature si présente
 * - Badge de priorité
 * - Tags
 * - Date relative
 * - Actions rapides
 */
export default function NoteCard({ note, folder, onClick, onEdit, onDelete, highlighted = false }) {
  const priorityLabels = {
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
    none: ''
  }

  const priorityClass = note.priority ? styles[`priority-${note.priority}`] : ''

  return (
    <article
      className={`${styles.noteCard} ${highlighted ? styles.highlighted : ''} ${priorityClass}`}
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
      {/* En-tête avec priorité et date */}
      <div className={styles.header}>
        {note.priority && note.priority !== 'none' && (
          <span className={`${styles.priorityBadge} ${styles[`priority-${note.priority}`]}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            {priorityLabels[note.priority]}
          </span>
        )}
        <time className={styles.date} dateTime={new Date(note.updatedAt).toISOString()}>
          {formatRelativeTime(note.updatedAt)}
        </time>
      </div>

      {/* Titre */}
      <h3 className={styles.title}>{note.title || 'Sans titre'}</h3>

      {/* Aperçu contenu */}
      {note.content && (
        <p className={styles.preview}>
          {note.content.slice(0, 120)}
          {note.content.length > 120 && '...'}
        </p>
      )}

      {/* Photo miniature */}
      {note.photos && note.photos.length > 0 && (
        <div className={styles.photoPreview}>
          <img
            src={note.photos[0]}
            alt=""
            loading="lazy"
            className={styles.thumbnail}
          />
          {note.photos.length > 1 && (
            <span className={styles.photoCount}>+{note.photos.length - 1}</span>
          )}
        </div>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className={styles.tags}>
          {note.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className={styles.tag}>
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className={styles.tag}>+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Dossier */}
      {folder && (
        <div className={styles.folder}>
          <span className={styles.folderIcon}>{folder.icon}</span>
          <span className={styles.folderName}>{folder.name}</span>
        </div>
      )}

      {/* Actions rapides */}
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(note)
          }}
          aria-label="Modifier la note"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(note)
          }}
          aria-label="Supprimer la note"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </article>
  )
}
