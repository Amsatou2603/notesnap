import React from 'react'
import { exportNoteToPDF, exportNoteToText } from '../../utils/exportUtils'
import styles from './ShareSheet.module.css'

/**
 * ShareSheet — Sheet de partage et export
 *
 * Permet d'exporter une note en différents formats :
 * - PDF
 * - Texte
 * - Partage natif (si supporté)
 */
export default function ShareSheet({ note, folder, onClose }) {
  const handleExportPDF = async () => {
    try {
      await exportNoteToPDF(note, folder)
      onClose()
    } catch (err) {
      alert(`Erreur lors de l'export PDF : ${err.message}`)
    }
  }

  const handleExportText = () => {
    try {
      exportNoteToText(note)
      onClose()
    } catch (err) {
      alert(`Erreur lors de l'export texte : ${err.message}`)
    }
  }

  const handleNativeShare = async () => {
    if (!navigator.share) {
      alert('Le partage natif n\'est pas supporté sur ce navigateur.')
      return
    }

    try {
      await navigator.share({
        title: note.title || 'Note sans titre',
        text: note.content || '',
        url: window.location.href
      })
      onClose()
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert(`Erreur lors du partage : ${err.message}`)
      }
    }
  }

  return (
    <div className={styles.shareSheet}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <h2 className={styles.title}>Partager la note</h2>
        
        <div className={styles.options}>
          <button
            type="button"
            className={styles.option}
            onClick={handleExportPDF}
          >
            <div className={styles.optionIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </div>
            <div className={styles.optionContent}>
              <span className={styles.optionLabel}>Exporter en PDF</span>
              <span className={styles.optionDescription}>Document avec photos</span>
            </div>
          </button>

          <button
            type="button"
            className={styles.option}
            onClick={handleExportText}
          >
            <div className={styles.optionIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </div>
            <div className={styles.optionContent}>
              <span className={styles.optionLabel}>Exporter en texte</span>
              <span className={styles.optionDescription}>Fichier .txt simple</span>
            </div>
          </button>

          {navigator.share && (
            <button
              type="button"
              className={styles.option}
              onClick={handleNativeShare}
            >
              <div className={styles.optionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>
              <div className={styles.optionContent}>
                <span className={styles.optionLabel}>Partager</span>
                <span className={styles.optionDescription}>Via partage natif</span>
              </div>
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.cancelButton}
          onClick={onClose}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
