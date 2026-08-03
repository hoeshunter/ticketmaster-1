import { useEffect, useState } from 'react'
import './LedgerLoader.css'

// ── Ledger Sync loader (Fee #5) ─────────────────────────────────────────────
// Datacenter/server aesthetic. Three synchronised animations sell "committing
// the transfer to a distributed backend":
//   1. A hexadecimal token hash whose characters rapidly SCRAMBLE, then lock in
//      left-to-right until they RESOLVE into a final checksum.
//   2. An SVG mesh of server NODES wired together; a pulse walks node→node and
//      each node flips to a cyan "synced ✓" state as the ledger propagates.
//   3. A "BLOCK X / N COMMITTED" counter ticking up.
// Everything is driven by one setInterval that reads elapsed time, so a single
// clearInterval + clearTimeout tears it all down. onDone fires after `duration`.

const HEX = '0123456789abcdef'
const HASH_LEN = 32
const FINAL_HASH = '7f3ac9e1b0d84526af71c9e0b3d2f4a8'
const NODE_TOTAL = 6
const BLOCK_TOTAL = 8

// Server-mesh layout (viewBox 0 0 260 130).
const POS = [
  { x: 26, y: 65 },
  { x: 78, y: 26 },
  { x: 78, y: 104 },
  { x: 182, y: 26 },
  { x: 182, y: 104 },
  { x: 234, y: 65 },
]
// Order the pulse travels through the mesh.
const ORDER = [0, 1, 3, 5, 4, 2]
const ORDER_POS = ORDER.reduce((acc, n, i) => ((acc[n] = i), acc), {})
const EDGES = ORDER.slice(0, -1).map((n, i) => [n, ORDER[i + 1]])

const randHex = (n) => {
  let s = ''
  for (let i = 0; i < n; i++) s += HEX[(Math.random() * 16) | 0]
  return s
}

const LedgerLoader = ({ duration = 2200, onDone }) => {
  const [hash, setHash] = useState(() => randHex(HASH_LEN))
  const [resolved, setResolved] = useState(0) // chars locked in
  const [synced, setSynced] = useState(0) // nodes synced
  const [blocks, setBlocks] = useState(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const start = Date.now()
    const id = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const lockCount = Math.floor(Math.min(p / 0.82, 1) * HASH_LEN)

      setResolved(lockCount)
      setSynced(Math.min(NODE_TOTAL, Math.floor(p * NODE_TOTAL + 0.0001)))
      setBlocks(Math.max(1, Math.ceil(p * BLOCK_TOTAL)))

      const locked = FINAL_HASH.slice(0, lockCount)
      const rest = reduce
        ? '·'.repeat(HASH_LEN - lockCount)
        : randHex(HASH_LEN - lockCount)
      setHash(locked + rest)
    }, 55)

    const done = setTimeout(() => onDone?.(), duration)
    return () => {
      clearInterval(id)
      clearTimeout(done)
    }
  }, [duration, onDone])

  return (
    <div className="ldledger-root">
      <div className="ldledger-grid" aria-hidden="true" />

      <div className="ldledger-stage">
        <p className="ldledger-eyebrow">
          <span className="ldledger-dot" /> DISTRIBUTED LEDGER
        </p>

        {/* ── Server mesh ── */}
        <svg
          className="ldledger-mesh"
          viewBox="0 0 260 130"
          role="img"
          aria-label="Servers synchronising"
        >
          {/* base wiring */}
          {EDGES.map(([a, b], i) => (
            <line
              key={`base-${i}`}
              className="ldledger-wire"
              x1={POS[a].x}
              y1={POS[a].y}
              x2={POS[b].x}
              y2={POS[b].y}
            />
          ))}
          {/* committed + pulsing wires */}
          {EDGES.map(([a, b], i) => {
            const committed = i <= synced - 2
            const pulsing = i === synced - 1
            if (!committed && !pulsing) return null
            return (
              <line
                key={`live-${i}`}
                className={`ldledger-wire-live${pulsing ? ' ldledger-wire-live--pulse' : ''}`}
                x1={POS[a].x}
                y1={POS[a].y}
                x2={POS[b].x}
                y2={POS[b].y}
              />
            )
          })}
          {/* nodes */}
          {POS.map((p, n) => {
            const isSynced = ORDER_POS[n] < synced
            const isActive = ORDER_POS[n] === synced - 1
            return (
              <g key={`node-${n}`}>
                {isActive && (
                  <circle
                    className="ldledger-node-ping"
                    cx={p.x}
                    cy={p.y}
                    r="11"
                  />
                )}
                <circle
                  className={`ldledger-node${isSynced ? ' ldledger-node--on' : ''}`}
                  cx={p.x}
                  cy={p.y}
                  r="9"
                />
                {isSynced && (
                  <path
                    className="ldledger-check"
                    d={`M ${p.x - 3.4} ${p.y + 0.2} L ${p.x - 0.8} ${p.y + 2.8} L ${p.x + 3.8} ${p.y - 2.8}`}
                  />
                )}
              </g>
            )
          })}
        </svg>

        {/* ── Token hash ── */}
        <div className="ldledger-hash-wrap">
          <span className="ldledger-hash-label">SHA</span>
          <code className="ldledger-hash">
            <span className="ldledger-hash-lock">{hash.slice(0, resolved)}</span>
            <span className="ldledger-hash-scramble">{hash.slice(resolved)}</span>
          </code>
        </div>

        {/* ── Block counter ── */}
        <p className="ldledger-blocks">
          BLOCK <b>{blocks}</b> / {BLOCK_TOTAL} COMMITTED
        </p>

        <p className="ldledger-msg">Re-encrypting barcode · syncing ledger…</p>
      </div>
    </div>
  )
}

export default LedgerLoader
