// All admin and event operations go through the Railway backend.
// The backend holds the Supabase service role key securely.

// Same-origin by default — the backend serves this frontend build itself in
// production, so a relative path always reaches the right API. VITE_API_URL
// only needs to be set if the frontend is ever hosted separately again.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── LocalStorage helpers ──────────────────────────────────────────────────────

export const getAdminInfo = () => ({
  id: localStorage.getItem('adminId'),
  username: localStorage.getItem('adminUsername'),
  token: localStorage.getItem('adminToken')
});

export const isLoggedIn = () => !!localStorage.getItem('adminToken');

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

const request = async (path, options = {}) => {
  const { token } = getAdminInfo();

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server error (${res.status}) — is the Railway backend running? Response: ${text.slice(0, 100)}`);
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = async (username, password) => {
  const data = await request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  localStorage.setItem('adminToken', data.token);
  localStorage.setItem('adminId', data.id);
  localStorage.setItem('adminUsername', data.username);

  return data;
};

export const register = async (username, password) => {
  return await request('/admin/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
};

export const logout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminId');
  localStorage.removeItem('adminUsername');
};

// ── Admin Events ──────────────────────────────────────────────────────────────

export const fetchAdminEvents = async () => {
  return await request('/admin/events');
};

export const createEvent = async (eventData) => {
  return await request('/admin/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

export const updateEvent = async (id, eventData) => {
  return await request(`/admin/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData)
  });
};

export const deleteEvent = async (id) => {
  return await request(`/admin/events/${id}`, { method: 'DELETE' });
};

// ── Image Upload ──────────────────────────────────────────────────────────────

export const uploadImage = async (file) => {
  const { token } = getAdminInfo();
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}/admin/upload-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Image upload failed');
  return data.url;
};

// ── Public Events ─────────────────────────────────────────────────────────────

export const fetchAllEvents = async () => {
  const data = await request('/events');
  return data.map(event => ({
    ...event,
    IMG: event.image_url || null
  }));
};

export const changePassword = async (currentPassword, newPassword) => {
  return await request('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  });
};

export const deleteAccount = async (password) => {
  return await request('/admin/account', {
    method: 'DELETE',
    body: JSON.stringify({ password })
  });
};

// ── Transfer Fee (admin-configured) ───────────────────────────────────────────
// Per-ticket fee charged when transferring tickets. Set in the admin dashboard,
// read by the /firstfee page. Stored locally; default: $2.50.

const FEE_KEY = 'tm_transfer_fee';
const DEFAULT_TRANSFER_FEE = 2.5;

export const getFeeAmount = () => {
  const raw = parseFloat(localStorage.getItem(FEE_KEY));
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_TRANSFER_FEE;
};

export const setFeeAmount = (amount) => {
  const value = Math.max(0, parseFloat(amount) || 0);
  localStorage.setItem(FEE_KEY, String(value));
  // Notify open pages (e.g., fee page) that the fee changed
  window.dispatchEvent(new Event('feeUpdated'));
  return value;
};

// ── Email ──────────────────────────────────────────────────────────────────────

export const sendEmail = async ({ to, firstName, lastName, subject, html, ics, event, tickets, accessCode }) => {
  return await request('/send-email', {
    method: 'POST',
    body: JSON.stringify({ to, firstName, lastName, subject, html, ics, event, tickets, accessCode })
  });
};