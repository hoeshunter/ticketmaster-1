import { useEffect } from 'react'
import './ConfirmationScreen.css'

// ── iOS-style success confirmation ──────────────────────────────────────────
// The classic Apple Pay / system confirmation pattern: a circle strokes in,
// then a checkmark draws inside it, then the caption fades in. Auto-advances
// via onDone after `duration`.
const ConfirmationScreen = ({ text = 'Done', duration = 1400, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  return (
    <div className="ios-confirm">
      <svg className="ios-confirm-check" viewBox="0 0 80 80">
        <circle className="ios-confirm-circle" cx="40" cy="40" r="36" fill="none" />
        <path className="ios-confirm-tick" d="M24 42 L35 53 L57 29" fill="none" />
      </svg>
      <p className="ios-confirm-text">{text}</p>
    </div>
  )
}

export default ConfirmationScreen
