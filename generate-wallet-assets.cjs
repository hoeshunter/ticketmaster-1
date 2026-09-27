#!/usr/bin/env node

/**
 * Generate the branded strip/logo images for the real Apple/Google Wallet
 * pass (backend/wallet.js) — the same solid-blue, white-"t"-mark banner
 * used on the in-app ticket card (TicketBarcode.css .bct-aw-banner), since
 * PassKit renders passes from its own fixed chrome + these image assets,
 * not from any of the app's CSS.
 *
 * Run manually with `node generate-wallet-assets.cjs` whenever the mark
 * changes — this isn't part of the normal build, the output PNGs are
 * committed static assets read by backend/wallet.js at request time.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BLUE = '#0a66ea';
const outDir = path.join(__dirname, 'backend', 'assets');

const markSvg = (width, height, fontSize) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${BLUE}"/>
  <text x="${width / 2}" y="${height / 2}" font-family="Arial, Helvetica, sans-serif"
        font-weight="bold" font-style="italic" font-size="${fontSize}"
        fill="#ffffff" text-anchor="middle" dominant-baseline="central">t</text>
</svg>`;

const targets = [
  // Wide banner behind the primary field (Apple: 1080x360 @3x).
  { name: 'wallet-strip.png', width: 1080, height: 360, fontSize: 370 },
  // Square logo next to logoText, top-left of the pass (Apple: 160x160 @3x... actually 480x480 for @3x, using base 160 here).
  { name: 'wallet-logo.png', width: 160, height: 160, fontSize: 110 }
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const t of targets) {
    const svg = markSvg(t.width, t.height, t.fontSize);
    const outPath = path.join(outDir, t.name);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
