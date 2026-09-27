// ── Wallet card page ─────────────────────────────────────────────────────
// Standalone HTML page that's byte-for-byte the same design as
// TicketBarcode.css's .bct-aw markup (verified against the actual
// component's CSS, not re-guessed) — same capability-token pattern as
// ticketsPage.js. This exists so the real Apple Wallet pass (which can't
// render this design itself — no HTML engine in PassKit) can link to it:
// tapping "View Full Ticket" on the back of the pass opens this page,
// showing the exact design with nothing added or removed.

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

const buildWalletCardPageHtml = ({ event, ticket }) => {
  const entryInfoBlock = ticket.label
    ? `<div class="bct-aw-field bct-aw-field--entry">
        <span class="bct-aw-label">Entry Info</span>
        <span class="bct-aw-value">${esc(ticket.label)}</span>
      </div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(event?.name || 'Your Ticket')} — Ticketmaster</title>
<style>
  body { margin: 0; background: #131313; padding: 40px 20px; font-family: -apple-system, sans-serif; }
  .wrap { max-width: 380px; margin: 0 auto; }

.bct-stub {
  position: relative;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
}
.bct-aw-top-notch {
  position: absolute;
  top: -49px;
  left: calc(50% - 32px);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #131313;
  z-index: 3;
}
.bct-aw {
  position: relative;
  background: #1c1e22;
}
.bct-aw-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 14px 10px;
}
.bct-aw-wordmark {
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-style: italic;
  letter-spacing: -0.01em;
  text-transform: lowercase;
}
.bct-aw-datetime { text-align: right; }
.bct-aw-time { font-size: 9px; font-weight: 600; color: #4d9fff; letter-spacing: 0.02em; line-height: 1; }
.bct-aw-date { font-size: 18px; font-weight: 500; color: #fff; line-height: 1; margin-top: 5px; }
.bct-aw-banner {
  display: flex; align-items: center; justify-content: center; height: 88px;
  background: #0a66ea;
}
.bct-aw-banner-mark {
  font-style: italic; font-weight: 800;
  font-size: 90px; color: #fff; line-height: 1;
}
.bct-aw-content { position: relative; padding: 14px 16px 126px; }
.bct-aw-label { font-size: 10px; font-weight: 700; letter-spacing: 0.05em; color: #4d9fff; text-transform: uppercase; margin-bottom: 3px; }
.bct-aw-event-name { font-size: 15.5px; font-weight: 500; color: #fff; line-height: 1.25; margin-bottom: 12px; }
.bct-aw-fields { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.bct-aw-field { display: flex; flex-direction: column; gap: 4px; }
.bct-aw-fields .bct-aw-field:nth-child(2) { align-items: center; }
.bct-aw-fields .bct-aw-field:nth-child(3) { align-items: flex-end; }
.bct-aw-field--entry { margin-bottom: 4px; }
.bct-aw-value { font-size: 15px; font-weight: 500; color: #fff; line-height: 1.1; }
.bct-aw-nfc { position: absolute; right: 8px; bottom: 7px; color: rgba(255,255,255,0.5); }
.bct-refresh-btn {
  position: absolute; top: 16px; right: 18px; width: 30px; height: 30px; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 15px;
}
.bct-tear { position: relative; display: flex; align-items: center; }
.bct-tear-line { flex: 1; border-top: 2px dashed #d5d5d5; }
.bct-notch { width: 22px; height: 22px; border-radius: 50%; background: #131313; flex-shrink: 0; }
.bct-notch--left { margin-left: -11px; }
.bct-notch--right { margin-right: -11px; }
.bct-barcode-frame { position: relative; background: #fff; }
.bct-barcode-visual { padding: 20px 20px 18px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.bct-code { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 13px; font-weight: 600; letter-spacing: 0.16em; color: #555; }
.bct-safetix { display: flex; align-items: center; gap: 6px; padding: 12px 16px 0; }
.bct-safetix-label { font-size: 11px; font-weight: 700; letter-spacing: 0.02em; color: #026CDF; }
.bct-safety-text { font-size: 11px; color: #999; line-height: 1.5; padding: 4px 16px 16px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="bct-stub">
    <span class="bct-aw-top-notch"></span>
    <div class="bct-aw">
      <div class="bct-aw-topbar">
        <p class="bct-aw-wordmark">ticketmaster</p>
        <div class="bct-aw-datetime">
          <p class="bct-aw-time">${esc(event?.time)}</p>
          <p class="bct-aw-date">${esc(event?.date)}</p>
        </div>
      </div>
      <div class="bct-aw-banner"><span class="bct-aw-banner-mark">t</span></div>
      <div class="bct-aw-content">
        <p class="bct-aw-label">${esc(event?.stadium)}</p>
        <p class="bct-aw-event-name">${esc(event?.name)}</p>
        <div class="bct-aw-fields">
          <div class="bct-aw-field"><span class="bct-aw-label">Section</span><span class="bct-aw-value">${esc(ticket.section)}</span></div>
          <div class="bct-aw-field"><span class="bct-aw-label">Row</span><span class="bct-aw-value">${esc(ticket.row)}</span></div>
          <div class="bct-aw-field"><span class="bct-aw-label">Seat</span><span class="bct-aw-value">${esc(ticket.seat)}</span></div>
        </div>
        ${entryInfoBlock}
        <svg class="bct-aw-nfc" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M7.28 14.30 A4 4 0 0 0 7.28 9.70" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M10.55 16.59 A8 8 0 0 0 10.55 7.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M13.83 18.88 A12 12 0 0 0 13.83 5.12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M17.10 21.18 A16 16 0 0 0 17.10 2.82" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <div class="bct-tear">
      <span class="bct-notch bct-notch--left"></span>
      <span class="bct-tear-line"></span>
      <span class="bct-notch bct-notch--right"></span>
    </div>

    <div class="bct-barcode-frame">
      <div class="bct-barcode-visual">
        <div class="bct-bars" style="display:flex;height:72px;width:100%;">
          <span class="bct-bar" style="flex-grow:2"></span><span class="bct-gap" style="flex-grow:1"></span>
          <span class="bct-bar" style="flex-grow:1"></span><span class="bct-gap" style="flex-grow:3"></span>
          <span class="bct-bar" style="flex-grow:2"></span><span class="bct-gap" style="flex-grow:1"></span>
          <span class="bct-bar" style="flex-grow:3"></span><span class="bct-gap" style="flex-grow:2"></span>
          <span class="bct-bar" style="flex-grow:1"></span><span class="bct-gap" style="flex-grow:1"></span>
        </div>
        <p class="bct-code">${esc(ticket.section)}-${esc(ticket.row)}-${esc(ticket.seat)}</p>
      </div>
    </div>

    <div class="bct-safetix">
      <span class="bct-safetix-label">Protected by SafeTix&reg;</span>
    </div>
    <p class="bct-safety-text">
      Protect your barcode — scan only at the event gate or official ticket-scanning point.
    </p>
  </div>
</div>
</body>
</html>
`;
};

module.exports = { buildWalletCardPageHtml };
