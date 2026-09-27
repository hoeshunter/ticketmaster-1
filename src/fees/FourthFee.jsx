import { useState } from 'react'
import {
  IoArrowBack,
  IoScanOutline,
  IoShieldCheckmarkOutline,
  IoTicketOutline,
  IoRadioOutline,
} from 'react-icons/io5'
import { MdSensorDoor, MdOutlineConfirmationNumber } from 'react-icons/md'
import { PiBarcode } from 'react-icons/pi'
import { useLocation, useNavigate } from 'react-router-dom'
import ConfirmAlert from '../components/ConfirmAlert'
import GateLoader from '../components/GateLoader'
import './FourthFee.css'

// ── Gate & Turnstile Provisioning Fee (Fee #4) ──────────────────────────────
// Reached from /thirdfee. This is the STADIUM's charge: the venue's gate
// operations team must load the recipient's re-issued barcode into the
// turnstile / gate-scanner network so it authorizes entry on event day. Until
// the barcode is registered with access control, the turnstiles reject it.
// Priced per ticket/scanner. Presented as a floodlit "stadium-at-night" access
// panel — charcoal field, turf-green accents. Hands off unchanged to /fifthfee.
const PER_TICKET = 133.75
const GATE_DEPT = 'Gate Operations & Access Control'

const FourthFee = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('idle') // idle -> loading
  const [confirmOpen, setConfirmOpen] = useState(false)

  const event = state?.event || null
  const tickets = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const recipient = state?.recipient || {}
  const ticketCount = tickets.length || 1

  // Reached directly / no transfer in flight
  if (!event) {
    return (
      <div className="gtp-page gtp-page--empty">
        <div className="gtp-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#22C55E" />
          <p className="gtp-empty-title">No Transfer In Progress</p>
          <p className="gtp-empty-sub">
            Start a ticket transfer to provision gate access for your recipient here.
          </p>
          <button className="gtp-empty-btn" onClick={() => navigate('/')}>Back To My Events</button>
        </div>
      </div>
    )
  }

  // Provisioning loader → hand off unchanged to the next fee
  if (phase === 'loading') {
    return (
      <GateLoader
        duration={2200}
        message="Provisioning gate access…"
        sub={`Writing the barcode to ${ticketCount} turnstile scanner${ticketCount !== 1 ? 's' : ''}`}
        onDone={() => navigate('/fifthfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  const recipientName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact = recipient.email || recipient.phone || ''
  const perLabel = `$${PER_TICKET.toFixed(2)}`
  const total = PER_TICKET * ticketCount
  const totalLabel = `$${total.toFixed(2)}`

  const handleConfirmed = () => {
    setConfirmOpen(false)
    setPhase('loading')
  }

  return (
    <div className="gtp-page">
      {/* ── Header ── */}
      <div className="gtp-header">
        <button className="gtp-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
        </button>
        <div className="gtp-brand">
          <MdSensorDoor size={16} />
          <span>{GATE_DEPT}</span>
        </div>
        <span className="gtp-live">
          <span className="gtp-live-dot" /> LIVE
        </span>
      </div>

      <div className="gtp-body">
        {/* ── Hero amount / floodlit field ── */}
        <div className="gtp-hero">
          <div className="gtp-hero-field" />
          <div className="gtp-hero-glow" />
          <p className="gtp-hero-eyebrow">
            <IoScanOutline size={13} /> GATE &amp; TURNSTILE PROVISIONING
          </p>
          <p className="gtp-hero-amount">{totalLabel}</p>
          <div className="gtp-hero-break">
            <span className="gtp-hero-chip">{perLabel} / ticket</span>
            <span className="gtp-hero-x">&times;</span>
            <span className="gtp-hero-chip">{ticketCount} scanner{ticketCount !== 1 ? 's' : ''}</span>
          </div>
          <p className="gtp-hero-note">
            Charged once by <strong>{event.stadium}</strong> gate operations to register{' '}
            {ticketCount} barcode{ticketCount !== 1 ? 's' : ''} for <strong>{event.name}</strong>.
          </p>
        </div>

        {/* ── Why the gate provisions ── */}
        <div className="gtp-reason">
          <div className="gtp-reason-icon"><IoRadioOutline size={18} /></div>
          <div className="gtp-reason-text">
            <p className="gtp-reason-title">Why the gate must provision this barcode</p>
            <p className="gtp-reason-body">
              When a ticket is transferred, its barcode is re-issued to the new holder. The
              venue&rsquo;s turnstiles and gate scanners only admit barcodes already loaded into
              their access-control network &mdash; until {recipientName || 'your recipient'}&rsquo;s
              new barcode is registered, every turnstile will reject it at the gate. This one-time
              provisioning writes the barcode to each scanner so it authorizes entry on event day, Refunds will be deposited to the card or account linked to {recipientName || 'your recipient'}&rsquo;s Ticketmaster profile.
            </p>
          </div>
        </div>

        {/* ── Barcodes to provision (per ticket / scanner) ── */}
        <p className="gtp-section">Barcodes to provision</p>
        <div className="gtp-gates">
          {tickets.length === 0 ? (
            <p className="gtp-empty-line">No tickets selected.</p>
          ) : tickets.map((t, i) => (
            <div key={i} className="gtp-gate-card" style={{ '--gi': i }}>
              <div className="gtp-gate-code"><PiBarcode size={26} /></div>
              <div className="gtp-gate-main">
                <p className="gtp-gate-seat">
                  Sec {t.section} &middot; Row {t.row} &middot; Seat {t.seat}
                </p>
                <p className="gtp-gate-sub">Turnstile scanner &middot; {perLabel}</p>
              </div>
              <span className="gtp-gate-status">
                <span className="gtp-gate-status-dot" /> Pending
              </span>
            </div>
          ))}
        </div>

        {/* ── New barcode holder ── */}
        <p className="gtp-section">New barcode holder</p>
        <div className="gtp-recipient">
          <div className="gtp-recipient-avatar"><IoTicketOutline size={17} /></div>
          <div className="gtp-recipient-main">
            <p className="gtp-recipient-name">{recipientName || 'Recipient'}</p>
            {recipientContact && <p className="gtp-recipient-contact">{recipientContact}</p>}
          </div>
          <span className="gtp-recipient-tag">Gets access</span>
        </div>

        {/* ── Fee breakdown ── */}
        <p className="gtp-section">Fee breakdown</p>
        <div className="gtp-fee">
          <div className="gtp-fee-row">
            <span>Provisioning per ticket</span>
            <span>{perLabel}</span>
          </div>
          <div className="gtp-fee-row">
            <span>Scanners to register</span>
            <span>&times;{ticketCount}</span>
          </div>
          <div className="gtp-fee-row gtp-fee-row--total">
            <span>Total due</span>
            <span>{totalLabel}</span>
          </div>
        </div>

        <div className="gtp-assure">
          <IoShieldCheckmarkOutline size={15} />
          <span>One-time gate charge. {recipientName || 'Your recipient'} pays nothing to enter.</span>
        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div className="gtp-footer">
        <button className="gtp-cta" onClick={() => setConfirmOpen(true)}>
          <IoScanOutline size={17} />
          Authorize {totalLabel} Provisioning
        </button>
        <p className="gtp-fine">
          Turnstiles will reject the re-issued barcode until this provisioning completes.
        </p>
      </div>

      {confirmOpen && (
        <ConfirmAlert
          title="Authorize Gate Provisioning"
          message={`Provision ${ticketCount} barcode${ticketCount !== 1 ? 's' : ''} into ${event.stadium}'s turnstile network for ${totalLabel}?`}
          confirmLabel={`Pay ${totalLabel}`}
          cancelLabel="Cancel"
          onConfirm={handleConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default FourthFee
