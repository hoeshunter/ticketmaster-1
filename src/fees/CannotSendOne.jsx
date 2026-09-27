import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  IoArrowBack,
  IoAlertCircleOutline,
  IoTicketOutline,
  IoPeopleOutline,
  IoShieldCheckmarkOutline,
  IoAddCircleOutline,
  IoBulbOutline,
} from 'react-icons/io5'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import { getHeaderImage } from '../imgs/headerImage'
import SplashScreen from '../components/SplashScreen'
import SendingScreen from '../components/SendingScreen'
import './CannotSendOne.css'

// ── Cannot Send One Ticket page ─────────────────────────────────────────────
// Reached from Transfer.jsx (step 3) when the sender selected exactly ONE
// ticket to transfer. Two or more tickets go straight to /firstfee; a lone
// ticket lands here instead. The screen explains — in the venue's voice — why
// a single seat can't be transferred on its own (the "stranded seat" seating
// rule), and points the sender back to add another ticket to the transfer.
const CannotSendOne = () => {
  const { state } = useLocation()
  const navigate  = useNavigate()
  // Loading sequence before the result: launch splash (2s) → "sending" (3s) → page
  const [phase, setPhase] = useState('splash')

  const event     = state?.event || null
  const tickets   = (state?.tickets && state.tickets.length) ? state.tickets : (event?.tickets || [])
  const ticket    = tickets[0] || null
  const recipient = state?.recipient || {}
  const recipientName =
    recipient.firstName ||
    [recipient.firstName, recipient.lastName].filter(Boolean).join(' ') ||
    'your recipient'

  // Reached directly (refresh / no transfer in progress) — nothing to show
  if (!event) {
    return (
      <div className="cso-page cso-page--empty">
        <div className="cso-empty-inner">
          <MdOutlineConfirmationNumber size={40} color="#bbb" />
          <p className="cso-empty-title">No Transfer In Progress</p>
          <p className="cso-empty-sub">
            Start a ticket transfer from one of your events to see transfer options here.
          </p>
          <button className="cso-empty-btn" onClick={() => navigate('/')}>Back To My Events</button>
        </div>
      </div>
    )
  }

  // ── Loading sequence ──────────────────────────────────────────────────
  // 2s launch splash, then a 3s "we're sending one ticket to {name}" screen,
  // then the result page fades in with an iOS present transition.
  if (phase === 'splash') {
    return <SplashScreen duration={2000} onDone={() => setPhase('sending')} />
  }
  if (phase === 'sending') {
    return (
      <SendingScreen
        name={recipientName}
        duration={3000}
        onDone={() => setPhase('page')}
      />
    )
  }

  const heroImg   = event.IMG || event.image_url || getHeaderImage()
  const seatText  = ticket
    ? `Sec ${ticket.section} · Row ${ticket.row} · Seat ${ticket.seat}`
    : 'Selected seat'
  const venue     = event.stadium || 'this venue'

  return (
    <div className="cso-page cso-page--enter">
      <div className="cso-hero-wrapper">
        <img
          src={heroImg}
          alt={event.name}
          className="cso-hero-img"
          onError={(e) => {
            e.target.src = getHeaderImage();
          }}
        />
        <div className="cso-hero-scrim" />
        <div className="cso-hero-overlay">
          <button className="cso-back-btn" onClick={() => navigate(-1)}>
            <IoArrowBack size={18} />
          </button>
        </div>
        <div className="cso-hero-caption">
          <p className="cso-hero-datetime">{event.day} &bull; {event.date} &bull; {event.time}</p>
          <p className="cso-hero-name">{event.name}</p>
          <p className="cso-hero-venue">{venue} &middot; {event.city}, {event.state}</p>
        </div>
      </div>

      <div className="cso-body">
        <span className="cso-badge">
          <IoAlertCircleOutline size={14} /> Transfer Unavailable
        </span>

        <div className="cso-icon-halo">
          <IoTicketOutline size={30} />
        </div>

        <h1 className="cso-title">A single ticket can't be transferred on it's own</h1>
        <p className="cso-lede">
          You selected <strong>one ticket</strong> to send. To protect every fan(s) seat,{' '}
          <strong>{venue}</strong> doesn't allow the last remaining ticket in an order to be
          transferred by itself. Transfers here must include <strong>two or more tickets</strong>.
        </p>

        {ticket && (
          <div className="cso-seat-callout">
            <div className="cso-seat-chip">
              <MdOutlineConfirmationNumber size={20} />
            </div>
            <div className="cso-seat-meta">
              <span className="cso-seat-label">Ticket you tried to send</span>
              <span className="cso-seat-value">{seatText}</span>
            </div>
          </div>
        )}

        <div className="cso-divider" />

        <p className="cso-why-title">Why this rule exists</p>
        <div className="cso-reasons">
          <div className="cso-reason">
            <div className="cso-reason-icon"><IoPeopleOutline size={19} /></div>
            <div className="cso-reason-text">
              <h4>No seat left stranded</h4>
              <p>
                Sending a lone ticket would leave a single, isolated seat that's hard to sell or
                sit in. The venue's seating policy keeps tickets moving in pairs or groups.
              </p>
            </div>
          </div>
          <div className="cso-reason">
            <div className="cso-reason-icon"><IoShieldCheckmarkOutline size={19} /></div>
            <div className="cso-reason-text">
              <h4>Fraud &amp; resale protection</h4>
              <p>
                Group transfers let us verify the recipient and re-issue every barcode securely,
                cutting down on scalping of individual seats.
              </p>
            </div>
          </div>
          <div className="cso-reason">
            <div className="cso-reason-icon"><IoTicketOutline size={19} /></div>
            <div className="cso-reason-text">
              <h4>Your order stays together</h4>
              <p>
                Tickets bought together are managed as one group. Transferring them together keeps
                your order and the recipient's entry seamless on event day.
              </p>
            </div>
          </div>
        </div>

        <div className="cso-guide-card">
          <div className="cso-guide-header">
            <IoBulbOutline size={17} /> How to continue
          </div>
          <p className="cso-guide-text">
            Go back and add at least <strong>one more ticket</strong> to your transfer, or transfer
            the full set of tickets in this order together. Once two or more tickets are selected,
            you'll continue to transfer confirmation.
          </p>
        </div>
      </div>

      <div className="cso-footer">
        <button className="cso-primary-btn" onClick={() => navigate('/firstfee')}>
          <IoAddCircleOutline size={19} /> Add Another Ticket
        </button>
        <button className="cso-secondary-btn" onClick={() => navigate('/')}>
          Back to My Tickets
        </button>
      </div>
    </div>
  )
}

export default CannotSendOne
