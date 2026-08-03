import { useState } from 'react'
import {
  IoArrowBack,
  IoPaperPlaneOutline,
  IoSparklesOutline,
  IoMailUnreadOutline,
  IoLockOpenOutline,
  IoRibbonOutline,
  IoCheckmarkSharp,
} from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import { useLocation, useNavigate } from 'react-router-dom'
import ConfirmAlert from '../components/ConfirmAlert'
import ReleaseLoader from '../components/ReleaseLoader'
import './TenthFee.css'

// ── Final Transfer Release & Dispatch Fee (Fee #10 — the finale) ────────────
// Reached from /ninthfee. The LAST step of the gauntlet: this release fee
// dispatches the fully re-issued, verified tickets to the recipient and closes
// the transfer ledger. Once paid the recipient immediately receives the
// official acceptance email and the tickets leave hold — irreversible and
// complete. Bright, celebratory ivory/gold/TM-blue — deliberately the one
// light, triumphant screen after a run of dark ones. Ends on a confetti
// completion screen, then home.
const FEE_AMOUNT = 59.99

const CONFETTI = Array.from({ length: 18 }, (_, i) => i)

const TenthFee = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('idle') // idle -> loading -> done
  const [confirmOpen, setConfirmOpen] = useState(false)

  const event = state?.event || null
  const tickets = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const recipient = state?.recipient || {}
  const ticketCount = tickets.length || 1

  // Reached directly / no transfer in flight
  if (!event) {
    return (
      <div className="xfr-page xfr-page--empty">
        <div className="xfr-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#D4AF37" />
          <p className="xfr-empty-title">Nothing To Release</p>
          <p className="xfr-empty-sub">
            Start a ticket transfer and the final release step will appear here.
          </p>
          <button className="xfr-empty-btn" onClick={() => navigate('/')}>Back To My Events</button>
        </div>
      </div>
    )
  }

  const recipientName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact = recipient.email || recipient.phone || ''
  const amountLabel = `$${FEE_AMOUNT.toFixed(2)}`

  // Dispatch loader → celebratory completion screen (no further fees)
  if (phase === 'loading') {
    return <ReleaseLoader duration={2600} onDone={() => setPhase('done')} />
  }

  if (phase === 'done') {
    return (
      <div className="xfr-page xfr-page--done">
        <div className="xfr-confetti" aria-hidden="true">
          {CONFETTI.map((i) => (
            <i key={i} className="xfr-confetti-bit" style={{ '--ci': i }} />
          ))}
        </div>
        <div className="xfr-done-inner">
          <div className="xfr-done-mark">
            <IoCheckmarkSharp size={40} />
          </div>
          <p className="xfr-done-eyebrow">Transfer Complete</p>
          <p className="xfr-done-title">Your tickets are on their way</p>
          <p className="xfr-done-sub">
            {recipientName || 'Your recipient'} has been emailed the official acceptance request
            for {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} to{' '}
            <strong>{event.name}</strong>. The moment they accept, the tickets land in their
            account — every hold on yours is released.
          </p>
          <button className="xfr-done-btn" onClick={() => navigate('/')}>
            <IoSparklesOutline size={16} /> Done
          </button>
        </div>
      </div>
    )
  }

  const handleConfirmed = () => {
    setConfirmOpen(false)
    setPhase('loading')
  }

  return (
    <div className="xfr-page">
      {/* ── Header ── */}
      <div className="xfr-header">
        <button className="xfr-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
        </button>
        <div className="xfr-brand">
          <IoRibbonOutline size={15} />
          <span>Final Release &amp; Dispatch</span>
        </div>
        <span className="xfr-step-badge">LAST STEP</span>
      </div>

      <div className="xfr-body">
        {/* ── Hero release card ── */}
        <div className="xfr-hero">
          <div className="xfr-hero-rays" />
          <div className="xfr-hero-plane">
            <IoPaperPlaneOutline size={26} />
          </div>
          <p className="xfr-hero-eyebrow">One step from done</p>
          <p className="xfr-hero-amount">{amountLabel}</p>
          <span className="xfr-hero-pill">
            <IoSparklesOutline size={13} /> Releases your tickets
          </span>
          <p className="xfr-hero-note">
            The final dispatch of <strong>{ticketCount} verified ticket{ticketCount !== 1 ? 's' : ''}</strong>{' '}
            to {recipientName || 'your recipient'} — and the close of your transfer ledger.
          </p>
        </div>

        {/* ── Why this last fee ── */}
        <div className="xfr-reason">
          <div className="xfr-reason-icon"><IoLockOpenOutline size={17} /></div>
          <div className="xfr-reason-text">
            <p className="xfr-reason-title">What the release fee does</p>
            <p className="xfr-reason-body">
              Every check on this transfer has now passed. This release fee performs the final
              dispatch: the fully re-issued, verified ticket{ticketCount !== 1 ? 's are' : ' is'}{' '}
              sent to {recipientName || 'your recipient'}, the acceptance email goes out
              immediately, and the transfer ledger is closed. After this step the transfer is
              complete and irreversible — nothing further is owed by anyone.
            </p>
          </div>
        </div>

        {/* ── What unlocks ── */}
        <p className="xfr-section">Paid once, this unlocks</p>
        <div className="xfr-unlocks">
          <div className="xfr-unlock" style={{ '--ui': 0 }}>
            <span className="xfr-unlock-icon"><IoMailUnreadOutline size={16} /></span>
            <div className="xfr-unlock-main">
              <p className="xfr-unlock-title">Instant acceptance email</p>
              <p className="xfr-unlock-sub">
                {recipientContact || 'Your recipient'} receives the official request the moment you pay.
              </p>
            </div>
          </div>
          <div className="xfr-unlock" style={{ '--ui': 1 }}>
            <span className="xfr-unlock-icon"><IoLockOpenOutline size={16} /></span>
            <div className="xfr-unlock-main">
              <p className="xfr-unlock-title">Tickets released from hold</p>
              <p className="xfr-unlock-sub">
                All {ticketCount} barcode{ticketCount !== 1 ? 's' : ''} leave escrow and move to their account on acceptance.
              </p>
            </div>
          </div>
          <div className="xfr-unlock" style={{ '--ui': 2 }}>
            <span className="xfr-unlock-icon"><IoRibbonOutline size={16} /></span>
            <div className="xfr-unlock-main">
              <p className="xfr-unlock-title">Transfer ledger closed</p>
              <p className="xfr-unlock-sub">
                The transfer is finalized — complete, certified and irreversible.
              </p>
            </div>
          </div>
        </div>

        {/* ── Summary strip ── */}
        <div className="xfr-summary">
          <div className="xfr-summary-row">
            <span>Event</span>
            <span className="xfr-summary-val">{event.name}</span>
          </div>
          <div className="xfr-summary-row">
            <span>Tickets</span>
            <span className="xfr-summary-val">{ticketCount}</span>
          </div>
          <div className="xfr-summary-row">
            <span>Recipient</span>
            <span className="xfr-summary-val">{recipientName || 'Recipient'}</span>
          </div>
          <div className="xfr-summary-row xfr-summary-row--total">
            <span>Release fee</span>
            <span>{amountLabel}</span>
          </div>
        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div className="xfr-footer">
        <button className="xfr-cta" onClick={() => setConfirmOpen(true)}>
          <IoPaperPlaneOutline size={17} />
          Release Tickets &middot; {amountLabel}
        </button>
        <p className="xfr-fine">
          The very last charge. After this, the transfer completes on acceptance.
        </p>
      </div>

      {confirmOpen && (
        <ConfirmAlert
          title="Release Your Tickets"
          message={`Pay the final ${amountLabel} release fee and dispatch ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''} to ${recipientName || 'your recipient'} now?`}
          confirmLabel={`Pay ${amountLabel} & Release`}
          cancelLabel="Cancel"
          onConfirm={handleConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default TenthFee
