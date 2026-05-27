import "../App.css"
import HeaderImg from '../imgs/event_header.jpg'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IoArrowBack } from 'react-icons/io5'
import { BsThreeDotsVertical, BsUpcScan, BsFiles } from 'react-icons/bs'
import { TbArrowUpRight, TbRefresh } from 'react-icons/tb'
import { fetchAdminEvents, isLoggedIn } from '../api'

const Event = () => {
  const [Events, setEvents] = useState([])
  const [display, setdisplay] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('tickets')
  const [activeView, setActiveView] = useState('upcoming')
  const [totalTickets, setTotalTickets] = useState(0)
  const [totalpastTickets] = useState(0)

  useEffect(() => {
    const loadEvents = async () => {
      if (!isLoggedIn()) {
        setEvents([])
        setTotalTickets(0)
        return
      }
      try {
        const data = await fetchAdminEvents()
        const withImages = data.map(e => ({
          ...e,
          IMG: e.image_url || null
        }))
        setEvents(withImages)
        setTotalTickets(withImages.length)
      } catch {
        setEvents([])
      }
    }

    loadEvents()

    window.addEventListener('storage', loadEvents)
    window.addEventListener('adminEventsUpdated', loadEvents)
    return () => {
      window.removeEventListener('storage', loadEvents)
      window.removeEventListener('adminEventsUpdated', loadEvents)
    }
  }, [])

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setActiveTab('tickets')
    setdisplay(true)
  }

  return (
    <div className="event-page">
      <div className="event">
        <img src={HeaderImg} alt="HeaderImg" />
        <div className="event-header-words" data-activeview={activeView}>
          <p
            className={activeView === 'upcoming' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveView('upcoming')}
          >UPCOMING ({totalTickets})</p>
          <p
            className={activeView === 'past' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveView('past')}
          >PAST ({totalpastTickets})</p>
        </div>

        {!isLoggedIn() ? (
          <div className="tickets-locked">
            <div className="tickets-locked-inner">
              <span className="tickets-locked-icon">🎟️</span>
              <p className="tickets-locked-title">Your tickets will appear here</p>
              <p className="tickets-locked-sub">Sign in to your admin account to view your events and tickets.</p>
            </div>
          </div>
        ) : Events.length === 0 ? (
          <div className="tickets-locked">
            <div className="tickets-locked-inner">
              <span className="tickets-locked-icon">📭</span>
              <p className="tickets-locked-title">No events yet</p>
              <p className="tickets-locked-sub">Events you create in your admin dashboard will show here.</p>
            </div>
          </div>
        ) : (
          <div className="tickets-cards">
            {Events.map((event, key) => (
              <div key={key} onClick={() => handleEventClick(event)}>
                <img src={event.IMG} alt={`${key} IMG`} />
                <div className="card-items">
                  <div className="timedetails">
                    <p>{event.day}</p> •
                    <p>{event.date}</p> •
                    <p>{event.time}</p>
                  </div>
                  <div className="eventdetails">
                    <p>{event.name}</p>
                    <hr />
                    <p>{event.stadium} - {event.state}, {event.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {display && selectedEvent && createPortal(
        <div className="ticketpopup">
          <div className="tp-hero-wrapper">
            <img src={selectedEvent.IMG} alt={selectedEvent.name} className="tp-hero-img" />
            <div className="tp-hero-overlay">
              <button className="tp-back-btn" onClick={() => setdisplay(false)}>
                <IoArrowBack size={18} />
              </button>
              <button className="tp-help-btn">Help</button>
            </div>
          </div>

          <div className="tp-event-info">
            <p className="tp-datetime">
              {selectedEvent.day} &bull; {selectedEvent.date} &bull; {selectedEvent.time}
            </p>
            <p className="tp-event-name">{selectedEvent.name}</p>
            <div className="tp-venue-row">
              <p className="tp-venue">
                {selectedEvent.stadium} &middot; {selectedEvent.state}, {selectedEvent.city}
              </p>
              <div className="tp-qr-group">
                <BsFiles size={18} color="white" />
                <span className="tp-ticket-x">x{selectedEvent.tickets.length}</span>
              </div>
            </div>
          </div>

          <button className="tp-view-tickets-btn">
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
          </div>

          <div className="tp-content">
            <div className="tp-order-row">
              <div>
                <p className="tp-order-num">Order #{selectedEvent.orderNum}</p>
                <p className="tp-order-count">x{selectedEvent.tickets.length} Tickets</p>
              </div>
              <BsThreeDotsVertical size={17} color="#000" />
            </div>

            {selectedEvent.tickets.map((ticket, idx) => (
              <div key={idx} className="tp-ticket-card">
                <p className="tp-ticket-label">TICKET</p>
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

          <div className="tp-bottom-bar">
            <div className="tp-bottom-actions">
              <button className="tp-action-btn">
                <TbArrowUpRight size={21} strokeWidth={1.8} />
                <span>Transfer</span>
              </button>
              <button className="tp-action-btn">
                <TbRefresh size={21} strokeWidth={1.8} />
                <span>Sell</span>
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('popup-container')
      )}
    </div>
  )
}

export default Event
