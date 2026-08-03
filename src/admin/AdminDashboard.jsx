import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAdd, IoLogOut, IoTrash, IoPencil, IoPerson, IoImage, IoCash, IoPaperPlane, IoCheckmarkCircle } from 'react-icons/io5';
import { fetchAdminEvents, createEvent, updateEvent, deleteEvent, logout, getAdminInfo, uploadImage, getFeeAmount, setFeeAmount } from '../api';
import './Admin.css';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const admin = getAdminInfo();

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminEvents();
      setEvents(data);
    } catch (err) {
      // A stale/expired token isLoggedIn() still treats as "logged in" (it
      // only checks the token exists, not that it's still valid) — without
      // this, the dashboard silently shows an empty events list with a small
      // error banner forever. Send them back to sign in properly instead.
      if (/invalid or expired token/i.test(err.message)) {
        logout();
        navigate('/admin');
        return;
      }
      setError('Failed to load events: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/admin'); };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleEdit = (event) => { setEditingEvent(event); setShowForm(true); };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingEvent) {
        const updated = await updateEvent(editingEvent.id, formData);
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
      } else {
        const created = await createEvent(formData);
        setEvents(prev => [created, ...prev]);
      }
      setShowForm(false);
      setEditingEvent(null);
    } catch (err) {
      alert('Failed to save event: ' + err.message);
    }
  };

  const handleFormCancel = () => { setShowForm(false); setEditingEvent(null); };

  // ── Mark a single ticket sent/unsent ──────────────────────────────────────
  // Tickets are stored as a JSON array on the event row, so this just flips
  // one entry's `sent` flag and re-saves the whole event via the existing
  // update endpoint — no schema change needed.
  const handleToggleTicketSent = async (eventId, ticketIndex) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const newTickets = event.tickets.map((t, i) => {
      if (i !== ticketIndex) return t
      return t.sent
        ? { ...t, sent: false, sentAt: undefined }
        : { ...t, sent: true, sentAt: new Date().toISOString() }
    });
    try {
      const updated = await updateEvent(eventId, { ...event, tickets: newTickets });
      setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
    } catch (err) {
      alert('Failed to update ticket status: ' + err.message);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h1>Admin Dashboard</h1>
          <p className="admin-welcome">Welcome, {admin.username}</p>
        </div>
        <div className="header-actions">
          <div className="admin-profile">
            <IoPerson size={20} />
            <span>{admin.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <IoLogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <FeeSection />

        <TicketStatusSection events={events} onToggleSent={handleToggleTicketSent} />

        <div className="events-section">
          <div className="section-header">
            <h2>My Events ({events.length})</h2>
            <button className="add-event-btn" onClick={() => setShowForm(true)}>
              <IoAdd size={20} /> Create Event
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {showForm && (
            <EventForm
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              initialData={editingEvent}
            />
          )}

          <div className="events-grid">
            {loading ? (
              <div className="no-events"><p>Loading events...</p></div>
            ) : events.length === 0 ? (
              <div className="no-events">
                <p>No events created yet</p>
                <button className="create-first-btn" onClick={() => setShowForm(true)}>
                  Create Your First Event
                </button>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="event-card">
                  {event.image_url && (
                    <img src={event.image_url} alt={event.name} className="event-card-img" />
                  )}
                  <div className="event-card-header">
                    <h3>{event.name}</h3>
                    <div className="event-actions">
                      <button className="action-btn edit-btn" onClick={() => handleEdit(event)}>
                        <IoPencil size={16} />
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(event.id)}>
                        <IoTrash size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="event-card-body">
                    <p className="event-venue">{event.stadium}</p>
                    <p className="event-location">{event.city}, {event.state}</p>
                    <p className="event-datetime">{event.day} • {event.date} • {event.time}</p>
                    <p className="event-tickets-count">{event.tickets.length} ticket{event.tickets.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Transfer Fee Section ──────────────────────────────────────────────────────
// Sets the per-ticket fee shown on the /firstfee page when users transfer tickets.

const FeeSection = () => {
  const [feeInput, setFeeInput] = useState(() => getFeeAmount().toFixed(2));
  const [savedFee, setSavedFee] = useState(() => getFeeAmount());
  const [feeSaved, setFeeSaved] = useState(false);

  const handleSaveFee = (e) => {
    e.preventDefault();
    const value = setFeeAmount(feeInput);
    setSavedFee(value);
    setFeeInput(value.toFixed(2));
    setFeeSaved(true);
    setTimeout(() => setFeeSaved(false), 2000);
  };

  return (
    <div className="events-section fee-section">
      <div className="section-header">
        <h2><IoCash size={20} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Transfer Fee</h2>
        <span className="fee-current">
          Current: <strong>${savedFee.toFixed(2)}</strong> per ticket
        </span>
      </div>
      <p className="fee-description">
        This fee is charged per ticket when a user transfers tickets. It appears on the
        fee page shown after they fill in the recipient's details.
      </p>
      <form className="fee-form" onSubmit={handleSaveFee}>
        <div className="fee-input-wrap">
          <span className="fee-dollar">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="fee-input"
            value={feeInput}
            onChange={(e) => setFeeInput(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <button type="submit" className="submit-btn">
          {feeSaved ? '✓ Saved' : 'Save Fee'}
        </button>
      </form>
    </div>
  );
};

// ── Ticket Status Section ─────────────────────────────────────────────────────
// Lets the admin mark individual tickets as sent (transferred to their
// recipient) without opening the full edit form. Read by the consumer-facing
// ticket component to switch to a "Sent" design once flagged.

const TicketStatusSection = ({ events, onToggleSent }) => {
  const eventsWithTickets = events.filter(e => e.tickets?.length);

  return (
    <div className="events-section ticket-status-section">
      <div className="section-header">
        <h2><IoPaperPlane size={20} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Ticket Status</h2>
      </div>
      <p className="fee-description">
        Mark a ticket as sent once it's been transferred to its recipient. Sent tickets show a
        distinct "Sent" design in the ticket view instead of their live barcode.
      </p>

      {eventsWithTickets.length === 0 ? (
        <div className="no-events"><p>No tickets to manage yet</p></div>
      ) : (
        <div className="ts-event-list">
          {eventsWithTickets.map(event => (
            <div key={event.id} className="ts-event-group">
              <p className="ts-event-name">{event.name}</p>
              <div className="ts-ticket-rows">
                {event.tickets.map((ticket, idx) => (
                  <div key={idx} className={`ts-ticket-row ${ticket.sent ? 'ts-ticket-row--sent' : ''}`}>
                    <div className="ts-ticket-info">
                      {ticket.label && <span className="ts-ticket-label">{ticket.label}</span>}
                      <span className="ts-ticket-seat">
                        Sec {ticket.section} &middot; Row {ticket.row} &middot; Seat {ticket.seat}
                      </span>
                    </div>
                    <button
                      className={`ts-toggle-btn ${ticket.sent ? 'ts-toggle-btn--sent' : ''}`}
                      onClick={() => onToggleSent(event.id, idx)}
                    >
                      {ticket.sent ? (<><IoCheckmarkCircle size={15} /> Sent</>) : 'Mark Sent'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Event Form ────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'tm_event_form_draft';

const EMPTY_FORM = {
  name: '', state: '', city: '', stadium: '',
  time: '', date: '', day: '', orderNum: '',
  tickets: [{ label: 'ARTIST PRESALE', section: '', row: '', seat: '' }],
  image_url: ''
};

const EventForm = ({ onSubmit, onCancel, initialData }) => {
  const isCreate = !initialData;

  const normalizeTickets = (data) => ({
    ...data,
    tickets: (data.tickets || []).map(t => ({ label: '', ...t }))
  });

  const [formData, setFormData] = useState(() => {
    if (!isCreate) return normalizeTickets(initialData);
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : EMPTY_FORM;
    } catch { return EMPTY_FORM; }
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(() => {
    if (!isCreate) return initialData?.image_url || null;
    // Only restore preview if it's a real URL (not a blob:// which won't survive)
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const url = parsed.image_url || '';
        return url.startsWith('http') ? url : null;
      }
    } catch {}
    return null;
  });

  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);

  // Persist form state to sessionStorage on every change (create mode only)
  useEffect(() => {
    if (!isCreate) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    } catch {}
  }, [formData, isCreate]);

  const clearDraft = () => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  };

  const handleCancel = () => { clearDraft(); onCancel(); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTicketChange = (index, field, value) => {
    const newTickets = [...formData.tickets];
    newTickets[index][field] = value;
    setFormData({ ...formData, tickets: newTickets });
  };

  const addTicket = () =>
    setFormData({ ...formData, tickets: [...formData.tickets, { label: 'ARTIST PRESALE', section: '', row: '', seat: '' }] });

  const removeTicket = (index) => {
    if (formData.tickets.length > 1)
      setFormData({ ...formData, tickets: formData.tickets.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = formData.image_url || '';

      if (imageFile) {
        setUploadProgress('Uploading image...');
        imageUrl = await uploadImage(imageFile);
        setUploadProgress('');
      }

      await onSubmit({ ...formData, image_url: imageUrl || null });
      clearDraft();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="event-form-overlay">
      <div className="event-form-container">
        <div className="form-header">
          <h2>{initialData ? 'Edit Event' : 'Create New Event'}</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">

          {/* ── Image Upload ── */}
          <div className="form-section">
            <h3>Event Image</h3>
            <div className="image-upload-area">
              {imagePreview ? (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <div className="image-preview-actions">
                    <button type="button" className="change-image-btn"
                      onClick={() => fileInputRef.current?.click()}>
                      <IoImage size={16} /> Change Image
                    </button>
                    <button type="button" className="remove-image-btn"
                      onClick={handleRemoveImage}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="image-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <IoImage size={40} color="#ccc" />
                  <p className="dropzone-title">Click to upload event image</p>
                  <p className="dropzone-sub">PNG, JPG, WEBP up to 10MB — stored at full quality</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* ── Event Info ── */}
          <div className="form-section">
            <h3>Event Information</h3>
            <div className="form-group">
              <label>Event Name *</label>
              <input type="text" name="name" value={formData.name}
                onChange={handleInputChange} required
                placeholder="e.g., MATT RIFE: STAY GOLDEN WORLD TOUR" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>State *</label>
                <input type="text" name="state" value={formData.state}
                  onChange={handleInputChange} required placeholder="e.g., NC" />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input type="text" name="city" value={formData.city}
                  onChange={handleInputChange} required placeholder="e.g., Charlotte" />
              </div>
            </div>
            <div className="form-group">
              <label>Stadium / Venue *</label>
              <input type="text" name="stadium" value={formData.stadium}
                onChange={handleInputChange} required placeholder="e.g., Spectrum Center" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Day *</label>
                <select name="day" value={formData.day} onChange={handleInputChange} required>
                  <option value="">Select day</option>
                  {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="text" name="date" value={formData.date}
                  onChange={handleInputChange} required placeholder="e.g., JUN 28, 2026" />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input type="text" name="time" value={formData.time}
                  onChange={handleInputChange} required placeholder="e.g., 7:00 PM" />
              </div>
            </div>
          </div>

          {/* ── Order Info ── */}
          <div className="form-section">
            <h3>Order Information</h3>
            <div className="form-group">
              <label>Order Number *</label>
              <input type="text" name="orderNum" value={formData.orderNum}
                onChange={handleInputChange} required placeholder="e.g., 29000565917818235" />
            </div>
          </div>

          {/* ── Tickets ── */}
          <div className="form-section">
            <h3>Tickets</h3>
            {formData.tickets.map((ticket, index) => (
              <div key={index} className="ticket-row">
                <div className="ticket-header">
                  <span>Ticket {index + 1}</span>
                  {formData.tickets.length > 1 && (
                    <button type="button" className="remove-ticket-btn"
                      onClick={() => removeTicket(index)}>Remove</button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group form-group--full">
                    <label>Label</label>
                    <input type="text" value={ticket.label ?? ''}
                      onChange={(e) => handleTicketChange(index, 'label', e.target.value)}
                      placeholder="e.g., ARTIST PRESALE" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Section *</label>
                    <input type="text" value={ticket.section}
                      onChange={(e) => handleTicketChange(index, 'section', e.target.value)}
                      required placeholder="e.g., 105" />
                  </div>
                  <div className="form-group">
                    <label>Row *</label>
                    <input type="text" value={ticket.row}
                      onChange={(e) => handleTicketChange(index, 'row', e.target.value)}
                      required placeholder="e.g., B" />
                  </div>
                  <div className="form-group">
                    <label>Seat *</label>
                    <input type="text" value={ticket.seat}
                      onChange={(e) => handleTicketChange(index, 'seat', e.target.value)}
                      required placeholder="e.g., 13" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="add-ticket-btn" onClick={addTicket}>
              + Add Another Ticket
            </button>
          </div>

          <div className="form-actions">
            {uploadProgress && <span className="upload-status">{uploadProgress}</span>}
            <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? (uploadProgress || 'Saving...') : initialData ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
