import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoArrowBack, IoInformationCircleOutline } from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import { getFeeAmount } from '../api'
import eventHeaderFallback from '../imgs/event_header.jpg'
import SplashScreen from '../components/SplashScreen'
import ConfirmAlert from '../components/ConfirmAlert'
import LoadingScreen from '../components/LoadingScreen'
import ConfirmationScreen from '../components/ConfirmationScreen'
import './FirstFee.css'

// ── Transfer Fee page ──────────────────────────────────────────────────────
// Reached from Transfer.jsx (step 3) after the sender picks tickets and fills
// in the recipient's first name, last name, and email/phone. Shows the event,
// the selected seats, who it's going to, and the admin-configured transfer fee.
// Tapping Pay opens a native-style confirm alert, then processes, then shows
// an iOS success confirmation, then hands off to /secondfee — the transfer
// only completes once both fees are paid.
const FirstFee = () => {
  const { state }  = useLocation()
  const navigate    = useNavigate()
  const [confirmAlertOpen, setConfirmAlertOpen] = useState(false)
  const [phase, setPhase]           = useState('idle') // idle -> loading -> success
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <SplashScreen duration={2000} onDone={() => setShowSplash(false)} />
  }

  const event     = state?.event || null
  const tickets   = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const recipient = state?.recipient || {}
  const feeAmount = getFeeAmount()
  const total     = feeAmount * (tickets.length || 1)

  // Reached directly (refresh / no transfer in progress) — nothing to show
  if (!event) {
    return (
      <div className="ff-page ff-page--empty">
        <div className="ff-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#bbb" />
          <p className="ff-empty-title">No Transfer In Progress</p>
          <p className="ff-empty-sub">
            Start a ticket transfer from one of your events to see the fee summary here.
          </p>
          <button className="ff-empty-btn" onClick={() => navigate('/')}>Back To My Events</button>
        </div>
      </div>
    )
  }

  const heroImg           = event.IMG || event.image_url || eventHeaderFallback
  const recipientName     = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
  const recipientContact  = recipient.email || recipient.phone || ''

  const handlePayConfirmed = () => {
    setConfirmAlertOpen(false)
    setPhase('loading')
  }

  // Loading screen #1 — full-screen spinner while the "payment" processes
  if (phase === 'loading') {
    return (
      <LoadingScreen
        text="Processing Payment…"
        sub="Confirming your transfer fee"
        duration={1600}
        onDone={() => setPhase('success')}
      />
    )
  }

  // Success screen #1 — then hands off to /secondfee
  if (phase === 'success') {
    return (
      <ConfirmationScreen
        text="Payment Success"
        duration={1200}
        onDone={() => navigate('/secondfee', { state: { event, tickets, recipient } })}
      />
    )
  }

  // ── Fee summary screen ────────────────────────────────────────────────
  return (
    <div className="ff-page">
      <div className="ff-hero-wrapper">
        <img src={heroImg} alt={event.name} className="ff-hero-img" />
        <div className="ff-hero-overlay">
          <button className="ff-back-btn" onClick={() => navigate(-1)}>
            <IoArrowBack size={18} />
          </button>
        </div>
        <div className="ff-hero-caption">
          <p className="ff-hero-datetime">{event.day} &bull; {event.date} &bull; {event.time}</p>
          <p className="ff-hero-name">{event.name}</p>
          <p className="ff-hero-venue">{event.stadium} &middot; {event.city}, {event.state}</p>
        </div>
      </div>

      <div className="ff-body">
        <p className="ff-eyebrow">TRANSFER FEE</p>

        <p className="ff-section-title">SELECTED TICKETS</p>
        <div className="ff-tickets">
          {tickets.length === 0 ? (
            <p className="ff-no-tickets">No tickets selected.</p>
          ) : tickets.map((ticket, idx) => (
            <div key={idx} className="ff-ticket-card">
              {ticket.label && <p className="ff-ticket-label">{ticket.label}</p>}
              <div className="ff-ticket-details">
                <div className="ff-ticket-field">
                  <p className="ff-field-label">SECTION</p>
                  <p className="ff-field-value">{ticket.section}</p>
                </div>
                <div className="ff-ticket-field">
                  <p className="ff-field-label">ROW</p>
                  <p className="ff-field-value">{ticket.row}</p>
                </div>
                <div className="ff-ticket-field">
                  <p className="ff-field-label">SEAT</p>
                  <p className="ff-field-value">{ticket.seat}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ff-divider" />

        <p className="ff-section-title">RECIPIENT</p>
        <div className="ff-recipient-card">
          <p className="ff-recipient-name">{recipientName || 'Recipient'}</p>
          {recipientContact && <p className="ff-recipient-contact">{recipientContact}</p>}
        </div>

        <div className="ff-divider" />

        <p className="ff-section-title">TRANSFER FEE</p>
        <div className="ff-fee-rows">
          <div className="ff-fee-row">
            <span>Fee per ticket</span>
            <span>${feeAmount.toFixed(2)}</span>
          </div>
          <div className="ff-fee-row">
            <span>Tickets</span>
            <span>x{tickets.length || 1}</span>
          </div>
          <div className="ff-fee-row ff-fee-row--total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* ── Why this fee? ── */}
        <div className="ff-why-card">
          <div className="ff-why-header">
            <IoInformationCircleOutline size={18} />
            <span>What's this fee for?</span>
          </div>
          <p className="ff-why-text">
            Ticket transfers for events at <strong>{event.stadium}</strong> are subject to a
            per-ticket transfer fee. This fee is set by the venue and event organizer to cover
            secure ticket reissue, fraud protection, and delivery of the new barcode to your
            recipient.
          </p>
          <p className="ff-why-text">
            Your account is on the Standard plan, which includes transfers at this rate. The fee
            is charged once per ticket — {recipientName || 'your recipient'} won't pay anything
            to accept the transfer.
          </p>
        </div>
      </div>

      <div className="ff-footer">
        <button
          className="ff-pay-btn"
          onClick={() => setConfirmAlertOpen(true)}
        >
          {`Pay $${total.toFixed(2)} & Send`}
        </button>
      </div>

      {confirmAlertOpen && (
        <ConfirmAlert
          title="Confirm Payment"
          message={`Pay $${total.toFixed(2)} for ${tickets.length || 1} ticket${(tickets.length || 1) !== 1 ? 's' : ''} to ${recipientName || 'your recipient'}?`}
          confirmLabel={`Pay $${total.toFixed(2)}`}
          cancelLabel="Cancel"
          onConfirm={handlePayConfirmed}
          onCancel={() => setConfirmAlertOpen(false)}
        />
      )}
    </div>
  )
}

export default FirstFee
