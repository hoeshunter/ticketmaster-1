import { useEffect } from 'react'
import './MarshalLoader.css'

// ── MarshalLoader — fire-marshal seat-manifest loader ───────────────────────
// Shown after the sender authorizes the capacity-compliance fee on EighthFee.
// A blueprint stadium SECTION strokes itself in (dashoffset draw over a cyan
// drafting grid), the seat grid then fills row-by-row, the transferred seat
// lights SAFETY AMBER with a pulsing ring, and an occupancy meter fills to a
// green "MANIFEST COMPLIANT" state. Pure CSS/SVG. Calls onDone after `duration`.
const ROWS = 4
const COLS = 8
const SEATS = Array.from({ length: ROWS * COLS }, (_, i) => ({
  row: Math.floor(i / COLS),
  col: i % COLS,
}))
// the seat being re-lodged on the manifest
const TARGET = { row: 2, col: 5 }

const MarshalLoader = ({ duration = 2200, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  return (
    <div className="ldmarshal-screen" role="status" aria-label="Updating fire-marshal manifest">
      <div className="ldmarshal-sheet">
        <span className="ldmarshal-sheet-tag">SEC 12 &mdash; OCCUPANCY MANIFEST</span>

        <svg className="ldmarshal-svg" viewBox="0 0 220 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* drafting grid */}
          <g className="ldmarshal-grid">
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`v${i}`} x1={22 * (i + 0)} y1="0" x2={22 * (i + 0)} y2="130" />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={26 * i} x2="220" y2={26 * i} />
            ))}
          </g>

          {/* section outline draws itself in */}
          <path
            className="ldmarshal-outline"
            pathLength="100"
            d="M30 118 L30 40 Q30 26 44 26 L176 26 Q190 26 190 40 L190 118 Z"
            fill="none"
          />

          {/* stage edge */}
          <line className="ldmarshal-stage" x1="58" y1="14" x2="162" y2="14" />

          {/* seats fill row-by-row */}
          <g className="ldmarshal-seats">
            {SEATS.map(({ row, col }, i) => {
              const isTarget = row === TARGET.row && col === TARGET.col
              return (
                <rect
                  key={i}
                  className={`ldmarshal-seat${isTarget ? ' ldmarshal-seat--target' : ''}`}
                  style={{ animationDelay: `${0.55 + row * 0.16 + col * 0.02}s` }}
                  x={44 + col * 17}
                  y={40 + row * 17}
                  width="12"
                  height="12"
                  rx="2.5"
                />
              )
            })}
            {/* pulsing compliance ring around the target seat */}
            <rect
              className="ldmarshal-target-ring"
              x={44 + TARGET.col * 17 - 3.5}
              y={40 + TARGET.row * 17 - 3.5}
              width="19"
              height="19"
              rx="5"
              fill="none"
            />
          </g>
        </svg>

        {/* occupancy meter */}
        <div className="ldmarshal-meter">
          <div className="ldmarshal-meter-track">
            <div className="ldmarshal-meter-fill" />
          </div>
          <span className="ldmarshal-meter-chip">MANIFEST COMPLIANT</span>
        </div>
      </div>

      <p className="ldmarshal-title">Re-lodging seat with fire-marshal manifest&hellip;</p>
      <p className="ldmarshal-sub">Capacity &amp; evacuation records updating</p>
    </div>
  )
}

export default MarshalLoader
