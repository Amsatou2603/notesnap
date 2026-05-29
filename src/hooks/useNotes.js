import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db/database'

/**
 * Hook useNotes — Gestion complète des notes avec Dexie
 *
 * Retourne :
 *   - notes           : tableau de toutes les notes (réactif via useLiveQuery)
 *   - loading         : état de chargement initial
 *   - error           : message d'erreur lisible
 *   - createNote      : créer une nouvelle note
 *   - updateNote      : mettre à jour une note existante
 *   - deleteNote      : supprimer une note par id
 *   - getNoteById     : récupérer une note par id (Promise)
 *   - getNotesByFolder: récupérer les notes d'un dossier (Promise)
 *   - deleteNotesByFolder : supprimer toutes les notes d'un dossier
 */
export function useNotes() {
  const [error, setError] = useState(null)

  /**
   * Requête réactive sur toutes les notes
   * Triées par updatedAt décroissant (plus récentes en premier)
   */
  const notes = useLiveQuery(async () => {
    try {
      const allNotes = await db.notes
        .orderBy('updatedAt')
        .reverse()
        .toArray()
      return allNotes
    } catch (err) {
      console.error('[useNotes] Erreur chargement notes :', err)
      setError(`Impossible de charger les notes. Détail : ${err.message}`)
      return []
    }
  }, [])

  // useLiveQuery retourne undefined pendant le chargement initial
  const loading = notes === undefined

  /**
   * Valide et normalise une note avant persistence
   */
  const validateNote = useCallback((noteData) => {
    const errors = []

    const hasTitle = noteData.title && noteData.title.trim().length > 0
    const hasContent = noteData.content && noteData.content.trim().length > 0
    const hasPhotos = noteData.photos && noteData.photos.length > 0

    if (!hasTitle && !hasContent && !hasPhotos) {
      errors.push('La note doit avoir au minimum un titre, un contenu ou une photo.')
    }

    if (noteData.title && noteData.title.length > 200) {
      errors.push('Le titre ne peut pas dépasser 200 caractères.')
    }

    if (noteData.content && noteData.content.length > 50000) {
      errors.push('Le contenu ne peut pas dépasser 50 000 caractères.')
    }

    const validPriorities = ['none', 'low', 'medium', 'high']
    if (noteData.priority && !validPriorities.includes(noteData.priority)) {
      errors.push(`La priorité doit être l'une des valeurs suivantes : ${validPriorities.join(', ')}.`)
    }

    if (noteData.photos && !Array.isArray(noteData.photos)) {
      errors.push('Les photos doivent être un tableau.')
    }

    if (noteData.tags && !Array.isArray(noteData.tags)) {
      errors.push('Les étiquettes doivent être un tableau.')
    }

    return errors
  }, [])

  /**
   * Crée une nouvelle note
   * @param {Object} noteData - Données de la note
   * @returns {Promise<number>} id de la note créée
   */
  const createNote = useCallback(async (noteData) => {
    setError(null)
    try {
      const errors = validateNote(noteData)
      if (errors.length > 0) {
        throw new Error(errors.join(' '))
      }

      const now = Date.now()
      const note = {
        folderId: noteData.folderId ?? null,
        title: (noteData.title ?? '').trim(),
        content: noteData.content ?? '',
        tags: Array.isArray(noteData.tags) ? noteData.tags.filter(t => t.trim().length > 0) : [],
        priority: noteData.priority ?? 'none',
        photos: Array.isArray(noteData.photos) ? noteData.photos : [],
        createdAt: now,
        updatedAt: now
      }

      const id = await db.notes.add(note)
      return id
    } catch (err) {
      const message = err.name === 'QuotaExceededError'
        ? 'Espace de stockage insuffisant. Libérez de l\'espace et réessayez.'
        : `Impossible de créer la note. ${err.message}`
      setError(message)
      console.error('[useNotes] Erreur création note :', err)
      throw new Error(message)
    }
  }, [validateNote])

  /**
   * Met à jour une note existante
   * @param {number} id - Identifiant de la note
   * @param {Object} changes - Champs à modifier
   * @returns {Promise<number>} nombre d'enregistrements modifiés
   */
  const updateNote = useCallback(async (id, changes) => {
    setError(null)
    try {
      if (!id && id !== 0) {
        throw new Error('Identifiant de note manquant.')
      }

      // Vérification que la note existe
      const existing = await db.notes.get(id)
      if (!existing) {
        throw new Error('Note introuvable. Elle a peut-être été supprimée.')
      }

      const updatedChanges = {
        ...changes,
        updatedAt: Date.now()
      }

      // Nettoyage des tags si présents
      if (changes.tags !== undefined) {
        updatedChanges.tags = Array.isArray(changes.tags)
          ? changes.tags.filter(t => String(t).trim().length > 0)
          : []
      }

      // Nettoyage du titre si présent
      if (changes.title !== undefined) {
        updatedChanges.title = String(changes.title).trim()
      }

      const result = await db.notes.update(id, updatedChanges)
      return result
    } catch (err) {
      const message = err.name === 'QuotaExceededError'
        ? 'Espace de stockage insuffisant. Libérez de l\'espace et réessayez.'
        : `Impossible de mettre à jour la note. ${err.message}`
      setError(message)
      console.error('[useNotes] Erreur mise à jour note :', err)
      throw new Error(message)
    }
  }, [])

  /**
   * Supprime une note par son id
   * @param {number} id - Identifiant de la note
   * @returns {Promise<void>}
   */
  const deleteNote = useCallback(async (id) => {
    setError(null)
    try {
      if (!id && id !== 0) {
        throw new Error('Identifiant de note manquant.')
      }

      await db.notes.delete(id)
    } catch (err) {
      const message = `Impossible de supprimer la note. ${err.message}`
      setError(message)
      console.error('[useNotes] Erreur suppression note :', err)
      throw new Error(message)
    }
  }, [])

  /**
   * Récupère une note par son id
   * @param {number} id - Identifiant de la note
   * @returns {Promise<Object|undefined>}
   */
  const getNoteById = useCallback(async (id) => {
    try {
      if (!id && id !== 0) {
        throw new Error('Identifiant de note manquant.')
      }
      const note = await db.notes.get(Number(id))
      return note
    } catch (err) {
      const message = `Impossible de récupérer la note. ${err.message}`
      setError(message)
      console.error('[useNotes] Erreur récupération note :', err)
      throw new Error(message)
    }
  }, [])

  /**
   * Récupère les notes d'un dossier spécifique
   * Passer null pour obtenir les notes sans dossier
   * @param {number|null} folderId
   * @returns {Promise<Array>}
   */
  const getNotesByFolder = useCallback(async (folderId) => {
    try {
      const notesList = await db.notes
        .where('folderId')
        .equals(folderId ?? null)
        .reverse()
        .sortBy('updatedAt')
      return notesList
    } catch (err) {
      const message = `Impossible de récupérer les notes du dossier. ${err.message}`
      setError(message)
      console.error('[useNotes] Erreur récupération notes dossier :', err)
      throw new Error(message)
    }
  }, [])

  /**
   * Supprime toutes les notes d'un dossier donné
   * Utilisé lors de la suppression d'un dossier
   * @param {number} folderId
   * @returns {Promise<void>}
   */
  const deleteNotesByFolder = useCallback(async (folderId) => {
    setError(null)
    try {
      await db.notes
        .where('folderId')
        .equals(folderId)
        .delete()
    } catch (err) {
      const message = `Impossible de supprimer les notes du dossier. ${err.message}`
      setError(message)
      console.error('[useNotes] Erreur suppression notes dossier :', err)
      throw new Error(message)
    }
  }, [])

  /**
   * Déplace toutes les notes d'un dossier vers "Sans dossier" (folderId = null)
   * @param {number} folderId
   * @returns {Promise<void>}
   */
  const moveNotesToUncategorized = useCallback(async (folderId) => {
    setError(null)
    try {
      const notesToMove = await db.notes
        .where('folderId')
        .equals(folderId)
        .toArray()

      const now = Date.now()
      await db.transaction('rw', db.notes, async () => {
        for (const note of notesToMove) {
          await db.notes.update(note.id, { folderId: null, updatedAt: now })
        }
      })
    } catch (err) {
      const message = `Impossible de déplacer les notes. ${err.message}`
      setError(message)
      console.error('[useNotes] Erreur déplacement notes :', err)
      throw new Error(message)
    }
  }, [])

  /**
   * Efface l'erreur en cours
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    notes: notes ?? [],
    loading,
    error,
    clearError,
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
    getNotesByFolder,
    deleteNotesByFolder,
    moveNotesToUncategorized
  }
}

export default useNotes
