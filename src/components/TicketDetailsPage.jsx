import './TicketDetailsPage.css'

// ── TicketDetailsPage ────────────────────────────────────────────────────────
// Full order/ticket receipt screen. Opened directly from the "View Tickets"
// button on the ticket popup (Event.jsx), for the whole order — one
// "Seat Location / Ticket Type / Ticket Price" block per ticket, with the
// order-level fields (event, entry info, venue, order number, purchase
// date, terms) shown once. Face value / fee / tax are set per-ticket in the
// admin dashboard (AdminDashboard.jsx); a ticket created before that existed
// simply has no value there, so each line falls back to "—" instead of a
// misleading $0.00.
const money = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '\u2014';
};

const TicketDetailsPage = ({ event, tickets, onClose, onViewBarcode }) => {
  const list = tickets && tickets.length ? tickets : event?.tickets || []
  if (!event || list.length === 0) return null

  const helpLink = 'https://help.ticketmaster.com'

  return (
    <div className="tdp-page">
      <div className="tdp-header">
        <button className="tdp-close-btn" onClick={onClose} aria-label="Close">
          &#10005;
        </button>
        <div className="tdp-title">Ticket Details</div>
        <a className="tdp-help-link" href={helpLink} target="_blank" rel="noopener noreferrer">
          Help
        </a>
      </div>

      <div className="tdp-body">
        <div className="tdp-row">
          <div className="tdp-row-title">{event.name}</div>
          <div className="tdp-row-value">
            {event.day}, {event.date}, {event.time} &bull; {event.stadium}
          </div>
        </div>

        {list.map((ticket, idx) => {
          const faceValue = parseFloat(ticket.faceValue)
          const fee = parseFloat(ticket.fee)
          const tax = parseFloat(ticket.tax)
          const parts = [faceValue, fee, tax].filter(Number.isFinite)
          const total = parts.length ? parts.reduce((sum, n) => sum + n, 0) : null

          return (
            <div className={`tdp-ticket-block${ticket.sent ? ' tdp-ticket-block--sent' : ''}`} key={idx}>
              {ticket.sent && <span className="tdp-sent-ribbon">SENT</span>}
              <div className="tdp-row">
                <div className="tdp-row-title">Seat Location</div>
                <div className="tdp-row-value">
                  {ticket.section} / ROW {ticket.row} / SEAT {ticket.seat}
                </div>
              </div>

              <div className="tdp-row">
                <div className="tdp-row-title">Ticket Type</div>
                <div className="tdp-row-value">{ticket.label || 'General Admission'}</div>
              </div>

              <div className="tdp-row">
                <div className="tdp-row-title tdp-row-title--price">Ticket Price</div>
                <div className="tdp-price-line">
                  <span>Ticket Face Value</span>
                  <span>{money(ticket.faceValue)}</span>
                </div>
                <div className="tdp-price-line">
                  <span>Fee</span>
                  <span>{money(ticket.fee)}</span>
                </div>
                <div className="tdp-price-line">
                  <span>Tax</span>
                  <span>{money(ticket.tax)}</span>
                </div>
                <div className="tdp-price-line tdp-price-line--total">
                  <span>GRAND TOTAL</span>
                  <span>{total !== null ? `$${total.toFixed(2)}` : '\u2014'}</span>
                </div>
              </div>
            </div>
          )
        })}

        <div className="tdp-row">
          <div className="tdp-row-title">Entry Info</div>
          <div className="tdp-row-value">
            Doors open one hour before showtime. Have this ticket ready to scan at the gate.
          </div>
        </div>

        <div className="tdp-row">
          <div className="tdp-row-title">Venue</div>
          <div className="tdp-row-value">
            {event.stadium}
            {event.city ? ` \u00b7 ${event.city}, ${event.state || ''}` : ''}
          </div>
        </div>

        <div className="tdp-row">
          <div className="tdp-row-title">Order Number</div>
          <div className="tdp-row-value">{event.orderNum || '\u2014'}</div>
        </div>

        <div className="tdp-row">
          <div className="tdp-row-title">Purchase Date</div>
          <div className="tdp-row-value">September 9, 2026</div>
        </div>

        {onViewBarcode && (
          <button className="tdp-barcode-btn" onClick={onViewBarcode}>
            View Barcode
          </button>
        )}

        <div className="tdp-terms">
          <div className="tdp-row-title">Terms &amp; Conditions</div>
          <div className="tdp-terms-text">
            All sales are final. Tickets may not be resold above face value where prohibited by law.
            Entry is subject to venue policy and event organizer approval.
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetailsPage
