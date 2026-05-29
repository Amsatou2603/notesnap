import { useState, useMemo, useCallback, useRef } from 'react'

/**
 * Hook useSearch — Recherche en temps réel sur les notes
 *
 * Fonctionnalités :
 *   - Recherche insensible à la casse
 *   - Recherche dans : titre, contenu, étiquettes
 *   - Debounce configurable (300ms par défaut)
 *   - Filtrage par dossier optionnel
 *   - Filtrage par priorité optionnel
 *   - Tri configurable
 *   - Mise en évidence des correspondances (highlight)
 *   - 100% côté client, zéro backend
 *
 * @param {Array} notes - Tableau de toutes les notes
 * @param {Object} options - Options de configuration
 * @returns {Object} Résultats et contrôles de recherche
 */

const SORT_OPTIONS = {
  UPDATED_DESC: 'updatedAt_desc',
  UPDATED_ASC: 'updatedAt_asc',
  CREATED_DESC: 'createdAt_desc',
  CREATED_ASC: 'createdAt_asc',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
  PRIORITY_DESC: 'priority_desc'
}

const PRIORITY_ORDER = { high: 4, medium: 3, low: 2, none: 1 }

export function useSearch(notes = [], options = {}) {
  const {
    debounceMs = 300,
    maxResults = 200
  } = options

  const [query, setQueryState] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeFolderId, setActiveFolderId] = useState(undefined) // undefined = tous les dossiers
  const [activePriority, setActivePriority] = useState(null)
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS.UPDATED_DESC)
  const [activeTags, setActiveTags] = useState([])

  const debounceTimer = useRef(null)

  /**
   * Mise à jour de la recherche avec debounce
   */
  const setQuery = useCallback((value) => {
    const sanitized = String(value).slice(0, 500) // limite de sécurité
    setQueryState(sanitized)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(sanitized)
    }, debounceMs)
  }, [debounceMs])

  /**
   * Réinitialise tous les filtres
   */
  const resetSearch = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    setQueryState('')
    setDebouncedQuery('')
    setActiveFolderId(undefined)
    setActivePriority(null)
    setActiveSort(SORT_OPTIONS.UPDATED_DESC)
    setActiveTags([])
  }, [])

  /**
   * Vérifie si une chaîne correspond à la requête de recherche
   * Retourne true si la requête est vide (affiche tout)
   */
  const matchesQuery = useCallback((text, searchQuery) => {
    if (!searchQuery.trim()) return true
    if (!text) return false
    return String(text).toLowerCase().includes(searchQuery.toLowerCase().trim())
  }, [])

  /**
   * Calcule le score de pertinence d'une note pour une requête
   * Titre = poids 3, Tags = poids 2, Contenu = poids 1
   */
  const getRelevanceScore = useCallback((note, searchQuery) => {
    if (!searchQuery.trim()) return 1

    const q = searchQuery.toLowerCase().trim()
    let score = 0

    // Correspondance exacte dans le titre
    if (note.title && note.title.toLowerCase() === q) score += 10
    // Correspondance dans le titre (début)
    else if (note.title && note.title.toLowerCase().startsWith(q)) score += 6
    // Correspondance dans le titre (contient)
    else if (note.title && note.title.toLowerCase().includes(q)) score += 3

    // Correspondance dans les tags
    if (Array.isArray(note.tags)) {
      const tagMatch = note.tags.some(tag =>
        String(tag).toLowerCase().includes(q)
      )
      if (tagMatch) score += 2
    }

    // Correspondance dans le contenu
    if (note.content && note.content.toLowerCase().includes(q)) score += 1

    return score
  }, [])

  /**
   * Résultats filtrés et triés (mémoïsés)
   */
  const results = useMemo(() => {
    if (!Array.isArray(notes)) return []

    let filtered = notes.filter(note => {
      // Filtre par dossier
      if (activeFolderId !== undefined) {
        const targetFolderId = activeFolderId === null ? null : activeFolderId
        if (note.folderId !== targetFolderId) return false
      }

      // Filtre par priorité
      if (activePriority && note.priority !== activePriority) return false

      // Filtre par tags actifs
      if (activeTags.length > 0) {
        const noteTags = Array.isArray(note.tags) ? note.tags.map(t => t.toLowerCase()) : []
        const hasAllTags = activeTags.every(tag =>
          noteTags.includes(tag.toLowerCase())
        )
        if (!hasAllTags) return false
      }

      // Filtre par requête de recherche
      if (debouncedQuery.trim()) {
        const q = debouncedQuery.trim()
        const inTitle = matchesQuery(note.title, q)
        const inContent = matchesQuery(note.content, q)
        const inTags = Array.isArray(note.tags) &&
          note.tags.some(tag => matchesQuery(tag, q))

        if (!inTitle && !inContent && !inTags) return false
      }

      return true
    })

    // Tri
    filtered = [...filtered].sort((a, b) => {
      switch (activeSort) {
        case SORT_OPTIONS.UPDATED_ASC:
          return (a.updatedAt ?? 0) - (b.updatedAt ?? 0)

        case SORT_OPTIONS.CREATED_DESC:
          return (b.createdAt ?? 0) - (a.createdAt ?? 0)

        case SORT_OPTIONS.CREATED_ASC:
          return (a.createdAt ?? 0) - (b.createdAt ?? 0)

        case SORT_OPTIONS.TITLE_ASC:
          return (a.title ?? '').localeCompare(b.title ?? '', 'fr', { sensitivity: 'base' })

        case SORT_OPTIONS.TITLE_DESC:
          return (b.title ?? '').localeCompare(a.title ?? '', 'fr', { sensitivity: 'base' })

        case SORT_OPTIONS.PRIORITY_DESC:
          return (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0)

        case SORT_OPTIONS.UPDATED_DESC:
        default:
          return (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
      }
    })

    // Tri par pertinence si recherche active (après tri principal)
    if (debouncedQuery.trim()) {
      filtered = [...filtered].sort((a, b) => {
        const scoreB = getRelevanceScore(b, debouncedQuery)
        const scoreA = getRelevanceScore(a, debouncedQuery)
        if (scoreB !== scoreA) return scoreB - scoreA
        // Garde l'ordre du tri principal si même score
        return 0
      })
    }

    return filtered.slice(0, maxResults)
  }, [
    notes,
    debouncedQuery,
    activeFolderId,
    activePriority,
    activeTags,
    activeSort,
    matchesQuery,
    getRelevanceScore,
    maxResults
  ])

  /**
   * Extrait tous les tags uniques des notes actives
   */
  const allTags = useMemo(() => {
    const tagSet = new Set()
    const sourceNotes = activeFolderId !== undefined
      ? notes.filter(n => n.folderId === activeFolderId)
      : notes

    sourceNotes.forEach(note => {
      if (Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          if (tag && String(tag).trim()) {
            tagSet.add(String(tag).trim())
          }
        })
      }
    })

    return Array.from(tagSet).sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    )
  }, [notes, activeFolderId])

  /**
   * Met en évidence les occurrences de la requête dans un texte
   * Retourne un tableau de segments { text, highlighted }
   */
  const highlightText = useCallback((text, searchQuery) => {
    if (!searchQuery.trim() || !text) {
      return [{ text: String(text ?? ''), highlighted: false }]
    }

    const q = searchQuery.trim()
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedQuery})`, 'gi')
    const parts = String(text).split(regex)

    return parts.map(part => ({
      text: part,
      highlighted: regex.test(part)
    }))
  }, [])

  /**
   * Bascule un tag dans les filtres actifs
   */
  const toggleTag = useCallback((tag) => {
    setActiveTags(prev => {
      const tagLower = tag.toLowerCase()
      if (prev.some(t => t.toLowerCase() === tagLower)) {
        return prev.filter(t => t.toLowerCase() !== tagLower)
      }
      return [...prev, tag]
    })
  }, [])

  const isSearching = debouncedQuery.trim().length > 0
  const hasFilters = activePriority !== null || activeTags.length > 0 || activeFolderId !== undefined
  const isEmpty = results.length === 0
  const totalCount = Array.isArray(notes) ? notes.length : 0
  const resultCount = results.length

  return {
    // État
    query,
    debouncedQuery,
    activeFolderId,
    activePriority,
    activeSort,
    activeTags,

    // Résultats
    results,
    allTags,
    isEmpty,
    isSearching,
    hasFilters,
    totalCount,
    resultCount,

    // Actions
    setQuery,
    setActiveFolderId,
    setActivePriority,
    setActiveSort,
    setActiveTags,
    toggleTag,
    resetSearch,

    // Utilitaires
    highlightText,
    SORT_OPTIONS
  }
}

export default useSearch
