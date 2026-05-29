import { useState, useEffect, useRef } from 'react'
import './SplashScreen.css'

/**
 * SplashScreen — Écran de chargement premium avec animation séquencée
 * 
 * - Fond dégradé #6C63FF → #3B82F6
 * - Logo NoteSnap centré avec animation fade-in + scale-up
 * - Texte "NoteSnap" avec apparition différée
 * - Effet glow/subtle pulse sur le logo
 * - Transition de sortie progressive avec blur
 * - Durée totale : 2.5 à 3 secondes
 * - Nettoyage correct des timers pour éviter memory leaks
 */
function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true)
  const [phase, setPhase] = useState('entering') // entering, visible, exiting
  const timersRef = useRef([])

  useEffect(() => {
    // Nettoyer tous les timers au démontage
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  useEffect(() => {
    // Phase 1: Entrée du splash screen (fade-in)
    const enterTimer = setTimeout(() => {
      setPhase('visible')
    }, 100)
    timersRef.current.push(enterTimer)

    // Phase 2: Début de la sortie après 2.5 secondes
    const exitStartTimer = setTimeout(() => {
      setPhase('exiting')
    }, 2500)
    timersRef.current.push(exitStartTimer)

    // Phase 3: Fin de la sortie et appel onComplete après 3 secondes
    const exitEndTimer = setTimeout(() => {
      setIsVisible(false)
      if (onComplete) {
        onComplete()
      }
    }, 3000)
    timersRef.current.push(exitEndTimer)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitStartTimer)
      clearTimeout(exitEndTimer)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`splash-screen splash-screen--${phase}`}>
      <div className="splash-screen__content">
        <div className="splash-screen__logo">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="splash-screen__logo-svg"
          >
            <rect
              x="8"
              y="8"
              width="64"
              height="64"
              rx="16"
              fill="url(#splash-gradient)"
            />
            <path
              d="M24 32H56M24 40H48M24 48H40"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="splash-gradient"
                x1="8"
                y1="8"
                x2="72"
                y2="72"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#6C63FF" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="splash-screen__title">NoteSnap</h1>
      </div>
    </div>
  )
}

export default SplashScreen
