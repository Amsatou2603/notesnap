import React, { useState, useRef, useEffect } from 'react'
import styles from './SearchBar.module.css'

/**
 * SearchBar — Barre de recherche avec filtres
 *
 * Fonctionnalités :
 * - Recherche en temps réel
 * - Bouton pour effacer
 * - Placeholder animé
 * - Focus avec glassmorphism
 */
export default function SearchBar({ value, onChange, placeholder = 'Rechercher...', autoFocus = false }) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={`${styles.searchBar} ${focused ? styles.focused : ''}`}>
      <div className={styles.icon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearButton}
          aria-label="Effacer la recherche"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
