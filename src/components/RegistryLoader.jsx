import { useEffect } from 'react'
import { IoCheckmarkSharp } from 'react-icons/io5'
import './RegistryLoader.css'

// ── Fan Registry Clearance loader ───────────────────────────────────────────
// A heritage supporters-club "membership verification" animation, built for
// SixthFee.jsx and nothing else in the flow. A parchment MEMBERSHIP / REGISTRY
// card slides in; a gold SCAN LINE sweeps across it; three clearance rows tick
// green one-by-one (Identity → Registry match → Watchlist clear); then a
// circular club CREST/SEAL stamps down with a bounce and a glow. Pure CSS/SVG.
// Auto-advances via onDone after `duration`.
const CHECKS = [
  { label: 'Identity', note: 'Name & contact matched' },
  { label: 'Registry match', note: 'Season-ticket-holder record' },
  { label: 'Watchlist — clear', note: 'No resale / venue flags' },
]

const RegistryLoader = ({ duration = 2200, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  return (
    <div className="ldreg-stage" aria-label="Clearing fan registry">
      <div className="ldreg-card">
        <div className="ldreg-card-sheen" />

        {/* Card header — crest + registry title */}
        <div className="ldreg-card-head">
          <span className="ldreg-card-crest">
            <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
              <path
                d="M20 3 L34 8 V20 C34 28.5 27.8 34.4 20 37 C12.2 34.4 6 28.5 6 20 V8 Z"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
              />
              <path d="M20 12.5 l2.1 4.6 5 .5 -3.8 3.4 1.1 5 -4.4 -2.6 -4.4 2.6 1.1 -5 -3.8 -3.4 5 -.5 Z"
                fill="currentColor" />
            </svg>
          </span>
          <div className="ldreg-card-titles">
            <p className="ldreg-card-kicker">Season-Ticket-Holder</p>
            <p className="ldreg-card-title">Registry Card</p>
          </div>
          <span className="ldreg-card-serial">No. 07 41 92</span>
        </div>

        {/* Card body — silhouette + redacted holder lines */}
        <div className="ldreg-card-holder">
          <span className="ldreg-card-photo">
            <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
              <circle cx="16" cy="12" r="6.4" fill="currentColor" />
              <path d="M4 30 C4 22.5 9.5 19 16 19 C22.5 19 28 22.5 28 30 Z" fill="currentColor" />
            </svg>
          </span>
          <div className="ldreg-card-lines">
            <span className="ldreg-card-line ldreg-card-line--w1" />
            <span className="ldreg-card-line ldreg-card-line--w2" />
            <span className="ldreg-card-line ldreg-card-line--w3" />
          </div>
        </div>

        {/* Clearance checklist — ticks in sequence */}
        <ul className="ldreg-checks">
          {CHECKS.map((c, i) => (
            <li key={c.label} className="ldreg-check" style={{ '--i': i }}>
              <span className="ldreg-check-box">
                <IoCheckmarkSharp className="ldreg-check-tick" size={13} />
              </span>
              <span className="ldreg-check-text">
                <span className="ldreg-check-label">{c.label}</span>
                <span className="ldreg-check-note">{c.note}</span>
              </span>
              <span className="ldreg-check-flag">CLEARED</span>
            </li>
          ))}
        </ul>

        {/* Sweeping scan line */}
        <div className="ldreg-scan" />

        {/* Stamped club seal */}
        <div className="ldreg-seal" aria-hidden="true">
          <svg viewBox="0 0 96 96" width="86" height="86">
            <circle cx="48" cy="48" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" strokeWidth="1"
              strokeDasharray="2 4" />
            <path
              d="M48 20 L60 25 V42 C60 52 54.5 59.5 48 62 C41.5 59.5 36 52 36 42 V25 Z"
              fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"
            />
            <path d="M48 31 l2.4 5.2 5.7 .5 -4.3 3.8 1.3 5.6 -4.9 -3 -4.9 3 1.3 -5.6 -4.3 -3.8 5.7 -.5 Z"
              fill="currentColor" />
          </svg>
        </div>
      </div>

      <p className="ldreg-caption">
        Clearing fan registry<span className="ldreg-dots"><i>.</i><i>.</i><i>.</i></span>
      </p>
      <p className="ldreg-subcaption">Supporter Relations Office</p>
    </div>
  )
}

export default RegistryLoader
