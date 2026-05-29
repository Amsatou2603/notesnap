import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db/database'

/**
 * Hook useFolders — Gestion complète des dossiers avec Dexie
 *
 * Retourne :
 *   - folders         : tableau de tous les dossiers (réactif)
 *   - loading         : état de chargement initial
 *   - error           : message d'erreur lisible
 *   - createFolder    : créer un nouveau dossier
 *   - updateFolder    : mettre à jour un dossier
 *   - deleteFolder    : supprimer un dossier
 *   - getFolderById   : récupérer un dossier par id
 *   - getFolderNoteCount : nombre de notes dans un dossier
 */

// Palette de couleurs disponibles pour les dossiers
export const FOLDER_COLORS = [
  '#6C63FF', // violet
  '#3B82F6', // bleu
  '#22c55e', // vert
  '#f59e0b', // ambre
  '#ef4444', // rouge
  '#ec4899', // rose
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // purple
  '#06b6d4'  // cyan
]

// Icônes disponibles pour les dossiers
export const FOLDER_ICONS = [
  '📁', '📂', '📚', '📖', '📝', '✏️', '🎨', '💡',
  '🔖', '🗂️', '📌', '🏷️', '⭐', '❤️', '🎯', '🔑',
  '💼', '🏠', '🌟', '🎵', '🎬', '🌿', '🚀', '💎'
]

export function useFolders() {
  const [error, setError] = useState(null)

  /**
   * Requête réactive sur tous les dossiers
   * Triés par createdAt croissant (ordre de création)
   */
  const folders = useLiveQuery(async () => {
    try {
      const allFolders = await db.folders
        .orderBy('createdAt')
        .toArray()
      return allFolders
    } catch (err) {
      console.error('[useFolders] Erreur chargement dossiers :', err)
      setError(`Impossible de charger les dossiers. Détail : ${err.message}`)
      return []
    }
  }, [])

  const loading = folders === undefined

  /**
   * Valide les données d'un dossier
   */
  const validateFolder = useCallback(async (folderData, excludeId = null) => {
    const errors = []

    if (!folderData.name || folderData.name.trim().length === 0) {
      errors.push('Le nom du dossier est obligatoire.')
    }

    if (folderData.name && folderData.name.trim().length > 100) {
      errors.push('Le nom du dossier ne peut pas dépasser 100 caractères.')
    }

    if (folderData.name) {
      // Vérifier l'unicité du nom (insensible à la casse)
      const trimmedName = folderData.name.trim().toLowerCase()
      const existingFolders = await db.folders.toArray()
      const duplicate = existingFolders.find(f => {
        if (excludeId !== null && f.id === excludeId) return false
        return f.name.trim().toLowerCase() === trimmedName
      })
      if (duplicate) {
        errors.push(`Un dossier nommé "${folderData.name.trim()}" existe déjà.`)
      }
    }

    return errors
  }, [])

  /**
   * Crée un nouveau dossier
   * @param {Object} folderData - { name, color?, icon? }
   * @returns {Promise<number>} id du dossier créé
   */
  const createFolder = useCallback(async (folderData) => {
    setError(null)
    try {
      const errors = await validateFolder(folderData)
      if (errors.length > 0) {
        throw new Error(errors.join(' '))
      }

      const folder = {
        name: folderData.name.trim(),
        color: folderData.color ?? FOLDER_COLORS[0],
        icon: folderData.icon ?? '📁',
        createdAt: Date.now()
      }

      const id = await db.folders.add(folder)
      return id
    } catch (err) {
      const message = err.name === 'QuotaExceededError'
        ? 'Espace de stockage insuffisant. Libérez de l\'espace et réessayez.'
        : `Impossible de créer le dossier. ${err.message}`
      setError(message)
      console.error('[useFolders] Erreur création dossier :', err)
      throw new Error(message)
    }
  }, [validateFolder])

  /**
   * Met à jour un dossier existant
   * @param {number} id - Identifiant du dossier
   * @param {Object} changes - Champs à modifier
   * @returns {Promise<number>}
   */
  const updateFolder = useCallback(async (id, changes) => {
    setError(null)
    try {
      if (!id && id !== 0) {
        throw new Error('Identifiant de dossier manquant.')
      }

      const existing = await db.folders.get(id)
      if (!existing) {
        throw new Error('Dossier introuvable. Il a peut-être été supprimé.')
      }

      if (changes.name !== undefined) {
        const errors = await validateFolder({ ...existing, ...changes }, id)
        if (errors.length > 0) {
          throw new Error(errors.join(' '))
        }
        changes.name = changes.name.trim()
      }

      const result = await db.folders.update(id, changes)
      return result
    } catch (err) {
      const message = `Impossible de mettre à jour le dossier. ${err.message}`
      setError(message)
      console.error('[useFolders] Erreur mise à jour dossier :', err)
      throw new Error(message)
    }
  }, [validateFolder])

  /**
   * Supprime un dossier
   * @param {number} id - Identifiant du dossier
   * @returns {Promise<void>}
   */
  const deleteFolder = useCallback(async (id) => {
    setError(null)
    try {
      if (!id && id !== 0) {
        throw new Error('Identifiant de dossier manquant.')
      }

      await db.folders.delete(id)
    } catch (err) {
      const message = `Impossible de supprimer le dossier. ${err.message}`
      setError(message)
      console.error('[useFolders] Erreur suppression dossier :', err)
      throw new Error(message)
    }
  }, [])

  /**
   * Récupère un dossier par son id
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  const getFolderById = useCallback(async (id) => {
    try {
      if (!id && id !== 0) {
        throw new Error('Identifiant de dossier manquant.')
      }
      return await db.folders.get(Number(id))
    } catch (err) {
      const message = `Impossible de récupérer le dossier. ${err.message}`
      setError(message)
      console.error('[useFolders] Erreur récupération dossier :', err)
      throw new Error(message)
    }
  }, [])

  /**
   * Retourne le nombre de notes dans un dossier
   * Passer null pour les notes sans dossier
   * @param {number|null} folderId
   * @returns {Promise<number>}
   */
  const getFolderNoteCount = useCallback(async (folderId) => {
    try {
      const count = await db.notes
        .where('folderId')
        .equals(folderId ?? null)
        .count()
      return count
    } catch (err) {
      console.error('[useFolders] Erreur comptage notes dossier :', err)
      return 0
    }
  }, [])

  /**
   * Efface l'erreur en cours
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    folders: folders ?? [],
    loading,
    error,
    clearError,
    createFolder,
    updateFolder,
    deleteFolder,
    getFolderById,
    getFolderNoteCount,
    FOLDER_COLORS,
    FOLDER_ICONS
  }
}

export default useFolders
