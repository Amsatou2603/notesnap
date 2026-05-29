import { useState, useEffect } from 'react'
import './SplashScreen.css'

/**
 * SplashScreen — Écran de chargement moderne avec animation
 * 
 * - Fond dégradé #6C63FF → #3B82F6
 * - Logo NoteSnap centré
 * - Animation fade/scale fluide
 * - Durée ~500ms maximum
 * - Transition vers l'application
 */
function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // Animation d'entrée immédiate
    const entryTimer = setTimeout(() => {
      setIsAnimating(false)
    }, 50)

    // Transition vers l'application après 500ms
    const exitTimer = setTimeout(() => {
      setIsVisible(false)
      if (onComplete) {
        onComplete()
      }
    }, 500)

    return () => {
      clearTimeout(entryTimer)
      clearTimeout(exitTimer)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`splash-screen ${isAnimating ? 'splash-screen--entering' : 'splash-screen--exiting'}`}>
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
