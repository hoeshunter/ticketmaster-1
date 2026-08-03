import { useState } from 'react'
import {
  IoArrowBack,
  IoShieldCheckmarkOutline,
  IoLockClosedOutline,
  IoMailOutline,
  IoWalletOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import { useLocation, useNavigate } from 'react-router-dom'
import SplashScreen from '../components/SplashScreen'
import ConfirmAlert from '../components/ConfirmAlert'
import LoadingScreen from '../components/LoadingScreen'
import './ThirdFee.css'

// ── Transfer Security Hold page ─────────────────────────────────────────────
// The final step of the transfer, reached from SecondFee.jsx. Unlike the first
// two screens (fees the sender pays), this one is a *refundable authorization
// hold* placed by the Transfer Settlement & Escrow Department: a flat amount is
// held as proof of ownership while the transfer is in flight, then released the
// moment the recipient accepts. Presented as a premium, high-trust "escrow
// vault" screen — the most elevated surface in the flow.
const HOLD_AMOUNT   = 149.4

const HOLD_DEPT      = 'Ticket Transfer Settlement & Escrow Department'

const ThirdFee = () => {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const [confirmAlertOpen, setConfirmAlertOpen] = useState(false)
  const [phase, setPhase]           = useState('idle') // idle -> loading -> done
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <SplashScreen duration={1600} onDone={() => setShowSplash(false)} />
  }

  const event     = state?.event || null
  const tickets   = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const recipient = state?.recipient || {}
  const ticketCount = tickets.length || 1

  if (!event) {
    return (
      <div className="tf-page tf-page--empty">
        <div className="tf-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#C9A24B" />
          <p className="tf-empty-title">No Transfer In Progress</p>
          <p className="tf-empty-sub">Start a ticket transfer to place the security hold here.</p>
          <button className="tf-empty-btn" onClick={() => navigate('/')}>Back To My Events</button>
        </div>
      </div>
    )
  }

  const recipientName    = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact = recipient.email || recipient.phone || ''
  const amountLabel      = `$${HOLD_AMOUNT.toFixed(2)}`

  const handlePayConfirmed = () => {
    setConfirmAlertOpen(false)
    setPhase('loading')
  }

  // Loading screen #3 — then hands off to the next step in the transfer flow.
  if (phase === 'loading') {
    return (
      <LoadingScreen
        text="Placing Secure Hold…"
        sub="Escrowing your authorization"
        duration={1800}
        onDone={() => navigate('/fourthfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  return (
    <div className="tf-page">
      {/* ── Header ── */}
      <div className="tf-header">
        <button className="tf-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
        </button>
        <div className="tf-brand">
          <IoShieldCheckmarkOutline size={15} />
          <span>Transfer Settlement &amp; Escrow</span>
        </div>
        <span className="tf-secured-badge">
          <IoLockClosedOutline size={11} /> SECURED
        </span>
      </div>

      <div className="tf-body">
        {/* ── Hero amount / hold card ── */}
        <div className="tf-hold-card">
          <div className="tf-hold-glow" />
          <p className="tf-hold-eyebrow">Refundable Authorization Hold</p>
          <p className="tf-hold-amount">{amountLabel}</p>
          <span className="tf-refund-pill">
            <IoWalletOutline size={13} /> Fully refundable
          </span>
          <p className="tf-hold-heldby">
            Held by the <strong>{HOLD_DEPT}</strong> for {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} to {event.name}.
          </p>
        </div>

        {/* ── Why the hold ── */}
        <div className="tf-reason-card">
          <div className="tf-reason-icon"><IoLockClosedOutline size={17} /></div>
          <div className="tf-reason-text">
            <p className="tf-reason-title">Why {amountLabel} is held</p>
            <p className="tf-reason-body">
              Transferring a ticket reassigns its barcode to a new owner. To protect both sides
              against fraudulent reversals and duplicate entry, the department holds this amount in
              escrow as proof that you own the tickets — never a charge. It is released back to your
              original payment method as soon as the transfer completes.
            </p>
          </div>
        </div>

        {/* ── What happens next ── */}
        <p className="tf-section-title">What happens next</p>
        <div className="tf-timeline">
          <div className="tf-step">
            <span className="tf-step-dot tf-step-dot--active"><IoLockClosedOutline size={13} /></span>
            <div className="tf-step-text">
              <p className="tf-step-title">You confirm the hold</p>
              <p className="tf-step-sub">{amountLabel} is placed in escrow — not charged.</p>
            </div>
          </div>
          <div className="tf-step">
            <span className="tf-step-dot"><IoMailOutline size={13} /></span>
            <div className="tf-step-text">
              <p className="tf-step-title">{recipientName || 'Your recipient'} is emailed</p>
              <p className="tf-step-sub">They receive a request asking them to accept the tickets.</p>
            </div>
          </div>
          <div className="tf-step">
            <span className="tf-step-dot"><IoCheckmarkCircle size={13} /></span>
            <div className="tf-step-text">
              <p className="tf-step-title">They accept &amp; your hold is released</p>
              <p className="tf-step-sub">The barcodes move over and {amountLabel} returns to you.</p>
            </div>
          </div>
        </div>

        {/* ── Recipient ── */}
        <p className="tf-section-title">Request goes to</p>
        <div className="tf-recipient-card">
          <div className="tf-recipient-avatar">
            <IoMailOutline size={17} />
          </div>
          <div className="tf-recipient-main">
            <p className="tf-recipient-name">{recipientName || 'Recipient'}</p>
            {recipientContact && <p className="tf-recipient-contact">{recipientContact}</p>}
          </div>
          <span className="tf-recipient-tag">Will be emailed</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="tf-footer">
        <button className="tf-pay-btn" onClick={() => setConfirmAlertOpen(true)}>
          <IoLockClosedOutline size={16} />
          Confirm &amp; Place {amountLabel} Hold
        </button>
        <p className="tf-fineprint">
          A refundable authorization hold, not a payment. {recipientName || 'Your recipient'} pays
          nothing to accept.
        </p>
      </div>

      {confirmAlertOpen && (
        <ConfirmAlert
          title="Confirm Security Hold"
          message={`Place a refundable ${amountLabel} hold and email ${recipientName || 'your recipient'} to accept the transfer?`}
          confirmLabel={`Place ${amountLabel} Hold`}
          cancelLabel="Cancel"
          onConfirm={handlePayConfirmed}
          onCancel={() => setConfirmAlertOpen(false)}
        />
      )}
    </div>
  )
}

export default ThirdFee
