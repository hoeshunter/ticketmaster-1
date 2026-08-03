import { useEffect, useState } from 'react'

// ── iOS-style launch screen ────────────────────────────────────────────────
// Mimics an iPhone app cold-start: the app icon eases in with the subtle
// spring/scale iOS uses, a genuine iOS activity spinner (12 tapered spokes
// with trailing fade) rotates below it, then the whole screen cross-fades
// away after ~2s to reveal the app.
const SplashScreen = ({ onDone, duration = 2000 }) => {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Start the fade-out slightly before the end so the reveal feels seamless
    const fadeAt = Math.max(0, duration - 380)
    const fadeTimer = setTimeout(() => setLeaving(true), fadeAt)
    const doneTimer = setTimeout(() => onDone?.(), duration)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [duration, onDone])

  return (
    <div className={`ios-splash ${leaving ? 'ios-splash--leaving' : ''}`}>
      <div className="ios-splash-inner">
        <img
          src="/icons/icon-192x192.png"
          alt=""
          className="ios-splash-icon"
          draggable="false"
        />
        <div className="ios-spinner" aria-label="Loading">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="ios-spinner-blade" style={{ '--i': i }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
