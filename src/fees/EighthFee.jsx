import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  IoArrowBack,
  IoFlameOutline,
  IoShieldCheckmarkOutline,
  IoWarningOutline,
  IoPeopleOutline,
  IoAccessibilityOutline,
  IoExitOutline,
  IoLocationOutline,
} from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import ConfirmAlert from '../components/ConfirmAlert'
import MarshalLoader from '../components/MarshalLoader'
import './EighthFee.css'

// ── Fire-Marshal Capacity Compliance Fee (Fee #8) ───────────────────────────
// Reached from /seventhfee, hands off to /ninthfee. Direction: the VENUE's fire-
// marshal / life-safety office. Reassigning a seat to a new attendee means the
// seat has to be re-lodged against the venue's certified occupancy manifest so
// legal capacity, accessibility and evacuation records stay accurate for the
// person actually sitting there on event day. The safety office charges a flat
// per-seat re-lodging fee to update the certified manifest.
//
// Deliberately industrial: slate/concrete base, high-vis hazard AMBER accent and
// thin cyan blueprint grid lines — architectural drawings, not floodlights or
// luxury gold. Its own fmc- prefix and colour system.
const PER_SEAT = 15.75

// The three certified records that get re-lodged for the reassigned seat.
const RECORDS = [
  {
    Icon: IoPeopleOutline,
    title: 'Legal capacity count',
    note: 'Occupant re-attributed on the certified headcount.',
  },
  {
    Icon: IoAccessibilityOutline,
    title: 'Accessibility & ADA seating',
    note: 'Mobility / companion needs re-verified for the seat.',
  },
  {
    Icon: IoExitOutline,
    title: 'Evacuation & egress plan',
    note: 'Nearest exit route re-mapped to the new attendee.',
  },
]

const EighthFee = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('idle') // idle -> loading
  const [confirmOpen, setConfirmOpen] = useState(false)

  const event = state?.event || null
  const tickets = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const recipient = state?.recipient || {}
  const ticketCount = tickets.length || 1

  // Reached directly (refresh / no transfer in progress) — nothing to re-lodge.
  if (!event) {
    return (
      <div className="fmc-page fmc-page--empty">
        <div className="fmc-empty-inner">
          <span className="fmc-empty-badge">
            <MdOutlineConfirmationNumber size={34} />
          </span>
          <p className="fmc-empty-title">No Seat To Re-Lodge</p>
          <p className="fmc-empty-sub">
            Start a ticket transfer from one of your events and the fire-marshal
            capacity check will appear here.
          </p>
          <button className="fmc-empty-btn" onClick={() => navigate('/')}>
            Back To My Events
          </button>
        </div>
      </div>
    )
  }

  const recipientName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact = recipient.email || recipient.phone || ''
  const total = PER_SEAT * ticketCount
  const totalLabel = `$${total.toFixed(2)}`
  const seatWord = ticketCount === 1 ? 'seat' : 'seats'

  // Blueprint seat-map compliance check, then straight on to /ninthfee.
  if (phase === 'loading') {
    return (
      <MarshalLoader
        duration={2200}
        onDone={() => navigate('/ninthfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  const handleConfirmed = () => {
    setConfirmOpen(false)
    setPhase('loading')
  }

  return (
    <div className="fmc-page">
      {/* ── Header ── */}
      <div className="fmc-header">
        <button className="fmc-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
        </button>
        <div className="fmc-brand">
          <IoFlameOutline size={15} />
          <div className="fmc-brand-text">
            <strong>Fire-Marshal Safety Office</strong>
            <span>Occupancy &amp; Life-Safety Compliance</span>
          </div>
        </div>
        <span className="fmc-cert-badge">
          <IoShieldCheckmarkOutline size={11} /> CERTIFIED
        </span>
      </div>

      {/* Hazard chevron divider */}
      <div className="fmc-chevron-strip" aria-hidden="true" />

      <div className="fmc-body">
        {/* ── Hero compliance / occupancy card ── */}
        <div className="fmc-hero-card">
          <div className="fmc-hero-grid" aria-hidden="true" />
          <div className="fmc-hero-corner fmc-hero-corner--tl" aria-hidden="true" />
          <div className="fmc-hero-corner fmc-hero-corner--br" aria-hidden="true" />

          <p className="fmc-hero-eyebrow">Per-Seat Compliance Re-Lodging</p>
          <div className="fmc-amount-row">
            <span className="fmc-amount">{totalLabel}</span>
          </div>
          <p className="fmc-amount-break">
            <span>${PER_SEAT.toFixed(2)}</span> per seat &times; {ticketCount} {seatWord}
          </p>

          {/* Occupancy meter — fills to a certified/compliant state */}
          <div className="fmc-meter" role="img" aria-label="Occupancy manifest at certified capacity">
            <div className="fmc-meter-track">
              <div className="fmc-meter-fill">
                <span className="fmc-meter-hatch" />
              </div>
            </div>
            <div className="fmc-meter-labels">
              <span>OCCUPANCY MANIFEST</span>
              <span className="fmc-meter-state">CERTIFIED CAPACITY</span>
            </div>
          </div>

          <p className="fmc-hero-note">
            Charged by the <strong>Fire-Marshal Safety Office</strong> to re-lodge{' '}
            {ticketCount} {seatWord} against the certified occupancy manifest for {event.name}.
          </p>
        </div>

        {/* ── Why this fee ── */}
        <div className="fmc-reason-card">
          <div className="fmc-reason-icon">
            <IoWarningOutline size={18} />
          </div>
          <div className="fmc-reason-text">
            <p className="fmc-reason-title">Why the manifest must be re-lodged</p>
            <p className="fmc-reason-body">
              Reassigning a seat to a new attendee means that seat has to be re-lodged against{' '}
              {event.stadium ? <strong>{event.stadium}</strong> : 'the venue'}&rsquo;s
              fire-marshal occupancy manifest, so legal capacity, accessibility and evacuation
              records stay accurate for the person actually sitting there on event day. The
              safety office charges a flat per-seat fee to update the certified manifest.
            </p>
          </div>
        </div>

        {/* ── Records re-lodged ── */}
        <p className="fmc-section-title">Records re-lodged for this seat</p>
        <div className="fmc-record-list">
          {RECORDS.map(({ Icon, title, note }, i) => (
            <div key={title} className="fmc-record-row" style={{ '--i': i }}>
              <span className="fmc-record-icon">
                <Icon size={16} />
              </span>
              <div className="fmc-record-text">
                <p className="fmc-record-title">{title}</p>
                <p className="fmc-record-note">{note}</p>
              </div>
              <span className="fmc-record-flag">RE-LODGE</span>
            </div>
          ))}
        </div>

        {/* ── Seats on the manifest ── */}
        <p className="fmc-section-title">Seats on this manifest</p>
        <div className="fmc-seat-strip">
          {tickets.length === 0 ? (
            <p className="fmc-seat-empty">No seats selected.</p>
          ) : (
            tickets.map((t, idx) => (
              <div key={idx} className="fmc-seat-chip">
                <IoLocationOutline size={13} />
                <span className="fmc-seat-chip-main">
                  Sec {t.section || '—'} · Row {t.row || '—'}
                </span>
                <span className="fmc-seat-chip-seat">Seat {t.seat || '—'}</span>
              </div>
            ))
          )}
        </div>

        {/* ── Recipient ── */}
        <p className="fmc-section-title">Seat re-lodged to</p>
        <div className="fmc-recipient-card">
          <div className="fmc-recipient-avatar">
            <IoPeopleOutline size={18} />
          </div>
          <div className="fmc-recipient-main">
            <p className="fmc-recipient-name">{recipientName || 'Recipient'}</p>
            {recipientContact && <p className="fmc-recipient-contact">{recipientContact}</p>}
          </div>
          <span className="fmc-recipient-tag">New occupant</span>
        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div className="fmc-footer">
        <button className="fmc-pay-btn" onClick={() => setConfirmOpen(true)}>
          <IoShieldCheckmarkOutline size={16} />
          Re-Lodge &amp; Pay {totalLabel}
        </button>
        <p className="fmc-fineprint">
          A per-seat capacity-compliance charge from the venue&rsquo;s safety office.{' '}
          {recipientName || 'Your recipient'} pays nothing to be seated.
        </p>
      </div>

      {confirmOpen && (
        <ConfirmAlert
          title="Re-Lodge Seat Manifest"
          message={`Pay ${totalLabel} to re-lodge ${ticketCount} ${seatWord} against the fire-marshal occupancy manifest for ${recipientName || 'your recipient'}?`}
          confirmLabel={`Pay ${totalLabel}`}
          cancelLabel="Cancel"
          onConfirm={handleConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default EighthFee
