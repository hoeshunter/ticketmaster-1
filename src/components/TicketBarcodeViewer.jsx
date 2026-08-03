import { IoArrowBack, IoWarningOutline } from 'react-icons/io5'
import TicketBarcode from './TicketBarcode'
import './TicketBarcodeViewer.css'

// ── TicketBarcodeViewer ──────────────────────────────────────────────────────
// Full-screen barcode display opened from the "View Tickets" action on the
// ticket popup (Event.jsx) — styled after Ticketmaster's traditional SafeTix
// ticket screen: a dark, letterhead-style page with the platform wordmark,
// listing one perforated ticket stub (TicketBarcode) per seat in the order.
const TicketBarcodeViewer = ({ event, onClose }) => {
  const tickets = event?.tickets || []

  return (
    <div className="bcv-page">
      <div className="bcv-header">
        <button className="bcv-back-btn" onClick={onClose}>
          <IoArrowBack size={18} />
        </button>
        <p className="bcv-wordmark">ticketmaster</p>
        <span className="bcv-header-spacer" />
      </div>

      <div className="bcv-event-block">
        <p className="bcv-event-name">{event?.name}</p>
        <p className="bcv-event-venue">
          {event?.stadium} &middot; {event?.city}, {event?.state}
        </p>
        <p className="bcv-event-datetime">
          {event?.day} &bull; {event?.date} &bull; {event?.time}
        </p>
      </div>

      <div className="bcv-banner">
        <IoWarningOutline size={16} className="bcv-banner-icon" />
        <p className="bcv-banner-text">
          Do not share your barcode. Anyone with your barcode can use your ticket.
        </p>
      </div>

      <div className="bcv-body">
        {tickets.length === 0 ? (
          <p className="bcv-empty">No tickets found for this event.</p>
        ) : (
          tickets.map((ticket, idx) => (
            <TicketBarcode key={idx} ticket={ticket} event={event} index={idx} />
          ))
        )}
      </div>
    </div>
  )
}

export default TicketBarcodeViewer
