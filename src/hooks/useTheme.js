import { useState, useEffect, useCallback } from 'react'

/**
 * Hook useTheme — Gestion du thème dark/light avec persistance localStorage
 *
 * - Dark mode par défaut
 * - Préférence système respectée si pas de préférence sauvegardée
 * - Persisté dans localStorage sous la clé 'notesnap-theme'
 * - Applique l'attribut data-theme sur le document.documentElement
 *
 * Retourne :
 *   - theme        : 'dark' | 'light'
 *   - isDark       : boolean
 *   - toggleTheme  : () => void
 *   - setTheme     : (theme: 'dark' | 'light') => void
 */

const STORAGE_KEY = 'notesnap-theme'
const THEMES = { DARK: 'dark', LIGHT: 'light' }

/**
 * Lit la préférence initiale :
 * 1. localStorage (prioritaire)
 * 2. préférence système (prefers-color-scheme)
 * 3. dark par défaut
 */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === THEMES.DARK || saved === THEMES.LIGHT) {
      return saved
    }
  } catch {
    // localStorage peut être bloqué (mode privé restrictif sur certains navigateurs)
  }

  // Préférence système
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  ) {
    return THEMES.LIGHT
  }

  // Défaut : dark
  return THEMES.DARK
}

/**
 * Applique le thème sur le document
 */
function applyTheme(theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-theme', theme)

  // Mise à jour de la meta theme-color pour mobile
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === THEMES.DARK ? '#0f0f13' : '#f4f4f8'
    )
  }
}

/**
 * Sauvegarde la préférence
 */
function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Silencieux si localStorage indisponible
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const initial = getInitialTheme()
    // Appliquer immédiatement pour éviter le flash
    applyTheme(initial)
    return initial
  })

  // Synchronisation au montage (SSR safety)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Écoute les changements de préférence système
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (e) => {
      // Respecter la préférence système SEULEMENT si l'utilisateur n'a pas
      // explicitement choisi un thème dans l'application
      const saved = (() => {
        try {
          return localStorage.getItem(STORAGE_KEY)
        } catch {
          return null
        }
      })()

      if (!saved) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT
        setThemeState(newTheme)
        applyTheme(newTheme)
      }
    }

    // addEventListener avec fallback pour Safari < 14
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else {
      mediaQuery.addListener(handleSystemThemeChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else {
        mediaQuery.removeListener(handleSystemThemeChange)
      }
    }
  }, [])

  /**
   * Bascule entre dark et light
   */
  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
      applyTheme(next)
      saveTheme(next)
      return next
    })
  }, [])

  /**
   * Définit explicitement le thème
   * @param {'dark'|'light'} newTheme
   */
  const setTheme = useCallback((newTheme) => {
    if (newTheme !== THEMES.DARK && newTheme !== THEMES.LIGHT) {
      console.warn(`[useTheme] Valeur de thème invalide : "${newTheme}". Utilisez "dark" ou "light".`)
      return
    }
    setThemeState(newTheme)
    applyTheme(newTheme)
    saveTheme(newTheme)
  }, [])

  return {
    theme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
    toggleTheme,
    setTheme
  }
}

export default useTheme
