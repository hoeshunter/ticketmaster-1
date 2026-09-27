// Resell API client for Ticketmaster
// Backend runs on port 3002 (separate from main Ticketmaster backend on 3001)

const RESELL_API_BASE = import.meta.env.VITE_RESELL_API_URL || '/api/resell';
const MAIN_API_BASE = import.meta.env.VITE_API_URL || '/api';

// Admin API client
export const resellApi = {
  // Get admin's events from main Ticketmaster backend (to select tickets from)
  getAdminEvents: async (token) => {
    const res = await fetch(`${MAIN_API_BASE}/admin/events`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  // Create resell listing
  createListing: async (listingData, token) => {
    const res = await fetch(`${RESELL_API_BASE}/admin/resell/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(listingData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create listing');
    }
    return res.json();
  },

  // Get admin's listings
  getListings: async (token) => {
    const res = await fetch(`${RESELL_API_BASE}/admin/resell/listings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch listings');
    return res.json();
  },

  // Confirm payment
  confirmPayment: async (listingId, token) => {
    const res = await fetch(`${RESELL_API_BASE}/admin/resell/listings/${listingId}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to confirm payment');
    return res.json();
  },

  // Delete listing
  deleteListing: async (listingId, token) => {
    const res = await fetch(`${RESELL_API_BASE}/admin/resell/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete listing');
    return res.json();
  },

  // Public buyer endpoints
  getPublicListing: async (uniqueLink) => {
    const res = await fetch(`${RESELL_API_BASE}/resell/${uniqueLink}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to load listing');
    }
    return res.json();
  },

  // Submit buyer payment
  submitPayment: async (uniqueLink, paymentData) => {
    const res = await fetch(`${RESELL_API_BASE}/resell/${uniqueLink}/submit-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit payment');
    }
    return res.json();
  },

  // Poll payment status
  getPaymentStatus: async (uniqueLink) => {
    const res = await fetch(`${RESELL_API_BASE}/resell/${uniqueLink}/payment-status`);
    if (!res.ok) throw new Error('Failed to check payment status');
    return res.json();
  }
};
