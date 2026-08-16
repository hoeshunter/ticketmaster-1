#!/usr/bin/env node
// Rasterizes the transfer-tracker step icons (src/emails/emailTemplate.js)
// to PNG. Gmail strips inline <svg> markup out of HTML emails entirely, so
// the icons rendered fine in the in-app preview (a real browser) but never
// showed up once actually received in Gmail. Real raster images sent as
// cid attachments (see backend/server.js) render everywhere.
// One active (white, sits on the blue filled dot) and one inactive (slate
// grey, sits on the white/dashed dot) variant per icon — must stay in sync
// with the ICONS object in src/emails/emailTemplate.js if that ever changes.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RENDER_SIZE = 60; // 4x the 15px display size, for retina crispness

const ICONS = {
  received: (color) => `<svg width="${RENDER_SIZE}" height="${RENDER_SIZE}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(25 12 12)"><rect x="7.5" y="2.5" width="9" height="19" rx="2.2"/><path d="M12 9v7"/><path d="M9 13.5 12 16.5 15 13.5"/></g></svg>`,
  accepted: (color) => `<svg width="${RENDER_SIZE}" height="${RENDER_SIZE}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M7.7 12.3 10.5 15 16.3 9" stroke-width="1.9"/></svg>`,
  complete: (color) => `<svg width="${RENDER_SIZE}" height="${RENDER_SIZE}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(-18 9 15)"><path d="M4.5 9 6 20l5-1.3L9.5 7.7Z"/><line x1="6" y1="12" x2="7.6" y2="11.7"/><line x1="6.6" y1="15.5" x2="8.2" y2="15.2"/></g><g transform="rotate(14 15 15)"><path d="M11 8h7.5a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H11Z"/><line x1="16" y1="10.5" x2="16" y2="18.5" stroke-dasharray="1.6 1.6"/></g></svg>`
};

const VARIANTS = [
  { key: 'received', state: 'active',   color: '#ffffff' },
  { key: 'received', state: 'inactive', color: '#5b6670' },
  { key: 'accepted', state: 'active',   color: '#ffffff' },
  { key: 'accepted', state: 'inactive', color: '#5b6670' },
  { key: 'complete', state: 'active',   color: '#ffffff' },
  { key: 'complete', state: 'inactive', color: '#5b6670' }
];

const outDir = path.join(__dirname, 'backend', 'assets', 'email-icons');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const v of VARIANTS) {
    const svg = ICONS[v.key](v.color);
    const outPath = path.join(outDir, `${v.key}-${v.state}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Wrote ${outPath}`);
  }
  console.log('Done.');
})();
