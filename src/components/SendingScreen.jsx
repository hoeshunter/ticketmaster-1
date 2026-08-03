import { useEffect } from 'react'
import { PiPaperPlaneTilt } from 'react-icons/pi'
import './SendingScreen.css'

// ── iOS-style "sending" loading screen ──────────────────────────────────────
// Sits between the launch splash and the result page: a recipient avatar with
// a paper-plane badge lifts in, an iOS activity spinner rotates, and the
// caption reads "We're sending one ticket to {name}". Reuses the global
// .ios-spinner blades from SplashScreen.css. Auto-advances via onDone.
const SendingScreen = ({ name = 'your recipient', duration = 3000, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  const initials =
    name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '•'

  return (
    <div className="ios-sending">
      <div className="ios-sending-inner">
        <div className="ios-sending-avatar">
          <span className="ios-sending-initials">{initials}</span>
          <span className="ios-sending-plane">
            <PiPaperPlaneTilt size={18} />
          </span>
        </div>

        <div className="ios-spinner" aria-label="Sending">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="ios-spinner-blade" style={{ '--i': i }} />
          ))}
        </div>

        <p className="ios-sending-text">
          We&rsquo;re sending one ticket to
          <br />
          <strong>{name}</strong>
        </p>
        <p className="ios-sending-sub">Securing the transfer&hellip;</p>
      </div>
    </div>
  )
}

export default SendingScreen
