import Dexie from 'dexie'

/**
 * NoteSnap — Base de données IndexedDB via Dexie
 *
 * Tables :
 *   folders : id, name, color, icon, createdAt
 *   notes   : id, folderId, title, content, tags, priority, photos, createdAt, updatedAt
 *
 * Règles :
 *   - folderId === null → note "Sans dossier"
 *   - photos = tableau de strings base64 compressées
 *   - Jamais de Blob dans IndexedDB
 */

class NoteSnapDatabase extends Dexie {
  constructor() {
    super('NoteSnapDB')

    /**
     * Version 1 — Schéma initial
     * Les symboles ++ indiquent une clé primaire auto-incrémentée
     * Les autres colonnes indexées permettent les requêtes filtrées
     */
    this.version(1).stores({
      folders: '++id, name, color, icon, createdAt',
      notes: '++id, folderId, title, content, tags, priority, createdAt, updatedAt'
    })

    // Typage des tables pour l'autocomplétion
    this.folders = this.table('folders')
    this.notes = this.table('notes')
  }
}

// Instance singleton exportée
const db = new NoteSnapDatabase()

/**
 * Initialisation et vérification de la connexion
 * Ouvre la base sans erreur silencieuse
 */
export async function initDatabase() {
  try {
    await db.open()
    console.info('[NoteSnap] Base de données IndexedDB ouverte avec succès.')
    return true
  } catch (error) {
    console.error('[NoteSnap] Échec ouverture base de données :', error)
    throw new Error(
      `Impossible d'ouvrir la base de données locale. Vérifiez que votre navigateur autorise IndexedDB. Détail : ${error.message}`
    )
  }
}

/**
 * Efface toutes les données (utilitaire de développement / reset)
 */
export async function clearDatabase() {
  try {
    await db.transaction('rw', db.folders, db.notes, async () => {
      await db.folders.clear()
      await db.notes.clear()
    })
    console.info('[NoteSnap] Base de données réinitialisée.')
  } catch (error) {
    console.error('[NoteSnap] Erreur lors de la réinitialisation :', error)
    throw new Error(`Impossible de réinitialiser la base de données. Détail : ${error.message}`)
  }
}

/**
 * Retourne des statistiques sur la base de données
 */
export async function getDatabaseStats() {
  try {
    const [folderCount, noteCount] = await Promise.all([
      db.folders.count(),
      db.notes.count()
    ])
    return { folderCount, noteCount }
  } catch (error) {
    console.error('[NoteSnap] Erreur statistiques DB :', error)
    return { folderCount: 0, noteCount: 0 }
  }
}

export default db
