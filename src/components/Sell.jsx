import './Sell_Ticket.css'
import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { ImPencil } from 'react-icons/im'
import { IoClose } from 'react-icons/io5'
import { getAdminInfo } from '../api'

// ── ListingDetail ─────────────────────────────────────────────────────────────
// Shows full listing fields not visible on the card — triggered by card click.
const ListingDetail = ({ listing, onClose }) => {
  if (!listing) return null
  return (
    <div className='listing-detail-overlay' onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className='listing-detail'>
        <div className='listing-detail-header'>
          <p>{listing.eventName}</p>
          <IoClose size={22} onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>
        <div className='listing-detail-body'>
          <div><p>Status</p><p>{listing.status}</p></div>
          <div><p>Date</p><p>{listing.eventDate || '—'}</p></div>
          <div><p>Time</p><p>{listing.eventTime || '—'}</p></div>
          <div><p>Location</p><p>{listing.eventLocation || '—'}</p></div>
          <div><p>Total Price</p><p>USD${listing.totalPrice?.toFixed(2)}</p></div>
          <div><p>Payment Methods</p><p>{(listing.paymentMethods || []).join(', ')}</p></div>
          <div><p>Order #</p><p>{listing.uniqueLink}</p></div>
          <div><p>Buyer Email</p><p>{listing.buyerEmail || '—'}</p></div>
          <div><p>Buyer Name</p><p>{listing.buyerName || '—'}</p></div>
          <div><p>Payment Confirmed</p><p>{listing.paymentConfirmedAt ? new Date(listing.paymentConfirmedAt).toLocaleString() : '—'}</p></div>
          <div><p>Delivered</p><p>{listing.deliveredAt ? new Date(listing.deliveredAt).toLocaleString() : '—'}</p></div>
          <div><p>Created</p><p>{listing.createdAt ? new Date(listing.createdAt).toLocaleString() : '—'}</p></div>
          <div><p>Tickets</p>
            <div>
              {(listing.tickets || []).map((t, i) => (
                <p key={i}>{t.seat || JSON.stringify(t)}</p>
              ))}
            </div>
          </div>
          <div><p>Public Link</p><p style={{wordBreak:'break-all', fontSize:'12px'}}>{listing.publicUrl}</p></div>
        </div>
      </div>
    </div>
  )
}

const Sell = () => {

  const List_Options = ['Active', 'Sold', 'Expired']
  const [activeTab, setactiveTab] = useState('Active')
  const [listings, setListings] = useState([])
  const [selectedListing, setSelectedListing] = useState(null)

  const tabsRef = useRef({})
  const [barCenter, setbarCenter] = useState(0)

  useLayoutEffect(() => {
    const el = tabsRef.current[activeTab]
    if (el) setbarCenter(el.offsetLeft + el.offsetWidth / 2)
  }, [activeTab])

  // Fetch admin's resell listings from MySQL via resell backend
  const fetchListings = () => {
    const { token } = getAdminInfo()
    if (!token) return
    fetch('/api/admin/resell/listings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setListings(data) : null)
      .catch(console.error)
  }

  useEffect(() => {
    fetchListings()
    // Refetch whenever Sell_Ticket.jsx successfully creates a listing
    window.addEventListener('resellListingCreated', fetchListings)
    return () => window.removeEventListener('resellListingCreated', fetchListings)
  }, [])

  // Map status to tab
  const STATUS_MAP = {
    Active: ['active'],
    Sold: ['paid', 'delivered', 'pending_payment'],
    Expired: ['cancelled'],
  }
  const activeList = listings.filter(l => STATUS_MAP[activeTab]?.includes(l.status))

  return (
    <div className="sell">
      <div>
        {List_Options.map((option) => (
          <p
            key={option}
            ref={(el) => (tabsRef.current[option] = el)}
            onClick={() => setactiveTab(option)}
            className={option === activeTab ? "tab-active" : "tab-inactive"}
          >
            {option}
          </p>
        ))}
        <span className="tab-underline" style={{ left: barCenter }} />
      </div>
      {activeList.length === 0 && (
        <p style={{ textAlign: 'center', color: 'rgb(0,0,0,.4)', marginTop: '2rem', fontSize: '14px' }}>
          No {activeTab.toLowerCase()} listings
        </p>
      )}
      {activeList.map((listing) => (
          <div key={listing.id} className='event-list-card' style={{ cursor: 'pointer' }} onClick={() => setSelectedListing(listing)}>
            <div className="elc-status">
              <p>Listing Status: <span style={{textTransform:'capitalize'}}>{listing.status}</span></p>
              <p>#{listing.uniqueLink?.slice(0, 8)}</p>
            </div>
            <div className="elc-body">
              <div className="elc-time">
                <p>{listing.eventDate}</p> •
                <p>{listing.eventTime}</p>
              </div>
              <div className="elc-details">
                <p className="elc-title">{listing.eventName}</p>
                <hr />
                <p className="elc-venue">{listing.eventLocation}</p>
                <div className="elc-seats">
                  <p className="elc-count">{listing.tickets?.length}</p>
                  <p>{listing.tickets?.map(t => t.seat).join(', ')}</p>
                </div>
              </div>
              <div className="elc-price">
                <p className="elc-label">Total Listing Price</p>
                <p className="elc-amount">USD${listing.totalPrice?.toFixed(2)} <ImPencil size={12} /></p>
                <p className="elc-sub">Payment: {(listing.paymentMethods || []).join(', ')}</p>
              </div>
            </div>
            <div className="elc-remove"><p>Remove Listing</p></div>
          </div>
      ))}
      <ListingDetail listing={selectedListing} onClose={() => setSelectedListing(null)} />
    </div>
  )
}

export default Sell
