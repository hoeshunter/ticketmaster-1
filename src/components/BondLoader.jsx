import { useEffect } from 'react'
import './BondLoader.css'

// ── BondLoader — Verified Fan™ biometric verification loader ─────────────────
// Shown after the sender authorizes the Identity Assurance Bond on SeventhFee.
// A fingerprint whose ridge lines stroke in progressively (SVG stroke-dashoffset),
// a blue scan sweep passes over it, concentric radar rings pulse outward, and the
// print flips BLUE → GREEN ("human verified") ending on a shield-check badge.
// Pure CSS/SVG. Calls onDone once after `duration` ms.
//
// Concentric ridges open at the bottom (a stylised fingerprint). Each path is
// normalised with pathLength="100" so a single CSS keyframe draws them all; the
// per-ridge stagger comes from animationDelay below.
const RIDGES = [
  'M57 61.2 A6 6 0 1 1 63 61.2',
  'M54 66.39 A12 12 0 1 1 66 66.39',
  'M51 71.59 A18 18 0 1 1 69 71.59',
  'M48 76.78 A24 24 0 1 1 72 76.78',
  'M45 81.98 A30 30 0 1 1 75 81.98',
  'M42 87.17 A36 36 0 1 1 78 87.17',
]

const BondLoader = ({ duration = 2200, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  return (
    <div className="ldbond-screen" role="status" aria-label="Verifying you're a real fan">
      <div className="ldbond-stage">
        <div className="ldbond-glow" />
        <div className="ldbond-ring" />
        <div className="ldbond-ring ldbond-ring--2" />
        <div className="ldbond-ring ldbond-ring--3" />

        <div className="ldbond-fp">
          <svg className="ldbond-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g className="ldbond-ridges">
              {/* fingerprint core mark */}
              <path
                className="ldbond-ridge"
                pathLength="100"
                style={{ animationDelay: '0s' }}
                d="M60 52 q7 5 0 13"
              />
              {RIDGES.map((d, i) => (
                <path
                  key={i}
                  className="ldbond-ridge"
                  pathLength="100"
                  style={{ animationDelay: `${0.1 + i * 0.09}s` }}
                  d={d}
                />
              ))}
            </g>
          </svg>

          {/* downward scan sweep, clipped to the disc */}
          <div className="ldbond-scan" />

          {/* verified shield-check */}
          <div className="ldbond-shield" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2 20 5v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5l8-3Z"
                fill="currentColor"
              />
              <path
                d="M8.4 12 11 14.6 15.8 9.6"
                stroke="#EAFBF3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <p className="ldbond-title">Verifying you&rsquo;re a real fan&hellip;</p>
      <div className="ldbond-sub">
        <span className="ldbond-sub-scan">Analyzing your identity signature</span>
        <span className="ldbond-sub-done">Human verified &mdash; you&rsquo;re a real fan</span>
      </div>
    </div>
  )
}

export default BondLoader
