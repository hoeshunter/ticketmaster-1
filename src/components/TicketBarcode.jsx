import { useEffect, useMemo, useRef, useState } from 'react'
import { IoLockClosedOutline, IoEyeOutline, IoShieldCheckmarkOutline, IoPaperPlaneOutline } from 'react-icons/io5'
import { TbRefresh } from 'react-icons/tb'
import ConfirmAlert from './ConfirmAlert'
import './TicketBarcode.css'

// ── Deterministic xorshift32 PRNG ───────────────────────────────────────────
// Seeded by the ticket + a generation counter, so the same ticket always draws
// the same barcode until it's explicitly regenerated (generation++), and a
// regenerated barcode is reproducibly different, not just re-randomized noise.
const seededRandom = (seed) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0
  let state = h || 0x9e3779b9
  return () => {
    state ^= state << 13; state |= 0
    state ^= state >>> 17
    state ^= state << 5; state |= 0
    return ((state >>> 0) % 1000) / 1000
  }
}

const HEX = '0123456789ABCDEF'

// Builds the bar widths + a human-readable entry code from one seed string.
const buildBarcode = (seed) => {
  const rand = seededRandom(seed)
  const bars = Array.from({ length: 52 }, () => 1 + Math.floor(rand() * 3)) // 1–3 unit widths
  let code = ''
  for (let i = 0; i < 12; i++) code += HEX[Math.floor(rand() * 16)]
  const formatted = `${code.slice(0, 4)} ${code.slice(4, 8)} ${code.slice(8, 12)}`
  return { bars, code: formatted }
}

const AUTO_HIDE_MS = 25000

// ── TicketBarcode ────────────────────────────────────────────────────────────
// A single ticket rendered as a classic Ticketmaster SafeTix stub: a white
// perforated ticket card — seat details on top, a dashed tear line with
// punched side-notches, and the scannable barcode on the bottom half. The
// barcode sits behind a privacy cover until "View" is tapped (auto re-covers
// after inactivity), and a refresh control regenerates the code behind a
// confirmation, since the old barcode stops scanning the moment it changes.
const TicketBarcode = ({ ticket, event, index = 0 }) => {
  const [generation, setGeneration] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [justRegenerated, setJustRegenerated] = useState(false)
  const hideTimer = useRef(null)
  const regenChipTimer = useRef(null)

  const seed = `${event?.orderNum || event?.id || 'TM'}-${ticket.section}-${ticket.row}-${ticket.seat}-${index}-${generation}`
  const { bars, code } = useMemo(() => buildBarcode(seed), [seed])

  // Auto re-cover the barcode after a period of inactivity — the barcode is
  // an entry credential, so it shouldn't stay exposed on screen indefinitely.
  useEffect(() => {
    if (!revealed) return
    hideTimer.current = setTimeout(() => setRevealed(false), AUTO_HIDE_MS)
    return () => clearTimeout(hideTimer.current)
  }, [revealed])

  useEffect(() => () => clearTimeout(regenChipTimer.current), [])

  const handleRegenerateConfirmed = () => {
    setConfirmOpen(false)
    setRevealed(false)
    setRefreshing(true)
    setTimeout(() => {
      setGeneration((g) => g + 1)
      setRefreshing(false)
      setJustRegenerated(true)
      regenChipTimer.current = setTimeout(() => setJustRegenerated(false), 2600)
    }, 900)
  }

  // ── Sent state ───────────────────────────────────────────────────────────
  // Once the admin marks this ticket sent, its barcode is no longer this
  // holder's to view or scan — swap the whole bottom half for a muted
  // "Sent" panel instead of ever rendering a (now-inactive) barcode.
  if (ticket.sent) {
    const sentDate = ticket.sentAt
      ? new Date(ticket.sentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : null

    return (
      <div className="bct-stub bct-stub--sent">
        <span className="bct-sent-ribbon">SENT</span>

        <div className="bct-stub-top">
          <div className="bct-stub-info">
            {ticket.label && <p className="bct-label">{ticket.label}</p>}
            <p className="bct-event-name">{event?.name}</p>
            <p className="bct-event-meta">
              {event?.day} &bull; {event?.date} &bull; {event?.stadium}
            </p>
          </div>
        </div>

        <div className="bct-fields">
          <div className="bct-field">
            <span className="bct-field-label">SECTION</span>
            <span className="bct-field-value">{ticket.section}</span>
          </div>
          <div className="bct-field">
            <span className="bct-field-label">ROW</span>
            <span className="bct-field-value">{ticket.row}</span>
          </div>
          <div className="bct-field">
            <span className="bct-field-label">SEAT</span>
            <span className="bct-field-value">{ticket.seat}</span>
          </div>
        </div>

        <div className="bct-tear">
          <span className="bct-notch bct-notch--left" />
          <span className="bct-tear-line" />
          <span className="bct-notch bct-notch--right" />
        </div>

        <div className="bct-sent-panel">
          <IoPaperPlaneOutline size={26} className="bct-sent-icon" />
          <p className="bct-sent-title">Ticket Sent</p>
          <p className="bct-sent-sub">
            This ticket has been transferred to its recipient{sentDate ? ` on ${sentDate}` : ''} and
            its barcode is no longer active on this device.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bct-stub">
      {/* ── Seat details (top half of the stub) ── */}
      <div className="bct-stub-top">
        <div className="bct-stub-info">
          {ticket.label && <p className="bct-label">{ticket.label}</p>}
          <p className="bct-event-name">{event?.name}</p>
          <p className="bct-event-meta">
            {event?.day} &bull; {event?.date} &bull; {event?.stadium}
          </p>
        </div>
        <button
          className={`bct-refresh-btn ${refreshing ? 'bct-refresh-btn--spinning' : ''}`}
          onClick={() => setConfirmOpen(true)}
          disabled={refreshing}
          aria-label="Regenerate barcode"
        >
          <TbRefresh size={15} />
        </button>
      </div>

      <div className="bct-fields">
        <div className="bct-field">
          <span className="bct-field-label">SECTION</span>
          <span className="bct-field-value">{ticket.section}</span>
        </div>
        <div className="bct-field">
          <span className="bct-field-label">ROW</span>
          <span className="bct-field-value">{ticket.row}</span>
        </div>
        <div className="bct-field">
          <span className="bct-field-label">SEAT</span>
          <span className="bct-field-value">{ticket.seat}</span>
        </div>
      </div>

      {/* ── Perforated tear line with punched notches ── */}
      <div className="bct-tear">
        <span className="bct-notch bct-notch--left" />
        <span className="bct-tear-line" />
        <span className="bct-notch bct-notch--right" />
      </div>

      {/* ── Barcode (bottom half of the stub) ── */}
      <div className="bct-barcode-frame">
        <div className="bct-barcode-visual">
          <div className="bct-bars" aria-hidden="true">
            {bars.map((w, i) => (
              <span
                key={i}
                className={i % 2 === 0 ? 'bct-bar' : 'bct-gap'}
                style={{ flexGrow: w }}
              />
            ))}
          </div>
          <p className="bct-code">{code}</p>
        </div>

        <div className={`bct-cover ${revealed ? 'bct-cover--open' : ''}`}>
          <IoLockClosedOutline size={24} className="bct-cover-icon" />
          <p className="bct-cover-title">Barcode Hidden</p>
          <p className="bct-cover-sub">Tap View to reveal your entry barcode</p>
          <button className="bct-view-btn" onClick={() => setRevealed(true)}>
            <IoEyeOutline size={16} /> View Barcode
          </button>
          <p className="bct-cover-warn">Do not share your barcode with anyone.</p>
        </div>

        {revealed && (
          <button className="bct-hide-btn" onClick={() => setRevealed(false)}>
            Hide Barcode
          </button>
        )}
      </div>

      {justRegenerated && <p className="bct-regen-chip">✓ Barcode regenerated</p>}

      {/* ── SafeTix branding strip ── */}
      <div className="bct-safetix">
        <IoShieldCheckmarkOutline size={14} className="bct-safetix-icon" />
        <span className="bct-safetix-label">Protected by SafeTix&reg;</span>
      </div>
      <p className="bct-safety-text">
        Protect your barcode — scan only at the event gate or official ticket-scanning point.
        Screenshots can be copied and used by scammers, which may invalidate your entry.
      </p>

      {confirmOpen && (
        <ConfirmAlert
          title="Regenerate Barcode?"
          message="Your current barcode will stop working immediately and this can't be undone. Only do this if you think your barcode has been shared or compromised."
          confirmLabel="Regenerate"
          cancelLabel="Cancel"
          onConfirm={handleRegenerateConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default TicketBarcode
