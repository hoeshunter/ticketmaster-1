import { useEffect, useState } from 'react'
import { IoScanOutline, IoLockOpenOutline } from 'react-icons/io5'
import './GateLoader.css'

// ── GateLoader ──────────────────────────────────────────────────────────────
// The bespoke loading animation for the Gate & Turnstile Provisioning Fee.
// A stadium turnstile ratchets (3 spokes clicking round in steps) while a green
// scanner beam sweeps a barcode that flips grey → turf-green as each stripe is
// "provisioned". Near the end it settles into a green GATE OPEN state. Pure
// CSS/SVG, own ldgate- prefix. MUST call onDone after `duration`.
const BARS = [3, 2, 5, 2, 3, 4, 2, 6, 3, 2, 4, 3, 2, 5, 2, 3, 3, 4, 2, 3, 5, 2, 4, 2, 3, 6, 2, 3, 4, 2]

const GateLoader = ({
  duration = 2200,
  onDone,
  message = 'Provisioning gate access…',
  sub = 'Registering the barcode with the turnstile network',
}) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const openAt = Math.max(300, duration - 640)
    const openTimer = setTimeout(() => setOpen(true), openAt)
    const doneTimer = setTimeout(() => onDone?.(), duration)
    return () => {
      clearTimeout(openTimer)
      clearTimeout(doneTimer)
    }
  }, [duration, onDone])

  const n = BARS.length

  return (
    <div className={`ldgate-screen ${open ? 'ldgate-screen--open' : ''}`} role="status" aria-live="polite">
      <div className="ldgate-flood ldgate-flood--l" />
      <div className="ldgate-flood ldgate-flood--r" />

      <div className="ldgate-stage">
        {/* Ratcheting turnstile */}
        <svg className="ldgate-turnstile" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="ldgate-ring" cx="60" cy="60" r="47" />
          <circle className="ldgate-ring ldgate-ring--inner" cx="60" cy="60" r="47" />
          <g className="ldgate-arms">
            <line x1="60" y1="60" x2="60" y2="17" />
            <line x1="60" y1="60" x2="97.2" y2="81.5" />
            <line x1="60" y1="60" x2="22.8" y2="81.5" />
          </g>
          <circle className="ldgate-hub" cx="60" cy="60" r="10" />
          <circle className="ldgate-hub-dot" cx="60" cy="60" r="3.4" />
        </svg>

        {/* Barcode being provisioned under a sweeping scanner beam */}
        <div className="ldgate-scan">
          <div className="ldgate-barcode">
            {BARS.map((w, i) => (
              <span
                key={i}
                className="ldgate-bar"
                style={{ '--w': w, '--p': n > 1 ? i / (n - 1) : 0 }}
              />
            ))}
            <div className="ldgate-beam" />
          </div>
          <div className="ldgate-scan-tag">
            <span className="ldgate-scan-tag__scanning"><IoScanOutline size={13} /> SCANNING</span>
            <span className="ldgate-scan-tag__open"><IoLockOpenOutline size={13} /> GATE OPEN</span>
          </div>
        </div>
      </div>

      <p className="ldgate-msg">{open ? 'Gate access granted' : message}</p>
      <p className="ldgate-sub">{open ? 'Turnstiles will now admit this barcode' : sub}</p>
    </div>
  )
}

export default GateLoader
