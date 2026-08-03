import { useEffect, useMemo, useState } from 'react'
import { fetchAllEvents, sendEmail } from '../api'
import { buildTransferEmailHtml, buildIsoStartDate } from './emailTemplate'
import { buildIcsInvite } from './buildIcs'
import './SendEmail.css'

// ── Send Email page ─────────────────────────────────────────────────────────
// Standalone utility page: pick an event (pulled from every admin's account),
// a seat and quantity from that event's tickets, and a recipient — see the
// exact HTML email body live in the preview pane, then send it through the
// backend's /api/send-email (GoDaddy SMTP relay, configured via backend/.env).
const SendEmail = () => {
  const [to, setTo]               = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [sending, setSending]     = useState(false)
  const [status, setStatus]       = useState(null) // { type: 'success' | 'error', message }

  const [events, setEvents]             = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError]   = useState('')
  const [eventId, setEventId]           = useState('')
  const [seatIndex, setSeatIndex]       = useState(0)
  const [amount, setAmount]             = useState(1)
  const [includeCalendar, setIncludeCalendar] = useState(false)
  const [accessCode, setAccessCode]     = useState('')

  useEffect(() => {
    fetchAllEvents()
      .then(setEvents)
      .catch((err) => setEventsError(err.message || 'Failed to load events.'))
      .finally(() => setEventsLoading(false))
  }, [])

  const selectedEvent = useMemo(
    () => events.find((ev) => String(ev.id) === eventId) || null,
    [events, eventId]
  )
  const availableTickets = selectedEvent?.tickets || []
  const maxAmount = Math.max(1, availableTickets.length)
  // Amount is independent of which seat is selected — the chosen seat is
  // always included first, then filled up to `amount` from the rest of the
  // event's tickets. (Previously amount was capped by the selected seat's
  // position in the list, so picking a seat near the end silently blocked
  // selecting more than 1 ticket.)
  const chosenTicket = availableTickets[seatIndex] || null
  const restTickets = availableTickets.filter((_, idx) => idx !== seatIndex)
  const selectedTickets = chosenTicket ? [chosenTicket, ...restTickets].slice(0, amount) : []

  // 8-char code shown only in the email body — the recipient needs it plus
  // their email to unlock the ticket details in the attached tickets.html.
  // Regenerated per event pick, matching the intent of "this is a fresh
  // one-time code for this transfer," and kept in state so the value
  // previewed in the iframe is exactly what actually gets sent.
  const generateAccessCode = () => {
    const bytes = new Uint8Array(6)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 8)
  }

  const handleEventChange = (id) => {
    setEventId(id)
    setSeatIndex(0)
    setAmount(1)
    setAccessCode(id ? generateAccessCode() : '')
  }
  const handleSeatChange = (idx) => {
    setSeatIndex(idx)
  }

  const html = buildTransferEmailHtml({
    firstName,
    lastName,
    event: selectedEvent || undefined,
    tickets: selectedTickets.length ? selectedTickets : undefined,
    calendarMarkup: includeCalendar && !!selectedEvent,
    accessCode: selectedEvent ? accessCode : ''
  })
  const subject = selectedEvent
    ? `Your tickets for ${selectedEvent.name} are on the way`
    : `Hi ${firstName || 'there'}, your tickets are on the way`

  const ics = (includeCalendar && selectedEvent)
    ? buildIcsInvite(selectedEvent, buildIsoStartDate(selectedEvent))
    : null

  const handleSend = async (e) => {
    e.preventDefault()
    if (!to || sending) return
    setSending(true)
    setStatus(null)
    try {
      // event/tickets are sent as data, not a pre-built HTML file — the
      // backend generates a one-time token, hashes accessCode (bcrypt) and
      // stores it plus the ticket data server-side against that token, then
      // builds a verification-gated tickets.html attachment. The recipient
      // has to enter their email + this same access code (shown only in
      // the email body) before /api/verify-ticket-access releases the data.
      await sendEmail({
        to, firstName, lastName, subject, html, ics,
        event: selectedEvent || undefined,
        tickets: selectedTickets.length ? selectedTickets : undefined,
        accessCode: selectedEvent ? accessCode : undefined
      })
      setStatus({ type: 'success', message: `Sent to ${to}.` })
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to send email.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="se-page">
      <div className="se-header">
        <p className="se-title">Send Email</p>
        <p className="se-subtitle">Preview updates live as you type. Sends through the configured SMTP relay.</p>
      </div>

      <div className="se-layout">
        <form className="se-form" onSubmit={handleSend}>
          <p className="se-section-title">EVENT</p>

          <div className="se-field">
            <label htmlFor="se-event">Event</label>
            <select
              id="se-event"
              value={eventId}
              onChange={(e) => handleEventChange(e.target.value)}
              disabled={eventsLoading || !events.length}
            >
              <option value="">
                {eventsLoading ? 'Loading events…' : events.length ? 'Select an event…' : 'No events available'}
              </option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} — {ev.stadium}, {ev.city} ({ev.day} {ev.date})
                </option>
              ))}
            </select>
            {eventsError && <div className="se-status se-status--error">{eventsError}</div>}
            {selectedEvent && (
              <p className="se-field-hint">
                A "tickets.html" attachment will be included automatically, gated behind a one-time
                access code (<strong>{accessCode}</strong>) shown further down in the email body —
                the recipient enters their email + that code before the attachment reveals any
                ticket details.
              </p>
            )}
          </div>

          <div className="se-row">
            <div className="se-field">
              <label htmlFor="se-seat">Seat</label>
              <select
                id="se-seat"
                value={seatIndex}
                onChange={(e) => handleSeatChange(Number(e.target.value))}
                disabled={!availableTickets.length}
              >
                {availableTickets.length ? availableTickets.map((t, idx) => (
                  <option key={idx} value={idx}>
                    Section {t.section}, Row {t.row}, Seat {t.seat}
                  </option>
                )) : <option>No tickets on this event</option>}
              </select>
            </div>
            <div className="se-field">
              <label htmlFor="se-amount">Amount</label>
              <input
                id="se-amount"
                type="number"
                min="1"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(Math.min(maxAmount, Math.max(1, Number(e.target.value) || 1)))}
                disabled={!availableTickets.length}
              />
            </div>
          </div>

          <p className="se-section-title">RECIPIENT</p>

          <div className="se-field">
            <label htmlFor="se-to">Email</label>
            <input
              id="se-to"
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div className="se-row">
            <div className="se-field">
              <label htmlFor="se-first">First name</label>
              <input
                id="se-first"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jordan"
              />
            </div>
            <div className="se-field">
              <label htmlFor="se-last">Last name</label>
              <input
                id="se-last"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Lee"
              />
            </div>
          </div>

          <p className="se-section-title">CALENDAR</p>

          <div className="se-field se-field--checkbox">
            <label htmlFor="se-calendar">
              <input
                id="se-calendar"
                type="checkbox"
                checked={includeCalendar}
                onChange={(e) => setIncludeCalendar(e.target.checked)}
                disabled={!selectedEvent}
              />
              Include "Add to Calendar"
            </label>
            <p className="se-field-hint">
              Attaches a real .ics calendar invite (works in any email client, no setup needed)
              and adds Gmail Highlights structured data (schema.org) — the Highlights card only
              renders for real recipients once your sending domain is registered with Google, but
              the .ics attachment works right away.
            </p>
          </div>

          <button type="submit" className="se-send-btn" disabled={!to || sending}>
            {sending ? 'Sending…' : 'Send Email'}
          </button>

          {status && (
            <div className={`se-status se-status--${status.type}`}>{status.message}</div>
          )}
        </form>

        <div className="se-preview">
          <p className="se-section-title">EMAIL PREVIEW</p>
          <iframe
            title="Email preview"
            className="se-preview-frame"
            srcDoc={html}
            sandbox=""
          />
        </div>
      </div>
    </div>
  )
}

export default SendEmail
