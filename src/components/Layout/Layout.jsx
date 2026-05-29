import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import styles from './Layout.module.css'

/**
 * Layout — Layout principal avec bottom navigation
 *
 * Structure :
 * - Header avec titre et toggle thème
 * - Main content area
 * - Bottom navigation fixe
 */
export default function Layout({ children, title }) {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()

  const navItems = [
    { path: '/', label: 'Notes', icon: '📝' },
    { path: '/folders', label: 'Dossiers', icon: '📁' },
    { path: '/settings', label: 'Paramètres', icon: '⚙️' }
  ]

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{title}</h1>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {isDark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
