import "../App.css"
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IoArrowBack } from 'react-icons/io5'
import { BsThreeDotsVertical, BsUpcScan } from 'react-icons/bs'
import { LuTickets } from 'react-icons/lu'
import { TbArrowUpRight, TbRefresh } from 'react-icons/tb'
import { fetchAdminEvents, isLoggedIn } from '../api'
import Transfer from './Transfer'
import MapEmbed from './MapEmbed'

// Parse "JUN 28, 2026" or "JUN 28" (year optional) reliably across all browsers.
// If the year is missing, assume current year; if that date has already passed
// this year, assume next year — so a year-less date is always upcoming until it passes.
const MONTH = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 }
const isPast = (dateStr) => {
  try {
    const parts = (dateStr || '').replace(',', '').trim().split(/\s+/)
    const m = MONTH[(parts[0] || '').toUpperCase()]
    const d = parseInt(parts[1])
    if (m === undefined || isNaN(d)) return false

    let y = parts.length >= 3 ? parseInt(parts[2]) : NaN

    if (isNaN(y)) {
      // No year stored — pick the next occurrence of this month/day
      const now = new Date()
      y = now.getFullYear()
      if (new Date(y, m, d) < now) y += 1
    }

    // Past only after midnight of the day after the event
    return new Date(y, m, d + 1) < new Date()
  } catch { return false }
}

// Geocode a single event — returns { lat, lon } or null
const geocodeEvent = async (ev) => {
  const query = `${ev.stadium}, ${ev.city}, ${ev.state}`
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { Accept: 'application/json' } }
    )
    const data = await r.json()
    if (data && data[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {}
  return null
}

// Geocode all events sequentially in the background (Nominatim: 1 req/sec)
const geocodeAll = async (events, onResult) => {
  for (const ev of events) {
    const coords = await geocodeEvent(ev)
    onResult(ev.id, coords)
    await new Promise(r => setTimeout(r, 250))
  }
}


// ── Event card with dynamic HR width matching last text line ──────────────────
const EventCard = ({ event, isPast, onClick }) => {
  const titleRef = useRef(null)
  const hrRef    = useRef(null)

  useLayoutEffect(() => {
    const measure = () => {
      if (!titleRef.current || !hrRef.current) return
      const range = document.createRange()
      range.selectNodeContents(titleRef.current)
      const rects = Array.from(range.getClientRects()).filter(r => r.width > 1)
      if (rects.length > 0) {
        hrRef.current.style.width = Math.ceil(rects[rects.length - 1].width) + 'px'
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (titleRef.current) ro.observe(titleRef.current)
    return () => ro.disconnect()
  }, [event.name])

  return (
    <div className="ticket-card-wrap" onClick={onClick}>
      <div className="ticket-card-img-wrap">
        <img src={event.IMG} alt={event.name} />
        {isPast && <span className="past-event-badge">PAST EVENT</span>}
      </div>
      <div className="card-items">
        <div className="timedetails">
          <p>{event.day}</p> •
          <p>{event.date}</p> •
          <p>{event.time}</p>
        </div>
        <div className="eventdetails">
          <p ref={titleRef}>{event.name}</p>
          <hr ref={hrRef} />
          <p>{event.stadium} - {event.city}, {event.state}</p>
        </div>
      </div>
    </div>
  )
}

const Event = () => {
  const [Events, setEvents]           = useState([])
  const [coordsMap, setCoordsMap]       = useState({}) // eventId -> { lat, lon } | null
  const [display, setDisplay]         = useState(false)
  const [selectedEvent, setSelected]  = useState(null)
  const [activeTab, setActiveTab]     = useState('tickets')
  const [activeView, setActiveView]   = useState('upcoming')
  const [showTransfer, setShowTransfer] = useState(false)
  const [skelLoading, setSkelLoading] = useState(false)
  const [vtLoading, setVtLoading]     = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const [moreOptsVisible, setMoreOptsVisible] = useState(false)
  const popupRef    = useRef(null)
  const moreOptsRef = useRef(null)

  // ── Load events ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!isLoggedIn()) { setEvents([]); return }
      try {
        const data = await fetchAdminEvents()
        const mapped = data.map(e => ({ ...e, IMG: e.image_url || null }))
        setEvents(mapped)
        // Start geocoding immediately — results trickle in as each resolves
        geocodeAll(mapped, (id, coords) => {
          setCoordsMap(prev => ({ ...prev, [id]: coords }))
        })
      } catch { setEvents([]) }
    }
    load()
    window.addEventListener('storage', load)
    window.addEventListener('adminEventsUpdated', load)
    return () => {
      window.removeEventListener('storage', load)
      window.removeEventListener('adminEventsUpdated', load)
    }
  }, [])

  // ── Scroll detection: sticky header + MORE OPTIONS reveal ────────
  useEffect(() => {
    if (!display) { setScrolled(false); setMoreOptsVisible(false); return }
    const el = popupRef.current
    if (!el) return
    const onScroll = () => {
      const top = el.scrollTop
      setScrolled(top > 265)
      const moreEl = moreOptsRef.current
      if (moreEl) {
        setMoreOptsVisible(top + el.clientHeight > moreEl.offsetTop + 80)
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [display])

  // ── Open ticket detail with brief skeleton ────────────────────────
  const handleEventClick = (event) => {
    setSelected(event)
    setActiveTab('tickets')
    setScrolled(false)
    setVtLoading(false)
    setSkelLoading(true)
    setDisplay(true)
    setTimeout(() => setSkelLoading(false), 520)
  }

  const closePopup = () => { setDisplay(false); setShowTransfer(false); setMoreOptsVisible(false) }

  // ── View Tickets tap ─────────────────────────────────────────────
  const handleViewTickets = () => {
    if (vtLoading) return
    setVtLoading(true)
    setTimeout(() => setVtLoading(false), 2200)
  }

  // ── Filter + sort by event date ───────────────────────────────────
  const toTimestamp = (dateStr) => {
    try {
      const parts = (dateStr || '').replace(',', '').trim().split(/\s+/)
      const MONTH = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 }
      const m = MONTH[(parts[0] || '').toUpperCase()]
      const d = parseInt(parts[1])
      if (m === undefined || isNaN(d)) return 0
      let y = parts.length >= 3 ? parseInt(parts[2]) : NaN
      if (isNaN(y)) {
        const now = new Date()
        y = now.getFullYear()
        if (new Date(y, m, d) < now) y += 1
      }
      return new Date(y, m, d).getTime()
    } catch { return 0 }
  }
  const upcoming = Events.filter(e => !isPast(e.date))
    .sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date))
  const past = Events.filter(e => isPast(e.date))
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
  const visible = activeView === 'upcoming' ? upcoming : past

  return (
    <div className="event-page">
      <div className="event">

        {/* ── Page header ── */}
        <div className="me-header">
          <span className="me-title">My Events 🇺🇸</span>
          <button className="me-help-btn">Help</button>
        </div>

        {/* ── Tabs ── */}
        <div className="event-header-words" data-activeview={activeView}>
          <p
            className={activeView === 'upcoming' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveView('upcoming')}
          >UPCOMING ({upcoming.length})</p>
          <p
          
            className={activeView === 'past' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveView('past')}
          >PAST ({past.length})</p>
        </div>

        {/* ── Content ── */}
        {!isLoggedIn() ? (
          <div className="tickets-locked">
            <div className="tickets-locked-inner">
              <span className="tickets-locked-icon">🎟️</span>
              <p className="tickets-locked-title">Your tickets will appear here</p>
              <p className="tickets-locked-sub">Sign in to your admin account to view your events and tickets.</p>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="tickets-locked">
            <div className="tickets-locked-inner">
              <span className="tickets-locked-icon">📭</span>
              <p className="tickets-locked-title">No {activeView} events</p>
              <p className="tickets-locked-sub">
                {activeView === 'upcoming'
                  ? 'Events you create will appear here.'
                  : 'Past events will appear here once they have passed.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="tickets-cards">
            {visible.map((event, key) => (
              <EventCard
                key={key}
                event={event}
                isPast={activeView === 'past'}
                onClick={() => handleEventClick(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Scroll header ── */}
      {display && selectedEvent && createPortal(
        <div className={`tp-scroll-header ${scrolled ? 'tp-scroll-header--visible' : ''}`}>
          <button className="tp-scroll-back" onClick={closePopup}>
            <IoArrowBack size={20} />
          </button>
          <div className="tp-scroll-titles">
            <p className="tp-scroll-name">{selectedEvent.name}</p>
            <p className="tp-scroll-venue">{selectedEvent.stadium} · {selectedEvent.city}, {selectedEvent.state}</p>
          </div>
          <button className="tp-scroll-qr">
            <BsUpcScan size={18} color="#fff" />
          </button>
        </div>,
        document.getElementById('popup-container')
      )}

      {/* ── Ticket detail popup ── */}
      {display && selectedEvent && createPortal(
        <div className="ticketpopup" ref={popupRef}>

          <div className="tp-notch-cap" />

          {/* Hero */}
          <div className="tp-hero-wrapper">
            <img src={selectedEvent.IMG} alt={selectedEvent.name} className="tp-hero-img" />
            <div className="tp-hero-overlay">
              <button className="tp-back-btn" onClick={closePopup}>
                <IoArrowBack size={18} />
              </button>
              <button className="tp-help-btn">Help</button>
            </div>
          </div>

          {/* Skeleton */}
          {skelLoading ? (
            <div className="tp-skeleton">
              <div className="tp-skel-info">
                <div className="tp-skel-bar w60" />
                <div className="tp-skel-bar w90 tall" />
                <div className="tp-skel-bar w45" />
              </div>
              <div className="tp-skel-btn" />
              <div className="tp-skel-tabs">
                <div className="tp-skel-tab" />
                <div className="tp-skel-tab" />
              </div>
              <div className="tp-skel-content">
                <div className="tp-skel-bar w70" style={{marginBottom:6}} />
                <div className="tp-skel-bar w40" />
                <div className="tp-skel-card" />
                <div className="tp-skel-card" />
              </div>
            </div>
          ) : (
            <>
              <p className="tp-datetime">
                {selectedEvent.day} &bull; {selectedEvent.date} &bull; {selectedEvent.time}
              </p>

              <div className="tp-event-info">
                <p className="tp-event-name">{selectedEvent.name}</p>
                <div className="tp-venue-row">
                  <p className="tp-venue">
                    {selectedEvent.stadium} &middot; {selectedEvent.city}, {selectedEvent.state}
                  </p>
                  <div className="tp-qr-group">
                    <LuTickets size={18} color="white" />
                    <span className="tp-ticket-x">x{selectedEvent.tickets.length}</span>
                  </div>
                </div>
              </div>

              <button
                className={`tp-view-tickets-btn ${vtLoading ? 'tp-view-tickets-btn--loading' : ''}`}
                onClick={handleViewTickets}
              >
                <BsUpcScan size={17} />
                <span>View Tickets</span>
              </button>

              <div className="tp-tabs">
                <button
                  className={`tp-tab ${activeTab === 'tickets' ? 'tp-tab-active' : ''}`}
                  onClick={() => setActiveTab('tickets')}
                >Tickets</button>
                <button
                  className={`tp-tab ${activeTab === 'extras' ? 'tp-tab-active' : ''}`}
                  onClick={() => setActiveTab('extras')}
                >Extras</button>
                <span className="tp-tab-indicator-dot"></span>
              </div>

              <div className="tp-content">
                <div className="tp-order-row">
                  <div>
                    <p className="tp-order-num">Order #{selectedEvent.orderNum}</p>
                    <p className="tp-order-count">x{selectedEvent.tickets.length} Tickets</p>
                  </div>
                  <BsThreeDotsVertical size={17} color="#000" />
                </div>

                {vtLoading && (
                  <div className="tp-vt-spinner-wrap">
                    <div className="tp-vt-spinner" />
                  </div>
                )}

                {selectedEvent.tickets.map((ticket, idx) => (
                  <div key={idx} className="tp-ticket-card">
                    {ticket.label && <p className="tp-ticket-label">{ticket.label}</p>}
                    <div className="tp-ticket-details">
                      <div className="tp-ticket-field tp-field-left">
                        <p className="tp-field-label">SECTION</p>
                        <p className="tp-field-value">{ticket.section}</p>
                      </div>
                      <div className="tp-ticket-field tp-field-center">
                        <p className="tp-field-label">ROW</p>
                        <p className="tp-field-value">{ticket.row}</p>
                      </div>
                      <div className="tp-ticket-field tp-field-right">
                        <p className="tp-field-label">SEAT</p>
                        <p className="tp-field-value">{ticket.seat}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                ref={moreOptsRef}
                className={`tp-more-options${moreOptsVisible ? ' tp-more-options--visible' : ''}`}
              >
                <p className="tp-more-label">MORE OPTIONS</p>
                <MapEmbed
                  stadium={selectedEvent.stadium}
                  city={selectedEvent.city}
                  state={selectedEvent.state}
                  preloadedCoords={coordsMap[selectedEvent.id]}
                />
                <a
                  className="tp-directions-btn"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedEvent.stadium}, ${selectedEvent.city}, ${selectedEvent.state}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Directions
                </a>

                <div className="tp-share-card">
                  <div className="tp-share-card-left">
                    <img src={selectedEvent.IMG} alt={selectedEvent.name} className="tp-share-card-img" />
                    <div className="tp-share-card-overlay">
                      <p className="tp-share-card-date">{selectedEvent.day} • {selectedEvent.date} • {selectedEvent.time}</p>
                      <p className="tp-share-card-name">{selectedEvent.name}</p>
                      <p className="tp-share-card-venue">{selectedEvent.stadium}, {selectedEvent.city}</p>
                    </div>
                  </div>
                  <div className="tp-share-card-right">
                    <p className="tp-got-tickets">YOU GOT TICKETS!</p>
                  </div>
                </div>

                <p className="tp-social-title">Post on Social Media</p>
                <p className="tp-social-sub">
                  Build hype for the event, and share that you got tickets with your friends and family.
                </p>
                <button
                  className="tp-share-btn"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: selectedEvent.name,
                        text: `I got tickets to ${selectedEvent.name} at ${selectedEvent.stadium}!`,
                      }).catch(() => {})
                    }
                  }}
                >
                  Share You're Going
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </button>
              </div>
            </>
          )}

          <div className="tp-bottom-bar">
            <div className="tp-bottom-actions">
              <button className="tp-action-btn" onClick={() => setShowTransfer(true)}>
                <TbArrowUpRight size={21} strokeWidth={1.8} />
                <span>Transfer</span>
              </button>
              <hr className="hr-bottom-bar"/>
              <button className="tp-action-btn">
                <TbRefresh size={21} strokeWidth={1.8} style={{color:'lightgray'}}/>
                <span style={{color:'lightgray'}}>Sell</span>
              </button>
            </div>
          </div>

          {showTransfer && (
            <Transfer event={selectedEvent} onClose={() => setShowTransfer(false)} />
          )}
        </div>,
        document.getElementById('popup-container')
      )}
    </div>
  )
}

export default Event
