import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAdd, IoTrash, IoCopy, IoCheckmark, IoClose, IoTicket } from 'react-icons/io5';
import { fetchAdminEvents, logout } from '../../api';
import { resellApi } from '../api';
import './AdminSell.css';

const AdminSell = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [totalPrice, setTotalPrice] = useState('');
  const [paymentMethods, setPaymentMethods] = useState({
    cashapp: { enabled: false, handle: '' },
    paypal: { enabled: false, email: '' },
    venmo: { enabled: false, handle: '' },
    zelle: { enabled: false, email: '' },
    applepay: { enabled: false, phone: '' },
    bank: { enabled: false, account: '', routing: '' },
    atm: { enabled: false, instructions: '' }
  });
  const [copiedLink, setCopiedLink] = useState(null);

  // VERIFICATION LOG - Remove after confirming
  console.log('🔧 AdminSell Component Loaded - Build: Sep 2, 2026');

  // Get admin token from localStorage (from main Ticketmaster app)
  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    if (adminToken) {
      loadData();
    }
  }, [adminToken]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, listingsData] = await Promise.all([
        fetchAdminEvents(),
        resellApi.getListings(adminToken)
      ]);
      setEvents(eventsData);
      setListings(listingsData);
    } catch (err) {
      // Handle expired token like AdminDashboard does
      if (/invalid or expired token/i.test(err.message)) {
        logout();
        navigate('/admin');
        return;
      }
      alert('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedEvent || selectedTickets.length === 0 || !totalPrice) {
      alert('Please select event, tickets, and enter price');
      return;
    }

    const enabledMethods = Object.entries(paymentMethods)
      .filter(([_, data]) => data.enabled)
      .reduce((acc, [key, data]) => {
        acc[key] = { ...data };
        delete acc[key].enabled;
        return acc;
      }, {});

    if (Object.keys(enabledMethods).length === 0) {
      alert('Please enable at least one payment method');
      return;
    }

    try {
      const listingData = {
        eventName: selectedEvent.name,
        eventDate: selectedEvent.date,
        eventTime: selectedEvent.time,
        eventLocation: `${selectedEvent.stadium}, ${selectedEvent.city}, ${selectedEvent.state}`,
        tickets: selectedTickets.map(ticketIndex => selectedEvent.tickets[ticketIndex]),
        totalPrice: parseFloat(totalPrice),
        paymentMethods: enabledMethods,
        barcodeData: selectedTickets.map(ticketIndex => ({
          section: selectedEvent.tickets[ticketIndex].section,
          row: selectedEvent.tickets[ticketIndex].row,
          seat: selectedEvent.tickets[ticketIndex].seat,
          barcode: selectedEvent.tickets[ticketIndex].barcode || null
        }))
      };

      await resellApi.createListing(listingData, adminToken);
      alert('Listing created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      alert('Error creating listing: ' + err.message);
    }
  };

  const resetForm = () => {
    setSelectedEvent(null);
    setSelectedTickets([]);
    setTotalPrice('');
    setPaymentMethods({
      cashapp: { enabled: false, handle: '' },
      paypal: { enabled: false, email: '' },
      venmo: { enabled: false, handle: '' },
      zelle: { enabled: false, email: '' },
      applepay: { enabled: false, phone: '' },
      bank: { enabled: false, account: '', routing: '' },
      atm: { enabled: false, instructions: '' }
    });
  };

  const copyLink = (link) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    } else {
      // Fallback for non-HTTPS contexts (local network IPs)
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedLink(link);
        setTimeout(() => setCopiedLink(null), 2000);
      } catch (err) {
        alert('Copy failed. Link: ' + link);
      }
      document.body.removeChild(textarea);
    }
  };

  const handleConfirmPayment = async (listingId) => {
    if (!window.confirm('Confirm payment received for this listing?')) return;
    try {
      await resellApi.confirmPayment(listingId, adminToken);
      alert('Payment confirmed!');
      loadData();
    } catch (err) {
      alert('Error confirming payment: ' + err.message);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await resellApi.deleteListing(listingId, adminToken);
      loadData();
    } catch (err) {
      alert('Error deleting listing: ' + err.message);
    }
  };

  const toggleTicket = (index) => {
    setSelectedTickets(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const updatePaymentMethod = (method, field, value) => {
    setPaymentMethods(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: value
      }
    }));
  };

  if (!adminToken) {
    return (
      <div className="admin-sell">
        <div className="no-auth">
          <h2>Please log in as admin</h2>
          <p>You must be logged in to the main Ticketmaster admin dashboard first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-sell">
      <div className="sell-header">
        <h1>Resell Tickets</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <IoAdd /> Create Listing
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="listings-grid">
          {listings.length === 0 ? (
            <div className="empty-state">
              <IoTicket size={64} color="#ccc" />
              <p>No listings yet. Create your first resell listing.</p>
            </div>
          ) : (
            listings.map(listing => (
              <div key={listing.id} className="listing-card">
                <div className="listing-header">
                  <h3>{listing.eventName}</h3>
                  <span className={`status-badge status-${listing.status}`}>
                    {listing.status}
                  </span>
                </div>
                <div className="listing-details">
                  <p><strong>Date:</strong> {listing.eventDate || 'N/A'}</p>
                  <p><strong>Location:</strong> {listing.eventLocation}</p>
                  <p><strong>Tickets:</strong> {listing.tickets.length}</p>
                  <p><strong>Price:</strong> ${listing.totalPrice.toFixed(2)}</p>
                </div>

                {listing.buyerName && (
                  <div className="buyer-info">
                    <strong>Buyer:</strong> {listing.buyerName}
                    {listing.buyerEmail && <span> ({listing.buyerEmail})</span>}
                  </div>
                )}

                <div className="listing-link">
                  <input
                    type="text"
                    value={listing.publicUrl}
                    readOnly
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => copyLink(listing.publicUrl)}
                    className="btn-copy"
                  >
                    {copiedLink === listing.publicUrl ? <IoCheckmark /> : <IoCopy />}
                  </button>
                </div>

                <div className="listing-actions">
                  {listing.status === 'pending_payment' && (
                    <button
                      onClick={() => handleConfirmPayment(listing.id)}
                      className="btn-confirm"
                    >
                      <IoCheckmark /> Confirm Payment
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="btn-delete"
                  >
                    <IoTrash /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Resell Listing</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-close">
                <IoClose />
              </button>
            </div>

            <div className="modal-body">
              {/* Step 1: Select Event */}
              <div className="form-section">
                <h3>1. Select Event</h3>
                <select
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const event = events.find(ev => ev.id === e.target.value);
                    setSelectedEvent(event);
                    setSelectedTickets([]);
                  }}
                  className="form-select"
                >
                  <option value="">Choose an event...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {event.date}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Tickets */}
              {selectedEvent && (
                <div className="form-section">
                  <h3>2. Select Tickets ({selectedTickets.length} selected)</h3>
                  <div className="tickets-list">
                    {selectedEvent.tickets.map((ticket, index) => (
                      <div
                        key={index}
                        className={`ticket-item ${selectedTickets.includes(index) ? 'selected' : ''}`}
                        onClick={() => toggleTicket(index)}
                      >
                        <span>Section {ticket.section}, Row {ticket.row}, Seat {ticket.seat}</span>
                        {selectedTickets.includes(index) && <IoCheckmark />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Set Price */}
              {selectedTickets.length > 0 && (
                <div className="form-section">
                  <h3>3. Total Price</h3>
                  <div className="price-input">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Configure Payment Methods */}
              {totalPrice && (
                <div className="form-section">
                  <h3>4. Payment Methods</h3>
                  <div className="payment-methods">
                    {/* CashApp */}
                    <div className="payment-method">
                      <label>
                        <input
                          type="checkbox"
                          checked={paymentMethods.cashapp.enabled}
                          onChange={(e) => updatePaymentMethod('cashapp', 'enabled', e.target.checked)}
                        />
                        CashApp
                      </label>
                      {paymentMethods.cashapp.enabled && (
                        <input
                          type="text"
                          placeholder="$CashTag"
                          value={paymentMethods.cashapp.handle}
                          onChange={(e) => updatePaymentMethod('cashapp', 'handle', e.target.value)}
                        />
                      )}
                    </div>

                    {/* PayPal */}
                    <div className="payment-method">
                      <label>
                        <input
                          type="checkbox"
                          checked={paymentMethods.paypal.enabled}
                          onChange={(e) => updatePaymentMethod('paypal', 'enabled', e.target.checked)}
                        />
                        PayPal
                      </label>
                      {paymentMethods.paypal.enabled && (
                        <input
                          type="email"
                          placeholder="paypal@email.com"
                          value={paymentMethods.paypal.email}
                          onChange={(e) => updatePaymentMethod('paypal', 'email', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Venmo */}
                    <div className="payment-method">
                      <label>
                        <input
                          type="checkbox"
                          checked={paymentMethods.venmo.enabled}
                          onChange={(e) => updatePaymentMethod('venmo', 'enabled', e.target.checked)}
                        />
                        Venmo
                      </label>
                      {paymentMethods.venmo.enabled && (
                        <input
                          type="text"
                          placeholder="@username"
                          value={paymentMethods.venmo.handle}
                          onChange={(e) => updatePaymentMethod('venmo', 'handle', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Zelle */}
                    <div className="payment-method">
                      <label>
                        <input
                          type="checkbox"
                          checked={paymentMethods.zelle.enabled}
                          onChange={(e) => updatePaymentMethod('zelle', 'enabled', e.target.checked)}
                        />
                        Zelle
                      </label>
                      {paymentMethods.zelle.enabled && (
                        <input
                          type="email"
                          placeholder="zelle@email.com"
                          value={paymentMethods.zelle.email}
                          onChange={(e) => updatePaymentMethod('zelle', 'email', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Apple Pay */}
                    <div className="payment-method">
                      <label>
                        <input
                          type="checkbox"
                          checked={paymentMethods.applepay.enabled}
                          onChange={(e) => updatePaymentMethod('applepay', 'enabled', e.target.checked)}
                        />
                        Apple Pay
                      </label>
                      {paymentMethods.applepay.enabled && (
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={paymentMethods.applepay.phone}
                          onChange={(e) => updatePaymentMethod('applepay', 'phone', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Bank Transfer */}
                    <div className="payment-method">
                      <label>
                        <input
                          type="checkbox"
                          checked={paymentMethods.bank.enabled}
                          onChange={(e) => updatePaymentMethod('bank', 'enabled', e.target.checked)}
                        />
                        Bank Transfer
                      </label>
                      {paymentMethods.bank.enabled && (
                        <>
                          <input
                            type="text"
                            placeholder="Account number"
                            value={paymentMethods.bank.account}
                            onChange={(e) => updatePaymentMethod('bank', 'account', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Routing number"
                            value={paymentMethods.bank.routing}
                            onChange={(e) => updatePaymentMethod('bank', 'routing', e.target.value)}
                          />
                        </>
                      )}
                    </div>

                    {/* ATM / Cash */}
                    <div className="payment-method">
                      <label>
                        <input
                          type="checkbox"
                          checked={paymentMethods.atm.enabled}
                          onChange={(e) => updatePaymentMethod('atm', 'enabled', e.target.checked)}
                        />
                        ATM / Cash
                      </label>
                      {paymentMethods.atm.enabled && (
                        <textarea
                          placeholder="Instructions for cash payment..."
                          value={paymentMethods.atm.instructions}
                          onChange={(e) => updatePaymentMethod('atm', 'instructions', e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateListing} className="btn-primary">
                Create Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSell;
