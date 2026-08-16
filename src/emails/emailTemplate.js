// Transfer-notification email body — the full real Ticketmaster template
// (CSS, responsive media-query block, Outlook conditionals, table structure,
// exact wording) used as the literal base, with ONLY the per-transfer
// specifics (sender, event, tickets, recipient) swapped for template
// variables. Three things are still deliberately not copied, because they
// aren't cosmetic — they're either broken-by-default or actively harmful:
//   1. Their hotlinked logo/icon/@font-face CDN URLs — not ours to embed,
//      would 404 (their real analytics/CDN isn't provisioned for this app).
//   2. The real open-tracking pixel (click.email.ticketmaster.com/open.aspx)
//      — that's a live Salesforce Marketing Cloud analytics beacon; embedding
//      it would report fake "opens" into Ticketmaster's real marketing data.
//   3. Live tracking-token transfer links — replaced with transferLink/#,
//      since this app has no real transfer-acceptance backend to point to.
// Shared by the /sendemail preview and the actual payload sent to
// POST /api/send-email, so what you see is what sends.

const BRAND_BLUE = '#024DDF'
const FONT_STACK = 'Arial, Helvetica, sans-serif'

// Emails are opened in Gmail — a different origin than this app entirely —
// so any embedded <img> needs a real, publicly reachable absolute URL.
// event.image_url is stored as a relative path ("/uploads/xyz.jpg"), only
// valid same-origin with the backend. Previously this relied on a
// VITE_PUBLIC_ORIGIN env var that was never actually set, so the sent
// email silently got a bare relative src — broken in every real inbox,
// even though it looked fine in this app's own same-origin preview iframe.
// window.location.origin is used instead: in production the backend serves
// both the frontend and /uploads from the same origin (single-service
// deploy), and in local dev /uploads is reachable from whichever host/IP
// the page itself is currently being browsed from — no env var to go
// stale when switching networks.
const EMAIL_BACKEND_ORIGIN = typeof window !== 'undefined' ? window.location.origin : ''
const resolveAbsoluteImageUrl = (path) => {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${EMAIL_BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`
}

const DEFAULT_EVENT = {
  name: 'Your Event',
  day: 'Sat', date: 'TBD', time: '7:00 PM',
  stadium: 'Venue', city: 'City', state: 'ST'
}
const DEFAULT_TICKETS = [{ section: '—', row: '—', seat: '—' }]

// event.date is a free-text field the admin dashboard collects (placeholder
// "JUN 28, 2026") — usually already includes a year, but not guaranteed.
// Only append the current year when one isn't already present, otherwise
// dates like "JUN 28, 2026" become the unparseable "JUN 28, 2026, 2026 ...".
// Best-effort ISO 8601 startDate — not guaranteed for every date format.
// Shared with buildIcs.js.
export const buildIsoStartDate = (event) => {
  try {
    const hasYear = /\b\d{4}\b/.test(event.date)
    const dateTimeStr = hasYear
      ? `${event.date} ${event.time}`
      : `${event.date}, ${new Date().getFullYear()} ${event.time}`
    const parsed = new Date(dateTimeStr)
    return isNaN(parsed.getTime()) ? null : parsed.toISOString()
  } catch {
    return null
  }
}

// Gmail "Highlights" structured data (schema.org EventReservation). Renders
// as a native Add to Calendar / Directions card — but only for real Gmail
// recipients once the sending domain is registered & whitelisted with
// Google (high-volume sender requirement). Works for self-testing (sending
// to your own Gmail address) without registration.
const buildCalendarMarkup = (event, recipientName) => {
  const startDate = buildIsoStartDate(event)
  if (!startDate) return ''
  const data = {
    '@context': 'http://schema.org',
    '@type': 'EventReservation',
    reservationStatus: 'http://schema.org/Confirmed',
    underName: { '@type': 'Person', name: recipientName },
    reservationFor: {
      '@type': 'Event',
      name: event.name,
      startDate,
      location: {
        '@type': 'Place',
        name: event.stadium,
        address: `${event.city}, ${event.state}`
      }
    }
  }
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

// Step icons. These used to be inline <svg> markup — self-contained, no
// hotlinked CDN icon to 404 — but Gmail strips inline <svg> out of HTML
// emails entirely, so they rendered fine in this app's own preview iframe
// (a real browser) and simply vanished once actually received in Gmail.
// Pre-rasterized to PNG instead (see generate-email-icons.cjs at the repo
// root — keep it in sync with any visual change here) and referenced as
// real <img> tags. This gives the live preview a normal same-origin URL;
// server.js then swaps that URL for a cid: reference and attaches the
// actual PNG bytes at send time — same real-attachment treatment as the
// hero image below and the your-tickets.html attachment, so nothing is
// hotlinked or Gmail-stripped in the delivered email.
// Traced from the reference screenshot at 8x crop zoom: Received = tilted
// phone outline with a download arrow inside it (not a generic
// arrow-into-tray), Accepted = a checkmark that carries its own circle as
// part of the glyph (so it reads as a ring inside the dashed stage-circle),
// Complete = two overlapping torn ticket stubs.
const resolveIconUrl = (iconKey, active) =>
  `${EMAIL_BACKEND_ORIGIN}/api/email-icons/${iconKey}-${active ? 'active' : 'inactive'}.png`

// Matches the reference tracker's exact geometry: 32px dot, dashed slate
// outline on the two steps not yet reached (solid blue fill once active,
// no border), connecting rule between each step, bold label below — no
// underline on any step in the reference, despite how it can look at a
// glance (that's the Accepted glyph's own built-in circle, not a UI accent).
const buildProgressDot = (active, iconKey) => `
                    <td align="center" width="32">
                      <div style="width:32px;height:32px;border-radius:50%;box-sizing:border-box;display:inline-block;line-height:30px;text-align:center;
                        background:${active ? BRAND_BLUE : '#ffffff'};border:${active ? 'none' : '1.5px dashed #5b6670'};"><img src="${resolveIconUrl(iconKey, active)}" width="15" height="15" alt="" style="vertical-align:middle;border:0;"></div>
                    </td>`
// The border sits on a nested div rather than directly on the <td> — a
// border-top on the cell itself sits at the cell's top edge (row top),
// not level with the dot centers. margin-top:15px (half the 32px dot
// height, minus half the 2px line) pushes it down to vertical-center.
const buildProgressLine = () => `
                    <td width="120" valign="middle">
                      <div style="height:0; border-top: 2px solid #d8dde1; margin-top:15px;"></div>
                    </td>`
const buildProgressLabel = (label, active) => `
                    <td align="center" class="tmsans" style="font-family:${FONT_STACK}; color:${active ? BRAND_BLUE : '#7c8b97'}; font-size:11px; line-height: 13px; padding-top: 6px; font-weight:bold;">${label}</td>`

const buildProgressTracker = () => `
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    ${buildProgressDot(true, 'received')}
                    ${buildProgressLine()}
                    ${buildProgressDot(false, 'accepted')}
                    ${buildProgressLine()}
                    ${buildProgressDot(false, 'complete')}
                  </tr>
                  <tr>
                    ${buildProgressLabel('Received', true)}
                    <td></td>
                    ${buildProgressLabel('Accepted', false)}
                    <td></td>
                    ${buildProgressLabel('Complete', false)}
                  </tr>
                </table>`

export const buildTransferEmailHtml = ({
  firstName = '',
  lastName = '',
  senderName = 'A friend',
  event = DEFAULT_EVENT,
  tickets = DEFAULT_TICKETS,
  transferLink = '#',
  calendarMarkup = false
} = {}) => {
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'there'
  const ticketCount = tickets.length || 1
  const heroImg = resolveAbsoluteImageUrl(event.IMG || event.image_url)
  const ticketRows = tickets.map((t) => `
                                                      <tr>
                                                        <td align="left" valign="top" style="font-family:${FONT_STACK}; color:#353c42; font-size:14px; line-height: 18px; font-weight:bold;" class="tmsans">
                                                          Section ${t.section}, Row ${t.row}, Seat ${t.seat}
                                                        </td>
                                                      </tr>`).join('')
  const calendarScript = calendarMarkup ? buildCalendarMarkup(event, name) : ''

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width" />
    <!-- Without these, mobile Gmail/Apple Mail auto-dark-mode can invert or
         swap the brand blue for something else on phones while desktop
         webmail (which doesn't apply the same inversion) renders it fine. -->
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Ticketmaster</title>
    ${calendarScript}
    <style type="text/css">
      .tmsans { font-family: 'Futura', Arial, Helvetica, sans-serif !important; }
      .font-averta { font-family: Arial, Helvetica, sans-serif !important; }
      /* Fix gap on Outlook.com and Outlook 365 */
      [owa] div,button { margin:0 !important; padding:0 !important; display:block !important; }
      /* prevent iOS font upsizing */
      * { -webkit-text-size-adjust: none; }
      /* force Outlook.com to honor line-height */
      .ExternalClass * { line-height: 100%; }
      td { mso-line-height-rule: exactly; }
      /* prevent iOS auto-linking */
      a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
      .blue-text-link a:link { color: #024DDF; }
      /*** Responsive CSS ***/
      @media only screen and (max-width:599px) {
        body { width: 100%; min-width: 100%; margin: 0; padding: 0; }
        .full-width-container { width: 100% !important; min-width: 280px !important; }
        .mobile-padding20 { padding:20px !important; }
        img.fullWidthImg { width: 100% !important; height: auto !important; min-width: 100% !important; }
        .centerText { text-align: center !important; }
      }
    </style>
    <!--OUTLOOK CSS - DO NOT DELETE-->
    <!--[if gt mso 9]> <style type="text/css"> td {font-family: Arial, Helvetica, sans-serif !important;} </style> <![endif]-->
  </head>
  <body style="margin:0px; padding:0px; background-color:#FFFFFF;" bgcolor="#FFFFFF">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" class="font-averta" bgcolor="#FFFFFF" style="background-color:#FFFFFF;">
      <tr>
        <td align="center">

                <!-- Header: intentionally OUTSIDE the 480px boxed container
                     below, so its blue background spans the full reading-pane
                     width edge-to-edge instead of being capped at 480px like
                     everything nested inside that box. -->
                <table border="0" cellpadding="0" cellspacing="0" bgcolor="${BRAND_BLUE}" width="100%">
                  <tr>
                    <!-- hidden preheader -->
                    <td align="left" style="font-family: ${FONT_STACK}; font-size: 0px; line-height: 0px; color: ${BRAND_BLUE}; max-height:0; overflow:hidden;">
                      ${senderName} has sent a Ticket Transfer
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 30px 20px 20px;" valign="top">
                      <span style="color:#ffffff;font-family:${FONT_STACK};font-size:20px;font-weight:bold;font-style:italic;letter-spacing:-0.02em;">ticketmaster<sup style="font-size:10px;">&reg;</sup></span>
                    </td>
                  </tr>
                </table>
                <!-- End Header -->

          <table cellpadding="0" cellspacing="0" border="0" width="480" class="full-width-container">
            <tr>
              <td width="480" align="center" style="min-width:480px;" class="full-width-container">

                <!-- Headline -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" class="tmsans" style="font-family:${FONT_STACK}; color:#475058; font-size:23px; line-height:32.2px; font-weight:bold; padding:25px 20px 25px;" valign="top">
                      Your Ticket Transfer From ${senderName} Is Ready To Be Accepted!
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 0 25px 25px;">
                      ${buildProgressTracker()}
                    </td>
                  </tr>
                </table>

                <!-- Event / ticket card -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" class="center">
                  <tr>
                    <td align="center" style="padding: 0 30px;">
                      <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="left" style="border: 1px solid #dfe4e7;">
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="left" style="border-bottom: 1px solid #dfe4e7;">
                                  <table bgcolor="#f7f8f9" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                      <td align="left" style="font-family:${FONT_STACK}; color: #353c42; font-size:16px; line-height: 18px; font-weight:bold; padding: 20px 0 5px; padding-left:16px;" class="tmsans">
                                        ${event.name}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td align="left" style="font-family:${FONT_STACK}; color: #69747c; font-size:14px; line-height: 18px; padding-top: 10px; padding-left:16px;" class="tmsans">
                                        ${event.day}, ${event.date} @ ${event.time}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td align="left" style="font-family:${FONT_STACK}; color: #69747c; font-size:14px; line-height: 18px; padding: 5px 0px 20px 16px;" class="tmsans">
                                        ${event.stadium}, ${event.city}, ${event.state}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td align="left">
                                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:solid 1px #dfe4e7; padding:15px">
                                          <tr>
                                            <td align="left" valign="top" style="font-family:${FONT_STACK}; color:#353c42; font-size:14px; line-height: 18px; font-weight:bold;" class="tmsans">
                                              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                ${ticketRows}
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              ${heroImg ? `
                              <tr>
                                <td align="center" valign="top">
                                  <img border="0" src="${heroImg}" alt="${event.name}" width="418" style="display:block; width:100%;" class="fullWidthImg">
                                </td>
                              </tr>` : ''}
                              <tr>
                                <td align="center" style="padding: 20px 0 0;">
                                  <table cellspacing="0" width="100%" cellpadding="0" border="0" bgcolor="${BRAND_BLUE}">
                                    <tr>
                                      <td align="center" style="font-family:${FONT_STACK}; font-weight: bold; color:#ffffff; font-size:12px; line-height: 16px; padding: 10px 0;">
                                        <a href="${transferLink}" style="color: #ffffff; text-decoration: none;">ACCEPT TICKETS</a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" valign="top" style="font-family:${FONT_STACK}; color:#69747c; font-size:11px; line-height: 14px; padding: 20px 20px 0;" class="tmsans">
                                  By clicking "ACCEPT TICKETS", you agree to our <a href="${transferLink}" class="blue-text-link" style="color: ${BRAND_BLUE}; text-decoration: none;">Terms of Use</a> and any applicable ticket back terms.
                                </td>
                              </tr>
                              <tr>
                                <td align="left" valign="top" style="font-family:${FONT_STACK}; color:#69747c; font-size:11px; line-height: 14px; padding: 20px 20px 0;" class="tmsans">
                                  If the tickets were obtained fraudulently by the person transferring them, they may be canceled at any time, removed from your account and no longer available for use.
                                </td>
                              </tr>
                              <tr>
                                <td align="left" valign="top" style="font-family:${FONT_STACK}; color:#69747c; font-size:11px; line-height: 14px; padding: 20px 20px;" class="tmsans">
                                  This email is <b>NOT</b> your ticket.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Transfer status / what's next -->
                <table width="100%" align="center" class="noFloat" cellpadding="0" cellspacing="0" border="0" style="padding-top:20px;">
                  <tr>
                    <td align="left">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="left" style="font-family:${FONT_STACK}; color:#353c42; font-size:14px; line-height: 19.6px; font-weight:bold; padding:0px 0px 5px 0px;" class="tmsans">Transfer Status: Received</td>
                        </tr>
                        <tr>
                          <td align="left" style="font-family:${FONT_STACK}; color:#353c42; font-size:14px; line-height: 19.6px; padding:0px 0px 5px 0px;" class="tmsans">You got ${ticketCount} ticket(s)! You're one step closer to seeing ${event.name}.</td>
                        </tr>
                        <tr>
                          <td align="left" style="font-family:${FONT_STACK}; color:#353c42; font-size:14px; line-height: 19.6px; font-weight:bold; padding:15px 0px 5px 0px;" class="tmsans">What&rsquo;s Next?</td>
                        </tr>
                        <tr>
                          <td align="left" style="font-family:${FONT_STACK}; color:#353c42; font-size:14px; line-height: 19.6px; padding:0px 0px 30.2px 0px;" class="tmsans">
                            You'll need to first accept the ticket transfer so the order is moved to your Ticketmaster account. Once the transfer is complete, we'll let ${senderName} know you're all set. To accept the tickets, have your Ticketmaster password handy and login to your Ticketmaster account, or create a <a href="${transferLink}" class="blue-text-link" style="color: ${BRAND_BLUE}; text-decoration: none;">new one</a>. Visit <a href="${transferLink}" class="blue-text-link" style="color: ${BRAND_BLUE}; text-decoration: none;">Event Details</a> to view your ticket(s).
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- We're here to help -->
                <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f7f8f9">
                  <tr>
                    <td align="center" valign="top" style="font-family: ${FONT_STACK}; color: #4b545b; font-weight: normal; font-size: 14px; line-height: 20px; text-align: center; padding: 35px 20px;" class="tmsans">
                      We're here to help. <br> If you have any questions, please <a href="${transferLink}" style="color: ${BRAND_BLUE}; text-decoration: none;">contact</a> <br> Ticketmaster Fan Support.
                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <table border="0" cellpadding="0" cellspacing="0" bgcolor="${BRAND_BLUE}" width="100%">
                  <tr>
                    <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                        <tr>
                          <td align="center" style="padding: 30px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td align="center" class="tmsans" style="font-family: ${FONT_STACK}; color: #ffffff; font-size: 12px; line-height: 20px; font-weight: normal;" valign="top">
                                  Ticketmaster, Attn: Fan Support, <br /> 707 Virginia Street East, Suite 170, Charleston, WV 25301<br><br>
                                  &copy; ${new Date().getFullYear()} Ticketmaster. All rights reserved.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
