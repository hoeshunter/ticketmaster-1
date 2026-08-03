import { useEffect } from 'react'
import './ReleaseLoader.css'

// ── Ticket Dispatch loader ──────────────────────────────────────────────────
// Built exclusively for TenthFee.jsx (Fee #10 — the finale). A single-shot,
// celebratory "your ticket is on its way" narrative rendered in pure CSS/SVG:
//   1. a barcode TICKET lifts off and floats above an open envelope,
//   2. it slides DOWN into the envelope mouth and fades as it seats,
//   3. the gold FLAP folds shut (3D rotateX fold) and a wax SEAL stamps down,
//   4. the sealed envelope WHOOSHES away toward the recipient with a
//      gold SPARKLE burst left behind.
// Distinct gold/ivory/blue palette + own ldrel- prefix. Auto-advances via
// onDone after `duration` (default 2600ms) with a cleaned-up setTimeout.
const SPARKS = Array.from({ length: 11 }, (_, i) => i)

const ReleaseLoader = ({ duration = 2600, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  return (
    <div className="ldrel-stage" aria-label="Releasing your tickets">
      <div className="ldrel-scene">
        {/* radial gold burst that flashes when the seal stamps */}
        <div className="ldrel-burst" aria-hidden="true" />

        {/* the group that flies off toward the recipient at the end */}
        <div className="ldrel-dispatch">
          <div className="ldrel-envelope">
            {/* envelope back / front pocket */}
            <div className="ldrel-env-body">
              <span className="ldrel-env-seam ldrel-env-seam--l" />
              <span className="ldrel-env-seam ldrel-env-seam--r" />
            </div>

            {/* the ticket that lifts off and slides in */}
            <div className="ldrel-ticket">
              <span className="ldrel-ticket-stub">
                <svg viewBox="0 0 20 40" width="14" height="26" aria-hidden="true">
                  <path
                    d="M10 4 l1.4 3.1 3.4 .3 -2.6 2.3 .8 3.3 -3-1.8 -3 1.8 .8-3.3 -2.6-2.3 3.4-.3 Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="ldrel-ticket-perf" />
              <span className="ldrel-ticket-barcode" />
              <span className="ldrel-ticket-shine" />
            </div>

            {/* gold flap that folds down to seal */}
            <div className="ldrel-env-flap" aria-hidden="true" />

            {/* stamped wax seal */}
            <div className="ldrel-env-seal" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="30" height="30">
                <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1.5 3" />
                <path
                  d="M24 9 l4.6 9.3 10.3 1.5 -7.4 7.3 1.7 10.2 -9.2 -4.8 -9.2 4.8 1.7 -10.2 -7.4 -7.3 10.3 -1.5 Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* sparkle burst left behind as the envelope departs */}
        <div className="ldrel-sparks" aria-hidden="true">
          {SPARKS.map((i) => (
            <i key={i} className="ldrel-spark" style={{ '--a': `${(360 / SPARKS.length) * i}deg` }} />
          ))}
        </div>
      </div>

      <p className="ldrel-caption">
        Releasing your tickets<span className="ldrel-dots"><i>.</i><i>.</i><i>.</i></span>
      </p>
      <p className="ldrel-subcaption">Final Transfer Release &amp; Dispatch</p>
    </div>
  )
}

export default ReleaseLoader
