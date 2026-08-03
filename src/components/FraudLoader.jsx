import { useEffect, useState } from 'react'
import { IoShieldCheckmark } from 'react-icons/io5'
import './FraudLoader.css'

// ── Real-Time Fraud-Scoring loader — Fee #9 ─────────────────────────────────
// Ticketmaster's ML risk engine "thinking": a violet NEURAL NETWORK fires
// signal pulses left→right, lighting nodes as they resolve, while a semicircular
// RISK GAUGE needle sweeps from red (high) toward green (low) and a numeric
// SCORE counts down to its final value. A "LOW RISK · CLEARED" chip stamps in
// at the end. AI / neural-neon aesthetic in deep indigo-violet — deliberately
// unlike the cyan datacenter loader. Pure CSS/SVG + one score interval (cleaned
// up on unmount). Auto-advances via onDone after `duration`.

// Network geometry (viewBox 0 0 192 148)
const IN_X = 26, HID_X = 98, OUT_X = 170
const IN_NODES  = [28, 62, 96, 130]
const HID_NODES = [45, 79, 113]
const OUT_Y     = 79

// input→hidden then hidden→output edges, indexed for a left-to-right cascade
const EDGES = []
IN_NODES.forEach((y1) =>
  HID_NODES.forEach((y2) =>
    EDGES.push({ x1: IN_X, y1, x2: HID_X, y2 })
  )
)
HID_NODES.forEach((y2) =>
  EDGES.push({ x1: HID_X, y1: y2, x2: OUT_X, y2: OUT_Y })
)

const START_SCORE = 87
const FINAL_SCORE = 6

const FraudLoader = ({ duration = 2400, onDone }) => {
  const [score, setScore]     = useState(START_SCORE)
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    const runFor = Math.max(400, duration - 480) // settle just before advancing
    const start  = performance.now()
    // small interval animates the risk score number down toward its final value
    const id = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / runFor)
      const e = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setScore(Math.round(START_SCORE + (FINAL_SCORE - START_SCORE) * e))
      if (t >= 1) {
        clearInterval(id)
        setCleared(true)
      }
    }, 45)
    const done = setTimeout(() => onDone?.(), duration)
    return () => {
      clearInterval(id)
      clearTimeout(done)
    }
  }, [duration, onDone])

  return (
    <div
      className="ldfraud-root"
      style={{ '--dur': `${duration}ms` }}
      aria-label="Scoring transfer risk"
      role="status"
    >
      <div className="ldfraud-aura" />

      {/* scattered background "signal" dots — thousands of behavioral signals */}
      <div className="ldfraud-signals" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="ldfraud-signal" style={{ '--i': i }} />
        ))}
      </div>

      <div className="ldfraud-stage">
        <div className="ldfraud-eyebrow">
          <span className="ldfraud-eyebrow-dot" />
          ML RISK ENGINE
        </div>

        {/* ── Neural network — signals fire left → right ── */}
        <svg
          className="ldfraud-net"
          viewBox="0 0 192 148"
          fill="none"
          aria-hidden="true"
        >
          {EDGES.map((e, i) => (
            <g key={i}>
              <line
                className="ldfraud-edge"
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              />
              <line
                className="ldfraud-edge-pulse"
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                style={{ '--i': i }}
              />
            </g>
          ))}

          {IN_NODES.map((y, i) => (
            <circle
              key={`in-${i}`}
              className="ldfraud-node"
              cx={IN_X} cy={y} r="6.5"
              style={{ '--i': i }}
            />
          ))}
          {HID_NODES.map((y, i) => (
            <circle
              key={`hid-${i}`}
              className="ldfraud-node"
              cx={HID_X} cy={y} r="7"
              style={{ '--i': i + 4 }}
            />
          ))}
          <circle
            className="ldfraud-node ldfraud-node--out"
            cx={OUT_X} cy={OUT_Y} r="9"
            style={{ '--i': 8 }}
          />
        </svg>

        {/* ── Risk gauge + live score ── */}
        <div className="ldfraud-gauge-wrap">
          <svg className="ldfraud-gauge" viewBox="0 0 200 118" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="ldfraudArc" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#F43F5E" />
                <stop offset="0.5" stopColor="#F59E0B" />
                <stop offset="1" stopColor="#34D399" />
              </linearGradient>
            </defs>
            {/* track + colored arc (semicircle) */}
            <path className="ldfraud-arc-track" d="M 20 100 A 80 80 0 0 1 180 100" />
            <path className="ldfraud-arc" d="M 20 100 A 80 80 0 0 1 180 100" />
            {/* end labels */}
            <text className="ldfraud-arc-end ldfraud-arc-end--hi" x="16" y="112">HIGH</text>
            <text className="ldfraud-arc-end ldfraud-arc-end--lo" x="184" y="112">LOW</text>
            {/* sweeping needle */}
            <g className="ldfraud-needle">
              <line x1="100" y1="100" x2="100" y2="34" />
              <circle className="ldfraud-needle-hub" cx="100" cy="100" r="7" />
            </g>
          </svg>

          <div className="ldfraud-score">
            <span className="ldfraud-score-num">{String(score).padStart(2, '0')}</span>
            <span className="ldfraud-score-den">/100</span>
          </div>
        </div>

        <div className={`ldfraud-chip ${cleared ? 'is-in' : ''}`}>
          <IoShieldCheckmark size={14} />
          LOW RISK · CLEARED
        </div>

        <p className="ldfraud-msg">
          Scoring transfer risk
          <span className="ldfraud-dots"><i>.</i><i>.</i><i>.</i></span>
        </p>
        <p className="ldfraud-sub">Real-time GPU risk analysis · model v4</p>
      </div>
    </div>
  )
}

export default FraudLoader
