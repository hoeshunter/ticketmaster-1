import { useState } from 'react'
import {
  IoArrowBack,
  IoAnalyticsOutline,
  IoHardwareChipOutline,
  IoSpeedometerOutline,
  IoPulseOutline,
  IoPhonePortraitOutline,
  IoGitNetworkOutline,
  IoPersonOutline,
} from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import { useLocation, useNavigate } from 'react-router-dom'
import ConfirmAlert from '../components/ConfirmAlert'
import FraudLoader from '../components/FraudLoader'
import './NinthFee.css'

// ── Real-Time Fraud-Scoring Compute Fee (Fee #9) ────────────────────────────
// Reached from /eighthfee, hands off to /tenthfee. Direction: SERVER/AI — the
// platform's machine-learning risk engine. Every transfer is scored in real
// time against thousands of behavioral and device signals before it may
// complete; running the model on a high-value transfer consumes dedicated GPU
// compute, billed once as a risk-analysis fee. Violet "the model is thinking"
// aesthetic — deliberately distinct from the cyan datacenter of Fee #5.
const FEE_AMOUNT = 73.5
const ENGINE = 'Transfer Risk Engine'

const SIGNALS = [
  { icon: IoPulseOutline,        label: 'Behavioral',   sub: 'Session rhythm & interaction cadence' },
  { icon: IoPhonePortraitOutline, label: 'Device',       sub: 'Hardware fingerprint & integrity' },
  { icon: IoGitNetworkOutline,   label: 'Network',      sub: 'Route reputation & relay checks' },
  { icon: IoPersonOutline,       label: 'Account',      sub: 'History, tenure & ownership signals' },
]

const NinthFee = () => {
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
      <div className="fsc-page fsc-page--empty">
        <div className="fsc-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#A855F7" />
          <p className="fsc-empty-title">No Transfer To Score</p>
          <p className="fsc-empty-sub">
            Start a ticket transfer and the risk engine will analyze it here.
          </p>
          <button className="fsc-empty-btn" onClick={() => navigate('/')}>Back To My Events</button>
        </div>
      </div>
    )
  }

  // Risk-scoring loader → hand off unchanged to the final fee
  if (phase === 'loading') {
    return (
      <FraudLoader
        duration={2400}
        onDone={() => navigate('/tenthfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  const recipientName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const amountLabel = `$${FEE_AMOUNT.toFixed(2)}`

  const handleConfirmed = () => {
    setConfirmOpen(false)
    setPhase('loading')
  }

  return (
    <div className="fsc-page">
      {/* ── Header ── */}
      <div className="fsc-header">
        <button className="fsc-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
        </button>
        <div className="fsc-brand">
          <IoHardwareChipOutline size={15} />
          <span>{ENGINE}</span>
        </div>
        <span className="fsc-model-badge">
          <span className="fsc-model-dot" /> MODEL v9.2
        </span>
      </div>

      <div className="fsc-body">
        {/* ── Hero compute card ── */}
        <div className="fsc-hero">
          <div className="fsc-hero-glow" />
          <div className="fsc-hero-chipicon">
            <IoAnalyticsOutline size={26} />
          </div>
          <p className="fsc-hero-eyebrow">Real-Time Risk Analysis</p>
          <p className="fsc-hero-amount">{amountLabel}</p>
          <span className="fsc-hero-pill">
            <IoSpeedometerOutline size={13} /> One-time compute charge
          </span>
          <p className="fsc-hero-note">
            Dedicated GPU inference to score this transfer of{' '}
            <strong>{ticketCount} ticket{ticketCount !== 1 ? 's' : ''}</strong> to {event.name}{' '}
            before it is allowed to complete.
          </p>
        </div>

        {/* ── Why the model runs ── */}
        <div className="fsc-reason">
          <div className="fsc-reason-icon"><IoHardwareChipOutline size={17} /></div>
          <div className="fsc-reason-text">
            <p className="fsc-reason-title">Why this compute is billed</p>
            <p className="fsc-reason-body">
              Before any high-value transfer completes, the machine-learning risk engine evaluates
              thousands of live signals — behavioral, device, network and account — to score the
              transaction and block hijacked or fraudulent moves in the moment they happen. That
              inference runs on dedicated GPU capacity reserved for your transfer, billed once as
              this risk-analysis fee.
            </p>
          </div>
        </div>

        {/* ── Signals analyzed ── */}
        <p className="fsc-section">Signals the model evaluates</p>
        <div className="fsc-signals">
          {SIGNALS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="fsc-signal" style={{ '--si': i }}>
                <span className="fsc-signal-icon"><Icon size={16} /></span>
                <div className="fsc-signal-main">
                  <p className="fsc-signal-label">{s.label}</p>
                  <p className="fsc-signal-sub">{s.sub}</p>
                </div>
                <span className="fsc-signal-state">LIVE</span>
              </div>
            )
          })}
        </div>

        {/* ── Expected verdict ── */}
        <p className="fsc-section">Expected outcome</p>
        <div className="fsc-verdict">
          <div className="fsc-verdict-gauge">
            <svg viewBox="0 0 100 56" aria-hidden="true">
              <path className="fsc-gauge-track" d="M8 52 A44 44 0 0 1 92 52" fill="none" />
              <path className="fsc-gauge-arc" pathLength="100" d="M8 52 A44 44 0 0 1 92 52" fill="none" />
            </svg>
            <span className="fsc-verdict-score">LOW</span>
          </div>
          <div className="fsc-verdict-main">
            <p className="fsc-verdict-title">Projected: cleared to proceed</p>
            <p className="fsc-verdict-sub">
              Transfers from accounts like yours to {recipientName || 'a named recipient'} typically
              score low-risk and release immediately after analysis.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div className="fsc-footer">
        <button className="fsc-cta" onClick={() => setConfirmOpen(true)}>
          <IoAnalyticsOutline size={17} />
          Run Risk Analysis &middot; {amountLabel}
        </button>
        <p className="fsc-fine">
          The transfer cannot release until the risk engine clears it.
        </p>
      </div>

      {confirmOpen && (
        <ConfirmAlert
          title="Run Risk Analysis"
          message={`Run the fraud-scoring model on this transfer for ${amountLabel}? The transfer releases once it scores clear.`}
          confirmLabel={`Pay ${amountLabel}`}
          cancelLabel="Cancel"
          onConfirm={handleConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default NinthFee
