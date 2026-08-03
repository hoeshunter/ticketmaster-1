import { useEffect } from 'react'
import './LoadingScreen.css'

// ── Generic iOS-style loading screen ────────────────────────────────────
// Sits between a confirm alert and a success/result screen. Reuses the
// global .ios-spinner blades (defined in SplashScreen.css) so it matches
// the splash screen's spinner exactly. Auto-advances via onDone.
const LoadingScreen = ({ text = 'Processing…', sub = '', duration = 1500, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  return (
    <div className="ios-loading">
      <div className="ios-spinner" aria-label="Loading">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="ios-spinner-blade" style={{ '--i': i }} />
        ))}
      </div>
      <p className="ios-loading-text">{text}</p>
      {sub && <p className="ios-loading-sub">{sub}</p>}
    </div>
  )
}

export default LoadingScreen
