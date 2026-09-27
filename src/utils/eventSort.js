// Shared event-sorting logic used by both the admin dashboard's "My Events"
// list and the customer-facing "My Events" tab, so the two stay in sync via
// the same localStorage preference.

export const EVENT_SORT_STORAGE_KEY = 'admin-event-sort';

// Alphanumeric-aware compare so values like "9" sort before "10" instead of
// lexicographically ("10" before "9").
export const naturalCompare = (a, b) =>
  String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });

export const EVENT_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'event-date', label: 'Event date' },
  { value: 'city', label: 'City (A–Z)' },
  { value: 'tickets-desc', label: 'Most tickets' },
  { value: 'tickets-asc', label: 'Fewest tickets' },
];

// Best-effort parse of the free-text event date field (e.g. "JUN 28, 2026")
// into a sortable timestamp. Falls back to 0 (sorts first) if unparseable,
// so a bad/missing date never throws — it just sorts to the top.
export const parseEventDate = (event) => {
  const ts = Date.parse(event?.date || '');
  return Number.isNaN(ts) ? 0 : ts;
};

export const getSortedEvents = (events, sortBy) => {
  const copy = [...events];
  switch (sortBy) {
    case 'oldest':
      return copy.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    case 'name-asc':
      return copy.sort((a, b) => naturalCompare(a.name, b.name));
    case 'name-desc':
      return copy.sort((a, b) => naturalCompare(b.name, a.name));
    case 'event-date':
      return copy.sort((a, b) => parseEventDate(a) - parseEventDate(b));
    case 'city':
      return copy.sort((a, b) => naturalCompare(a.city, b.city));
    case 'tickets-desc':
      return copy.sort((a, b) => (b.tickets?.length || 0) - (a.tickets?.length || 0));
    case 'tickets-asc':
      return copy.sort((a, b) => (a.tickets?.length || 0) - (b.tickets?.length || 0));
    case 'newest':
    default:
      return copy.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
};
