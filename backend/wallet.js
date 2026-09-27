// ── Add to Wallet (Apple Wallet / Google Wallet) ────────────────────────────
// Generates a real, scannable wallet pass for a single ticket via
// WalletWallet.dev — a pass-signing API that holds its own Apple + Google
// credentials and signs on your behalf, free for the first 1,000
// passes/month. No Apple Developer Program membership, no Google Cloud
// project, no certs to manage in this repo at all. See WALLET_SETUP.md at
// the repo root for how to get a free API key.
const fs = require('fs');
const path = require('path');

const WALLETWALLET_API_BASE = 'https://api.walletwallet.dev';

// Same reasoning as server.js's PUBLIC_ORIGIN: this link goes out inside a
// Wallet pass on someone else's device, so it needs a real absolute URL,
// not a dev/LAN-relative one.
const PUBLIC_ORIGIN = 'https://verifiedfanpresale.com';

// The "t" mark — used as logoURL (top-left, next to logoText) and reused
// as the lock-screen notification icon.
//
// NOT stripURL: tested live and confirmed broken. Apple's storeCard draws
// primaryFields' text (the event name) DIRECTLY ON TOP of the strip image
// — the strip is a *background for the primary field*, not an independent
// banner above unrelated content. Our design has the event name in a
// separate section below a plain banner, so that overlay produced garbled
// double-exposed text (event name smeared across the wordmark/date row)
// plus a huge dead gap (Apple stretched the primary-field zone to fit an
// image sized for our full card, not a short banner). This is an Apple/
// PassKit behavior, not fixable by resizing the image — the two layouts
// are structurally incompatible. See walletCardPage.js for how the exact
// design actually gets shown (a linked page, not the pass face itself).
let walletLogoDataUri = null;
try {
  const logoPng = fs.readFileSync(path.join(__dirname, 'assets', 'wallet-logo.png'));
  walletLogoDataUri = `data:image/png;base64,${logoPng.toString('base64')}`;
} catch {
  // Falls back to text-only logoText if the asset is missing.
}

// A ticket has no real barcode of its own (see TicketBarcode.jsx — it's a
// seeded, reproducible fake for this prototype's UI). Reuse the exact same
// seed formula here so the code shown in the wallet pass matches the code
// shown on the in-app barcode for the same ticket.
const buildBarcodeValue = (event, ticket, index) =>
  `${event?.orderNum || event?.id || 'TM'}-${ticket.section}-${ticket.row}-${ticket.seat}-${index}-0`;

const isWalletConfigured = () => !!process.env.WALLETWALLET_API_KEY;

// One call returns everything for both wallets at once (applePass +
// googleSaveUrl), so both routes share this instead of hitting the API
// twice for the same ticket.
const callWalletWalletApi = async (event, ticket, ticketIndex, token) => {
  const barcodeValue = buildBarcodeValue(event, ticket, ticketIndex);
  // PassKit has no HTML engine, so the pass itself can never look exactly
  // like the in-app card (see the strip-image comment above) — this link
  // is the bridge. Wallet auto-detects URL-shaped backField values and
  // makes them tappable, so this opens the *exact* TicketBarcode.css
  // design (via walletCardPage.js) in the browser, one tap from the pass.
  const cardPageUrl = token
    ? `${PUBLIC_ORIGIN}/api/wallet-card/${token}/${ticketIndex}`
    : null;
  const res = await fetch(`${WALLETWALLET_API_BASE}/api/passes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WALLETWALLET_API_KEY}`
    },
    body: JSON.stringify({
      organizationName: 'Ticketmaster',
      logoText: 'ticketmaster',
      title: event?.name || 'Event',
      colorPreset: 'blue',
      ...(walletLogoDataUri ? { logoURL: walletLogoDataUri, iconURL: walletLogoDataUri } : {}),
      barcodeValue,
      barcodeFormat: 'PDF417',
      primaryFields: [{ label: 'EVENT', value: event?.name || 'Event' }],
      // Section/Row/Seat (and Entry Info, when set) on the front — mirrors
      // the in-app ticket card's layout instead of burying seat location
      // on the back of the pass.
      secondaryFields: [
        { label: 'SECTION', value: ticket.section },
        { label: 'ROW', value: ticket.row },
        { label: 'SEAT', value: ticket.seat },
        ...(ticket.label ? [{ label: 'ENTRY INFO', value: ticket.label }] : [])
      ],
      // WalletWallet rejects any field with an empty-string value, so this
      // is filtered rather than defaulting to ''.
      headerFields: [
        { label: 'TIME', value: event?.time },
        { label: 'DATE', value: event?.date }
      ].filter((f) => f.value),
      backFields: [
        cardPageUrl && { label: 'View Full Ticket Design', value: cardPageUrl },
        event?.stadium && { label: 'Venue', value: event.stadium },
        (event?.city || event?.state) && {
          label: 'Location',
          value: [event?.city, event?.state].filter(Boolean).join(', ')
        },
        event?.orderNum && { label: 'Order Number', value: event.orderNum }
      ].filter(Boolean)
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`WalletWallet API error (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json(); // { serialNumber, googleSaveUrl, applePass (base64), shareUrl }
};

const buildApplePass = async (event, ticket, token, ticketIndex) => {
  const result = await callWalletWalletApi(event, ticket, ticketIndex, token);
  return Buffer.from(result.applePass, 'base64');
};

const buildGoogleWalletSaveUrl = async (event, ticket, token, ticketIndex) => {
  const result = await callWalletWalletApi(event, ticket, ticketIndex, token);
  return result.googleSaveUrl;
};

module.exports = {
  isAppleWalletConfigured: isWalletConfigured,
  isGoogleWalletConfigured: isWalletConfigured,
  buildApplePass,
  buildGoogleWalletSaveUrl
};
