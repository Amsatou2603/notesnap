import React, { useState, useEffect, useRef } from 'react'
import styles from './CreateFolderModal.module.css'

/**
 * CreateFolderModal — Modal de création de dossier
 *
 * Modal native React pour remplacer prompt() qui a des problèmes sur Safari iOS
 * Gère correctement le focus, le clavier et l'expérience utilisateur mobile
 */
export default function CreateFolderModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  // Focus automatique sur l'input quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Petit délai pour s'assurer que la modal est rendue
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      
      return () => clearTimeout(focusTimer)
    }
  }, [isOpen])

  // Réinitialiser le nom quand la modal ferme
  useEffect(() => {
    if (!isOpen) {
      setName('')
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim())
      setName('')
      onClose()
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modalContent}>
        <h2 id="modal-title" className={styles.modalTitle}>
          Nouveau dossier
        </h2>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="folder-name" className={styles.formLabel}>
              Nom du dossier
            </label>
            <input
              ref={inputRef}
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Travail, Idées..."
              className={styles.formInput}
              autoComplete="off"
              autoCapitalize="words"
              autoFocus
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={!name.trim()}
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
