/**
 * dateUtils.js — Utilitaires de gestion des dates
 *
 * Toutes les dates sont stockées en timestamps Unix (ms)
 * Affichage en français
 */

/**
 * Options de locale française
 */
const LOCALE = 'fr-FR'

/**
 * Formate une date en affichage long : "lundi 12 janvier 2025, 14h30"
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatDateLong(timestamp) {
  if (!timestamp) return 'Date inconnue'
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Date invalide'

    return date.toLocaleDateString(LOCALE, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Date invalide'
  }
}

/**
 * Formate une date en affichage court : "12 jan. 2025"
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatDateShort(timestamp) {
  if (!timestamp) return '—'
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return '—'

    return date.toLocaleDateString(LOCALE, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return '—'
  }
}

/**
 * Formate uniquement l'heure : "14:30"
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  if (!timestamp) return '—'
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return '—'

    return date.toLocaleTimeString(LOCALE, {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

/**
 * Retourne une durée relative lisible depuis maintenant
 * Exemples : "il y a 2 minutes", "hier", "il y a 3 jours"
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Date inconnue'
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Date invalide'

    const now = Date.now()
    const diffMs = now - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    // Dans le futur (horloge désynchronisée)
    if (diffMs < 0) return 'à l\'instant'

    // Moins d'une minute
    if (diffSeconds < 60) return 'à l\'instant'

    // Moins d'une heure
    if (diffMinutes < 60) {
      return diffMinutes === 1
        ? 'il y a 1 minute'
        : `il y a ${diffMinutes} minutes`
    }

    // Moins de 24 heures
    if (diffHours < 24) {
      // Même jour
      const today = new Date()
      const noteDate = new Date(timestamp)
      if (
        today.getDate() === noteDate.getDate() &&
        today.getMonth() === noteDate.getMonth() &&
        today.getFullYear() === noteDate.getFullYear()
      ) {
        return `aujourd'hui à ${formatTime(timestamp)}`
      }
      return diffHours === 1
        ? 'il y a 1 heure'
        : `il y a ${diffHours} heures`
    }

    // Hier
    if (diffDays === 1) return `hier à ${formatTime(timestamp)}`

    // Moins d'une semaine
    if (diffDays < 7) {
      return `il y a ${diffDays} jours`
    }

    // Moins d'un mois
    if (diffWeeks < 5) {
      return diffWeeks === 1
        ? 'il y a 1 semaine'
        : `il y a ${diffWeeks} semaines`
    }

    // Moins d'un an
    if (diffMonths < 12) {
      return diffMonths === 1
        ? 'il y a 1 mois'
        : `il y a ${diffMonths} mois`
    }

    // Plus d'un an
    return diffYears === 1
      ? 'il y a 1 an'
      : `il y a ${diffYears} ans`
  } catch {
    return 'Date invalide'
  }
}

/**
 * Formate une date pour un nom de fichier export : "2025-01-12_14h30"
 * @param {number|Date} timestamp
 * @returns {string}
 */
export function formatDateForFilename(timestamp) {
  try {
    const date = timestamp ? new Date(timestamp) : new Date()
    if (isNaN(date.getTime())) return 'date-inconnue'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}_${hours}h${minutes}`
  } catch {
    return 'date-inconnue'
  }
}

/**
 * Vérifie si un timestamp correspond à aujourd'hui
 * @param {number} timestamp
 * @returns {boolean}
 */
export function isToday(timestamp) {
  if (!timestamp) return false
  try {
    const date = new Date(timestamp)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  } catch {
    return false
  }
}

/**
 * Vérifie si un timestamp correspond à cette semaine
 * @param {number} timestamp
 * @returns {boolean}
 */
export function isThisWeek(timestamp) {
  if (!timestamp) return false
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays < 7
  } catch {
    return false
  }
}

/**
 * Groupe une liste d'éléments par période temporelle
 * Retourne un objet avec clés : 'Aujourd\'hui', 'Cette semaine', 'Ce mois', 'Plus ancien'
 * @param {Array} items - Éléments avec propriété updatedAt ou createdAt
 * @param {string} dateField - Champ de date à utiliser ('updatedAt' | 'createdAt')
 * @returns {Object}
 */
export function groupByTimePeriod(items, dateField = 'updatedAt') {
  const groups = {
    'Aujourd\'hui': [],
    'Cette semaine': [],
    'Ce mois': [],
    'Plus ancien': []
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfWeek = startOfToday - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 86400000
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  items.forEach(item => {
    const ts = item[dateField] ?? item.createdAt ?? 0

    if (ts >= startOfToday) {
      groups['Aujourd\'hui'].push(item)
    } else if (ts >= startOfWeek) {
      groups['Cette semaine'].push(item)
    } else if (ts >= startOfMonth) {
      groups['Ce mois'].push(item)
    } else {
      groups['Plus ancien'].push(item)
    }
  })

  // Filtre les groupes vides
  return Object.fromEntries(
    Object.entries(groups).filter(([, arr]) => arr.length > 0)
  )
}

/**
 * Retourne le timestamp actuel (alias sémantique)
 * @returns {number}
 */
export function now() {
  return Date.now()
}

/**
 * Retourne une date ISO formatée : "2025-01-12T14:30:00"
 * @param {number} timestamp
 * @returns {string}
 */
export function toISOLocal(timestamp) {
  if (!timestamp) return ''
  try {
    const date = new Date(timestamp)
    const offset = date.getTimezoneOffset()
    const local = new Date(date.getTime() - offset * 60000)
    return local.toISOString().slice(0, 19)
  } catch {
    return ''
  }
}
