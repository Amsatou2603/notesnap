import React from 'react'
import styles from './EmptyState.module.css'

/**
 * EmptyState — Composant d'état vide
 *
 * Affiché lorsqu'il n'y a aucune donnée à montrer
 * Supporte différentes variantes : notes, dossiers, recherche
 */
export default function EmptyState({ icon, title, description, action, variant = 'default' }) {
  return (
    <div className={`${styles.emptyState} ${styles[variant]}`}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
