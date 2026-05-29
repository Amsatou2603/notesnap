import React, { useRef, useState } from 'react'
import { compressImage, ACCEPTED_IMAGE_TYPES } from '../../utils/imageUtils'
import styles from './PhotoCapture.module.css'

/**
 * PhotoCapture — Composant de capture et upload de photos
 *
 * Fonctionnalités :
 * - Capture via caméra
 * - Upload depuis la galerie
 * - Compression automatique
 * - Prévisualisation
 * - Suppression
 */
export default function PhotoCapture({ photos, onPhotosChange, maxPhotos = 5 }) {
  const fileInputRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsProcessing(true)

    try {
      const newPhotos = []

      for (const file of files) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          alert(`Format non supporté : ${file.type}`)
          continue
        }

        try {
          const compressedBase64 = await compressImage(file)
          newPhotos.push(compressedBase64)
        } catch (err) {
          alert(`Erreur lors du traitement de ${file.name} : ${err.message}`)
        }
      }

      if (newPhotos.length > 0) {
        const updatedPhotos = [...(photos || []), ...newPhotos].slice(0, maxPhotos)
        onPhotosChange(updatedPhotos)
      }
    } finally {
      setIsProcessing(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCameraCapture = () => {
    fileInputRef.current?.click()
  }

  const handleRemovePhoto = (index) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(updatedPhotos)
  }

  const canAddMore = !photos || photos.length < maxPhotos

  return (
    <div className={styles.photoCapture}>
      {/* Liste des photos */}
      {photos && photos.length > 0 && (
        <div className={styles.photoList}>
          {photos.map((photo, index) => (
            <div key={index} className={styles.photoItem}>
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className={styles.photoPreview}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemovePhoto(index)}
                aria-label="Supprimer la photo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Boutons d'ajout */}
      {canAddMore && (
        <div className={styles.actions}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleFileSelect}
            className={styles.hiddenInput}
          />
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleCameraCapture}
            disabled={isProcessing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {isProcessing ? 'Traitement...' : 'Ajouter des photos'}
          </button>
        </div>
      )}

      {/* Limite atteinte */}
      {!canAddMore && (
        <p className={styles.limitText}>
          Maximum {maxPhotos} photo{maxPhotos > 1 ? 's' : ''} atteint
        </p>
      )}
    </div>
  )
}
