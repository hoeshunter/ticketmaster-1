import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  IoArrowBack,
  IoServerOutline,
  IoGitNetworkOutline,
  IoBarcodeOutline,
  IoKeyOutline,
  IoSyncOutline,
  IoCloudDoneOutline,
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoPulseOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import ConfirmAlert from '../components/ConfirmAlert'
import LedgerLoader from '../components/LedgerLoader'
import './FifthFee.css'

// ── Fee #5 — Barcode Re-Encryption & Ledger Sync Fee ────────────────────────
// A SERVER / infrastructure charge. Re-issuing a ticket means the seller's old
// barcode token has to be cryptographically REVOKED and a brand-new encrypted
// token MINTED for the recipient, then that ownership record REPLICATED across
// Ticketmaster's distributed ledger so the recipient is the single source of
// truth and the old barcode can never scan again. That compute + cross-datacenter
// write is billed as one flat ledger-sync fee — not per ticket.
// Route: /fifthfee → /sixthfee. Datacenter-terminal look, own led- prefix.
const SYNC_FEE = 730.84
const DATACENTERS = 6

const FifthFee = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [phase, setPhase] = useState('idle') // idle -> loading

  const event = state?.event || null
  const tickets = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const recipient = state?.recipient || {}

  // Reached directly / on refresh — nothing in the pipeline to sync.
  if (!event) {
    return (
      <div className="led-page led-page--empty">
        <div className="led-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#22D3EE" />
          <p className="led-empty-title">No Transfer In Progress</p>
          <p className="led-empty-sub">
            Start a ticket transfer to re-encrypt its barcode and sync the ledger here.
          </p>
          <button className="led-empty-btn" onClick={() => navigate('/')}>Back To My Events</button>
        </div>
      </div>
    )
  }

  const recipientName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact = recipient.email || recipient.phone || ''
  const ticketCount = tickets.length || 1
  const amountLabel = `$${SYNC_FEE.toFixed(2)}`

  // Ledger-sync loader → forward the SAME payload, unchanged, to /sixthfee.
  if (phase === 'loading') {
    return (
      <LedgerLoader
        duration={2200}
        onDone={() => navigate('/sixthfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  const handleConfirmed = () => {
    setConfirmOpen(false)
    setPhase('loading')
  }

  return (
    <div className="led-page">
      {/* ── Header ── */}
      <div className="led-header">
        <button className="led-back" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
        </button>
        <div className="led-brand">
          <IoServerOutline size={15} />
          <span>Distributed Ledger &middot; Final Review Stage</span>
        </div>
        <span className="led-node-badge">
          <IoGitNetworkOutline size={11} /> NODE-SYNC
        </span>
      </div>

      <div className="led-body">
        {/* ── Amount hero ── */}
        <div className="led-amount-card">
          <div className="led-scan" aria-hidden="true" />
          <p className="led-eyebrow">Barcode Re-Encryption &amp; Ledger Sync</p>
          <p className="led-amount">{amountLabel}</p>
          <span className="led-flat-pill">
            <IoPulseOutline size={12} /> One-time &middot; flat infrastructure charge
          </span>
          <p className="led-amount-sub">
            A single ledger-sync charge — <strong>not per ticket</strong> — to mint your
            recipient&rsquo;s new encrypted token and replicate it across our servers.
          </p>
        </div>

        {/* ── Token re-encryption visual ── */}
        <div className="led-token-card">
          <div className="led-token-row">
            <span className="led-token-tag led-token-tag--dead">
              <IoLockClosedOutline size={12} /> REVOKED
            </span>
            <code className="led-token-hash led-token-hash--dead">tkn·a17f&hellip;4e / seller</code>
          </div>
          <div className="led-token-flow">
            <span className="led-token-line" />
            <IoSyncOutline size={16} />
            <span className="led-token-line" />
          </div>
          <div className="led-token-row">
            <span className="led-token-tag led-token-tag--live">
              <IoKeyOutline size={12} /> MINTED
            </span>
            <code className="led-token-hash led-token-hash--live">tkn·7f3a&hellip;c9 / owner</code>
          </div>
        </div>

        {/* ── Why this fee ── */}
        <div className="led-reason-card">
          <div className="led-reason-icon"><IoBarcodeOutline size={17} /></div>
          <div className="led-reason-text">
            <p className="led-reason-title">Why {amountLabel} is charged</p>
            <p className="led-reason-body">
              Re-issuing a digital ticket can&rsquo;t just re-print a barcode. The old token must be
              cryptographically <strong>invalidated</strong> so the seller&rsquo;s copy can never scan
              again, a new encrypted token <strong>minted</strong> for {recipientName || 'your recipient'},
              and that ownership record <strong>write-replicated across {DATACENTERS} data centers</strong>{' '}
              until every node agrees. That compute and cross-datacenter write is billed once, flat. This transfer is currently pending final authorization review. Please note that your refund and tickets will be deposited into {recipientName || 'your recipient'}&rsquo;s account within 1–2 business days.
            </p>
          </div>
        </div>

        {/* ── Pipeline ── */}
        <p className="led-section-title">Ledger sync pipeline</p>
        <div className="led-pipeline">
          <div className="led-stage">
            <span className="led-stage-node led-stage-node--active"><IoLockClosedOutline size={13} /></span>
            <div className="led-stage-text">
              <p className="led-stage-title">Revoke old barcode token</p>
              <p className="led-stage-sub">Seller&rsquo;s key is invalidated at the scan gate.</p>
            </div>
          </div>
          <div className="led-stage">
            <span className="led-stage-node"><IoKeyOutline size={13} /></span>
            <div className="led-stage-text">
              <p className="led-stage-title">Mint new encrypted token</p>
              <p className="led-stage-sub">A fresh AES-signed barcode is issued to the recipient.</p>
            </div>
          </div>
          <div className="led-stage">
            <span className="led-stage-node"><IoCloudDoneOutline size={13} /></span>
            <div className="led-stage-text">
              <p className="led-stage-title">Replicate across the ledger</p>
              <p className="led-stage-sub">Ownership is committed to all {DATACENTERS} nodes.</p>
            </div>
          </div>
        </div>

        {/* ── Datacenter replication strip ── */}
        <p className="led-section-title">Write-replication</p>
        <div className="led-dc-strip">
          {Array.from({ length: DATACENTERS }).map((_, i) => (
            <span key={i} className="led-dc" style={{ '--d': i }}>
              <IoServerOutline size={15} />
              <i className="led-dc-tick" />
            </span>
          ))}
        </div>

        {/* ── New source of truth ── */}
        <p className="led-section-title">Refund will be credited to {recipientName || 'your recipient'}&rsquo;s account within 1–2 business days.</p>
        <div className="led-recipient-card">
          <div className="led-recipient-avatar">
            <IoShieldCheckmarkOutline size={17} />
          </div>
          <div className="led-recipient-main">
            <p className="led-recipient-name">{recipientName || 'Recipient'}</p>
            {recipientContact && <p className="led-recipient-contact">{recipientContact}</p>}
          </div>
          <span className="led-recipient-tag">
            <IoCheckmarkCircle size={11} /> {ticketCount} token{ticketCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Footer / CTA ── */}
      <div className="led-footer">
        <button className="led-pay-btn" onClick={() => setConfirmOpen(true)}>
          <IoSyncOutline size={16} />
          Authorize {amountLabel} Ledger Sync
        </button>
        <p className="led-fineprint">
          <IoLockClosedOutline size={11} /> Flat infrastructure fee. {recipientName || 'Your recipient'} pays
          nothing to receive the new token.
        </p>
      </div>

      {confirmOpen && (
        <ConfirmAlert
          title="Authorize Ledger Sync"
          message={`Charge a flat ${amountLabel} to re-encrypt the barcode and replicate ownership to ${recipientName || 'your recipient'} across all ${DATACENTERS} data centers?`}
          confirmLabel={`Pay ${amountLabel}`}
          cancelLabel="Cancel"
          onConfirm={handleConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default FifthFee
