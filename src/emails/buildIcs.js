// Real iCalendar (.ics) invite content (RFC 5545) — attached to the email as
// a file, which is what actually makes Gmail/Outlook/Apple Mail show an
// "Add to Calendar" prompt. Unlike the JSON-LD Highlights markup, this needs
// no sender registration/whitelisting with Google.

const toIcsDate = (iso) => iso.replace(/[-:]/g, '').split('.')[0] + 'Z'

const escapeIcsText = (str = '') =>
  String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export const buildIcsInvite = (event, startDateIso) => {
  if (!startDateIso) return null

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@ticketmaster-demo`
  const dtstamp = toIcsDate(new Date().toISOString())
  const dtstart = toIcsDate(startDateIso)
  const location = [event.stadium, event.city, event.state].filter(Boolean).join(', ')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ticketmaster Demo//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `SUMMARY:${escapeIcsText(event.name)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
}
