// override: true so backend/.env always wins over a stray shell-level env
// var left behind from earlier manual testing in the same terminal session
// (this is what caused SMTP_USER to keep resolving to an old value even
// after being cleared in .env). Safe in production too: Railway sets env
// vars via its own dashboard, and there's no .env file there to load at all.
require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const transporter = require('./mailer');
const { buildTicketsPageHtml } = require('./ticketsPage');
const { buildWalletCardPageHtml } = require('./walletCardPage');
const { isAppleWalletConfigured, isGoogleWalletConfigured, buildApplePass, buildGoogleWalletSaveUrl } = require('./wallet');

// The tickets.html attachment is opened outside this app entirely (often
// from a file:// context), so it needs a real absolute API URL to verify
// against — same reasoning as EMAIL_BACKEND_ORIGIN in the frontend's
// emailTemplate.js for hero images. Hardcoded to the real production
// domain (no localhost/LAN-IP dev fallback) so every email — Add to
// Wallet buttons included — always points somewhere reachable from any
// device on any network, not just whoever happens to be running the
// backend locally at send time.
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN;
const PUBLIC_API_BASE = `${PUBLIC_ORIGIN}/api`;

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const IS_DEV = process.env.NODE_ENV !== 'production';

console.log('=== STARTUP DEBUG ===');
console.log(`Using PORT = ${PORT}`);
console.log(`Mode = ${IS_DEV ? 'development' : 'production'}`);
console.log(`JWT_SECRET set: ${!!JWT_SECRET}`);
console.log(`MYSQL_HOST = ${process.env.MYSQL_HOST || '(not set)'}`);
console.log(`MYSQL_PORT = ${process.env.MYSQL_PORT || '3306 (default)'}`);
console.log(`MYSQL_USER = ${process.env.MYSQL_USER || '(not set)'}`);
console.log(`MYSQL_DATABASE = ${process.env.MYSQL_DATABASE || '(not set)'}`);
console.log(`MYSQL_PASSWORD set: ${!!process.env.MYSQL_PASSWORD}`);
console.log('=====================');

if (!JWT_SECRET) { console.error('FATAL: JWT_SECRET not set.'); process.exit(1); }
if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE) {
  console.error('FATAL: MySQL env vars not set (MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE).');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verify DB connectivity at startup with retry logic (Railway MySQL can take
// a moment to become available after a restart/migration). Retries up to
// MAX_RETRIES times with exponential backoff before giving up and exiting.
// app.listen() below is gated on this promise resolving — previously it
// ran independently, so a request could reach a route (e.g. /api/send-email
// inserting sender_name) before the ALTER TABLE statements here finished,
// intermittently failing with "Unknown column" right after every restart.
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

async function getConnectionWithRetry(attempt = 1) {
  try {
    const conn = await pool.getConnection();
    return conn;
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    console.warn(`MySQL connection attempt ${attempt}/${MAX_RETRIES} failed (${err.code || err.message}). Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    return getConnectionWithRetry(attempt + 1);
  }
}

const dbReady = getConnectionWithRetry()
  .then(async (conn) => {
    console.log('MySQL connected');
    conn.release();
    // admins/events previously had to exist already (created by hand once,
    // undocumented in code) — creating them defensively here too means a
    // brand-new database (e.g. after moving Railway accounts) self-
    // provisions on first boot, same as ticket_access already did below.
    // See backend/migrations/001_initial_schema.sql for the same schema
    // as a standalone reference/fast-path.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id         CHAR(36)     NOT NULL PRIMARY KEY,
        username   VARCHAR(255) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id         CHAR(36)     NOT NULL PRIMARY KEY,
        admin_id   CHAR(36)     NOT NULL,
        name       VARCHAR(255) NOT NULL,
        state      VARCHAR(255) NULL,
        city       VARCHAR(255) NULL,
        stadium    VARCHAR(255) NULL,
        \`time\`     VARCHAR(64)  NULL,
        \`date\`     VARCHAR(64)  NULL,
        \`day\`      VARCHAR(64)  NULL,
        order_num  VARCHAR(255) NULL,
        tickets    JSON         NOT NULL,
        image_url  VARCHAR(1024) NULL,
        held       TINYINT(1)   NOT NULL DEFAULT 0,
        held_at    TIMESTAMP    NULL,
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_events_admin_id (admin_id),
        CONSTRAINT fk_events_admin
          FOREIGN KEY (admin_id) REFERENCES admins(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_access (
        token             CHAR(48)     NOT NULL PRIMARY KEY,
        event_data        JSON         NOT NULL,
        tickets           JSON         NOT NULL,
        sender_name       VARCHAR(255) NULL,
        recipient_first_name VARCHAR(255) NULL,
        accepted          TINYINT(1)   NOT NULL DEFAULT 0,
        accepted_at       TIMESTAMP    NULL,
        created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    // Older DBs created before the event-hold feature don't have these
    // columns yet — add them defensively so existing databases don't need a
    // manual migration step (see backend/migrations/002_add_event_hold.sql
    // for the same change as a standalone reference/fast-path).
    const [eventCols] = await pool.query(`SHOW COLUMNS FROM events`);
    const eventColNames = eventCols.map(c => c.Field);
    if (!eventColNames.includes('held')) {
      await pool.query(`ALTER TABLE events ADD COLUMN held TINYINT(1) NOT NULL DEFAULT 0`);
    }
    if (!eventColNames.includes('held_at')) {
      await pool.query(`ALTER TABLE events ADD COLUMN held_at TIMESTAMP NULL`);
    }

    // Older DBs created before the direct-view redesign still have the
    // email+access-code gate columns (NOT NULL) and are missing the
    // acceptance columns — bring them in line so both old and fresh
    // databases work without a manual migration step.
    const [cols] = await pool.query(`SHOW COLUMNS FROM ticket_access`);
    const colNames = cols.map(c => c.Field);
    if (colNames.includes('verify_email')) {
      await pool.query(`ALTER TABLE ticket_access MODIFY verify_email VARCHAR(255) NULL`);
    }
    if (colNames.includes('access_code_hash')) {
      await pool.query(`ALTER TABLE ticket_access MODIFY access_code_hash VARCHAR(255) NULL`);
    }
    if (!colNames.includes('accepted')) {
      await pool.query(`ALTER TABLE ticket_access ADD COLUMN accepted TINYINT(1) NOT NULL DEFAULT 0`);
    }
    if (!colNames.includes('accepted_at')) {
      await pool.query(`ALTER TABLE ticket_access ADD COLUMN accepted_at TIMESTAMP NULL`);
    }
    if (!colNames.includes('sender_name')) {
      await pool.query(`ALTER TABLE ticket_access ADD COLUMN sender_name VARCHAR(255) NULL`);
    }
  })
  .catch(err => {
    console.error('FATAL: cannot connect to MySQL');
    console.error('  code:', err.code);
    console.error('  errno:', err.errno);
    console.error('  sqlMessage:', err.sqlMessage);
    console.error('  message:', err.message);
    console.error('  address:', err.address, 'port:', err.port);
    process.exit(1);
  });

// Local image storage (replaces Supabase Storage)
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Pre-rasterized transfer-tracker step icons (see generate-email-icons.cjs
// at the repo root). Served here so the frontend's live email preview can
// load them as a normal same-origin <img>; /api/send-email below then
// swaps that same URL for a cid: reference and attaches the PNG bytes
// directly, since Gmail strips inline <svg> and won't reliably re-fetch a
// remote icon URL either.
const EMAIL_ICONS_DIR = path.join(__dirname, 'assets', 'email-icons');

// CORS: allow production domains + any local network origin in dev.
// PUBLIC_ORIGIN (this service's own Railway domain) is included since the
// frontend is now served same-origin from this same backend — browsers still
// send an Origin header on same-origin fetches, so it has to be allow-listed
// too, not just genuinely cross-origin callers.
const ALLOWED_ORIGINS = [
  'https://ticketmaster-twlj.vercel.app',
  'https://ticketmaster-tau-tawny.vercel.app',
  'https://jimcooks211.github.io',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  PUBLIC_ORIGIN,
  `https://www.${new URL(PUBLIC_ORIGIN).hostname}`,
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, curl), and the
    // literal string "null" — what browsers send as Origin when a fetch
    // comes from a file:// page, which is exactly how tickets.html is opened.
    if (!origin || origin === 'null') return cb(null, true);
    // Always allow production domains
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // In dev: allow any device on a local network (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (IS_DEV && /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());

// ── Resell proxy ──────────────────────────────────────────────────────────────
// In production (single Railway service) there is no Vite proxy, so the main
// server must forward /api/admin/resell* and /api/resell* to the resell server
// which runs internally on port 3002 (started by server.cjs alongside this
// process). Uses Node's built-in http — no extra dependency needed.
// The body has already been parsed by express.json() above, so we re-serialize
// it rather than piping the raw request stream.
{
  const http = require('http');
  const resellProxy = (req, res) => {
    const body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : '';
    const headers = { ...req.headers, host: 'localhost:3002' };
    if (body) {
      headers['content-length'] = Buffer.byteLength(body).toString();
      headers['content-type'] = 'application/json';
    } else {
      delete headers['content-length'];
    }
    const proxy = http.request(
      { hostname: 'localhost', port: 3002, path: req.originalUrl, method: req.method, headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxy.on('error', (err) => {
      console.error('Resell proxy error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'Resell service unavailable' });
    });
    if (body) proxy.write(body);
    proxy.end();
  };
  app.all('/api/admin/resell*', resellProxy);
  app.all('/api/resell*', resellProxy);
}

// Serve uploaded images at /uploads/<file>
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api/email-icons', express.static(EMAIL_ICONS_DIR));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try { req.admin = jwt.verify(header.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
};

const formatEvent = (ev) => ({
  id: ev.id,
  name: ev.name,
  state: ev.state,
  city: ev.city,
  stadium: ev.stadium,
  time: ev.time,
  date: ev.date,
  day: ev.day,
  orderNum: ev.order_num,
  tickets: typeof ev.tickets === 'string' ? JSON.parse(ev.tickets || '[]') : (ev.tickets || []),
  image_url: ev.image_url || null,
  held: !!ev.held,
  heldAt: ev.held_at || null,
  createdAt: ev.created_at,
  admin_id: ev.admin_id,
  createdBy: ev.createdBy || null
});

// ── Image upload ──────────────────────────────────────────────────────────────
app.post('/api/admin/upload-image', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic' };
  const ext = mimeToExt[req.file.mimetype] || 'jpg';
  const adminId = String(req.admin.id).replace(/-/g, '');
  const fileName = `${adminId}_${Date.now()}.${ext}`;
  try {
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), req.file.buffer);
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: 'Image upload failed: ' + e.message });
  }
  res.json({ url: `/uploads/${fileName}` });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/admin/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const [existing] = await pool.query('SELECT id FROM admins WHERE username = ? LIMIT 1', [username]);
    if (existing.length) return res.status(409).json({ error: 'Username already exists' });
    const id = crypto.randomUUID();
    const hash = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO admins (id, username, password) VALUES (?, ?, ?)', [id, username, hash]);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);
    const admin = rows[0];
    if (!admin || !bcrypt.compareSync(password, admin.password))
      return res.status(401).json({ error: 'Invalid username or password' });
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, id: admin.id, username: admin.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/admin/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE id = ? LIMIT 1', [req.admin.id]);
    const admin = rows[0];
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password))
      return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hash, req.admin.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.delete('/api/admin/account', auth, async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password required to delete account' });
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE id = ? LIMIT 1', [req.admin.id]);
    const admin = rows[0];
    if (!admin || !bcrypt.compareSync(password, admin.password))
      return res.status(401).json({ error: 'Incorrect password' });
    await pool.query('DELETE FROM events WHERE admin_id = ?', [req.admin.id]);
    await pool.query('DELETE FROM admins WHERE id = ?', [req.admin.id]);
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ── Events (admin) ────────────────────────────────────────────────────────────
app.get('/api/admin/events', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events WHERE admin_id = ? ORDER BY created_at DESC', [req.admin.id]);
    res.json(rows.map(formatEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/events', auth, async (req, res) => {
  const { name, state, city, stadium, time, date, day, orderNum, tickets = [], image_url } = req.body || {};
  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO events (id, admin_id, name, state, city, stadium, `time`, `date`, `day`, order_num, tickets, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.admin.id, name, state, city, stadium, time, date, day, orderNum, JSON.stringify(tickets), image_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [id]);
    res.status(201).json(formatEvent(rows[0]));
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.put('/api/admin/events/:id', auth, async (req, res) => {
  const { name, state, city, stadium, time, date, day, orderNum, tickets = [], image_url, held } = req.body || {};
  try {
    const [existing] = await pool.query('SELECT id FROM events WHERE id = ? AND admin_id = ? LIMIT 1', [req.params.id, req.admin.id]);
    if (!existing.length) return res.status(404).json({ error: 'Event not found' });
    const fields = ['name = ?', 'state = ?', 'city = ?', 'stadium = ?', '`time` = ?', '`date` = ?', '`day` = ?', 'order_num = ?', 'tickets = ?'];
    const values = [name, state, city, stadium, time, date, day, orderNum, JSON.stringify(tickets)];
    if (image_url !== undefined) { fields.push('image_url = ?'); values.push(image_url); }
    if (held !== undefined) {
      // held_at uses the DB's own clock (NOW()/NULL as literal SQL, not a
      // bound param) rather than the client-sent ISO string — MySQL's
      // TIMESTAMP column rejects "2026-08-18T14:52:18.954Z" (needs
      // "YYYY-MM-DD HH:MM:SS"), and the server clock is authoritative anyway.
      fields.push('held = ?'); values.push(held ? 1 : 0);
      fields.push(held ? 'held_at = NOW()' : 'held_at = NULL');
    }
    values.push(req.params.id);
    await pool.query(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [req.params.id]);
    res.json(formatEvent(rows[0]));
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/events/:id', auth, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM events WHERE id = ? AND admin_id = ? LIMIT 1', [req.params.id, req.admin.id]);
    if (!existing.length) return res.status(404).json({ error: 'Event not found' });
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Public events ─────────────────────────────────────────────────────────────
// Held events are excluded here (not just filtered client-side) so a held
// event never appears in the public events list, regardless of caller.
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, a.username AS createdBy FROM events e LEFT JOIN admins a ON a.id = e.admin_id
       WHERE e.held = 0 ORDER BY e.created_at DESC`
    );
    res.json(rows.map(formatEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Email ─────────────────────────────────────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
  const { to, firstName, lastName, subject, html, ics, event, tickets, senderName } = req.body || {};
  if (!to || !html) return res.status(400).json({ error: 'to and html are required' });
  try {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    const from = process.env.SMTP_FROM_NAME ? `"${process.env.SMTP_FROM_NAME}" <${fromAddress}>` : fromAddress;
    const attachments = [];
    if (ics) attachments.push({
      filename: 'invite.ics',
      content: ics,
      contentType: 'text/calendar; charset=utf-8; method=PUBLISH'
    });
    // Ticket attachment: opens straight into the ticket view, no separate
    // email+access-code gate. The file itself carries no ticket data, only
    // an unguessable random token (capability-URL pattern, same trust model
    // as the real ACCEPT TICKETS link) — /api/ticket-access/:token resolves
    // it to the actual event/seat details. The same token also backs the
    // per-ticket "Add to Apple/Google Wallet" links below, since it's
    // already the exact capability-URL this app uses to hand a stranger
    // read access to one order's tickets without a login.
    let walletToken = null;
    if (event && tickets?.length) {
      const token = crypto.randomBytes(24).toString('hex');
      walletToken = token;
      await pool.query(
        'INSERT INTO ticket_access (token, event_data, tickets, sender_name, recipient_first_name) VALUES (?, ?, ?, ?, ?)',
        [token, JSON.stringify(event), JSON.stringify(tickets), senderName || null, firstName || null]
      );
      // TEMP: your-tickets.html attachment disabled while the "stuck on
      // Loading your tickets…" bug is being tracked down. Token/DB insert
      // above is left in place (harmless, just an unused row) so this is a
      // one-line flip to restore once fixed.
      // attachments.push({
      //   filename: 'your-tickets.html',
      //   content: buildTicketsPageHtml({ token, apiBase: PUBLIC_API_BASE }),
      //   contentType: 'text/html; charset=utf-8'
      // });
    }
    // The incoming `html` still has the tracker icons and hero image as
    // plain <img src="https://...same-origin.../..."> — fine for the
    // frontend's own preview iframe, but in a delivered Gmail message that
    // means either a stripped inline <svg> (icons, previously) or an image
    // Gmail's proxy has to fetch itself and can fail/serve stale (hero).
    // Rewrite both to cid: references and attach the real bytes below —
    // the same "it's actually in the email" treatment as invite.ics and
    // your-tickets.html above, not just a link out to this server.
    let finalHtml = html;

    // "Add to Apple/Google Wallet" links: emailTemplate.js has no way to
    // know the capability token yet (it's only generated above, after the
    // html is built), so it emits __WALLET_APPLE_<ticketIndex>__ /
    // __WALLET_GOOGLE_<ticketIndex>__ placeholders instead — swap them for
    // the real URLs now. Falls back to "#" if there's no walletToken (e.g.
    // this send had no event/tickets attached) so a stray placeholder never
    // leaks into a delivered email.
    finalHtml = finalHtml
      .replace(/__WALLET_APPLE_(\d+)__/g, (_, i) => walletToken ? `${PUBLIC_API_BASE}/wallet/apple/${walletToken}/${i}` : '#')
      .replace(/__WALLET_GOOGLE_(\d+)__/g, (_, i) => walletToken ? `${PUBLIC_API_BASE}/wallet/google/${walletToken}/${i}` : '#');

    // Step-tracker icons: swap every /api/email-icons/<name>.png reference
    // for a cid'd PNG read straight off disk (same host as this server).
    // Matched on path only (not a literal PUBLIC_ORIGIN prefix) since the
    // frontend resolves these via window.location.origin, which in local
    // dev is the Vite dev server's own origin, not this backend's.
    const iconNames = new Set(
      [...html.matchAll(/\/api\/email-icons\/([\w-]+)\.png/g)].map((m) => m[1])
    );
    for (const name of iconNames) {
      const filePath = path.join(EMAIL_ICONS_DIR, `${name}.png`);
      if (!fs.existsSync(filePath)) continue;
      attachments.push({ filename: `${name}.png`, path: filePath, cid: name });
      finalHtml = finalHtml.replace(
        new RegExp(`https?://[^"']+/api/email-icons/${name}\\.png`, 'g'),
        `cid:${name}`
      );
    }

    // Hero image: same treatment. Local /uploads files are read straight
    // off disk (again matched on path only, same reasoning as above);
    // anything else (an external image_url) is fetched once here so it
    // still ends up as a real attachment rather than a hotlink.
    const heroTagMatch = finalHtml.match(/<img\b[^>]*\bclass="fullWidthImg"[^>]*>/);
    const heroSrcMatch = heroTagMatch && heroTagMatch[0].match(/\ssrc="([^"]+)"/);
    if (heroSrcMatch) {
      const heroUrl = heroSrcMatch[1];
      try {
        let heroBuffer, heroFilename;
        const uploadsPathMatch = heroUrl.match(/^https?:\/\/[^/]+\/uploads\/(.+)$/);
        if (uploadsPathMatch) {
          heroFilename = decodeURIComponent(uploadsPathMatch[1]);
          heroBuffer = fs.readFileSync(path.join(UPLOAD_DIR, heroFilename));
        } else if (/^https?:\/\//i.test(heroUrl)) {
          // No timeout here previously — an unresponsive external image
          // host would hang this fetch (and the whole /api/send-email
          // request) indefinitely, same failure mode as the SMTP
          // handshake fixed in mailer.js. Bail out after 8s and fall
          // through to the existing catch, which leaves the hero image
          // hotlinked instead of blocking the send.
          const resp = await fetch(heroUrl, { signal: AbortSignal.timeout(8000) });
          if (resp.ok) {
            heroBuffer = Buffer.from(await resp.arrayBuffer());
            heroFilename = `event-image${path.extname(new URL(heroUrl).pathname) || '.jpg'}`;
          }
        }
        if (heroBuffer) {
          attachments.push({ filename: heroFilename, content: heroBuffer, cid: 'heroImage' });
          finalHtml = finalHtml.split(heroUrl).join('cid:heroImage');
        }
      } catch (err) {
        console.error('Hero image attachment failed, leaving hotlinked URL:', err.message);
      }
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject: subject || `Hi ${firstName || 'there'}, your tickets are on the way`,
      html: finalHtml,
      attachments
    });
    res.json({ success: true, response: info.response });
  } catch (err) {
    console.error('Send email error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Public — called from the emailed your-tickets.html attachment (no login
// token available there, since the recipient isn't necessarily an app
// user). Knowledge of the random token is the access control, same
// capability-URL pattern as the real ACCEPT TICKETS link.
app.get('/api/ticket-access/:token', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ticket_access WHERE token = ? LIMIT 1', [req.params.token]);
    const record = rows[0];
    if (!record) return res.status(404).json({ error: 'This ticket link is no longer valid.' });
    res.json({
      event: typeof record.event_data === 'string' ? JSON.parse(record.event_data) : record.event_data,
      tickets: typeof record.tickets === 'string' ? JSON.parse(record.tickets) : record.tickets,
      senderName: record.sender_name,
      recipientFirstName: record.recipient_first_name,
      accepted: !!record.accepted,
      acceptedAt: record.accepted_at
    });
  } catch (err) {
    console.error('Get ticket access error:', err);
    res.status(500).json({ error: 'Server error loading ticket details' });
  }
});

// ── Add to Wallet ─────────────────────────────────────────────────────────
// Same capability-token pattern as /api/ticket-access/:token above — the
// email links straight here per-ticket, no login required. Resolves the
// token to one specific ticket within that order (:ticketIndex matches the
// position it had in the `tickets` array passed to /api/send-email).
const resolveWalletTicket = async (token, ticketIndex) => {
  const [rows] = await pool.query('SELECT * FROM ticket_access WHERE token = ? LIMIT 1', [token]);
  const record = rows[0];
  if (!record) return { error: 'This ticket link is no longer valid.', status: 404 };
  const event = typeof record.event_data === 'string' ? JSON.parse(record.event_data) : record.event_data;
  const tickets = typeof record.tickets === 'string' ? JSON.parse(record.tickets) : record.tickets;
  const ticket = tickets[Number(ticketIndex)];
  if (!ticket) return { error: 'Ticket not found.', status: 404 };
  return { event, ticket };
};

app.get('/api/wallet/apple/:token/:ticketIndex', async (req, res) => {
  if (!isAppleWalletConfigured()) {
    return res.status(503).send('Add to Apple Wallet isn\'t set up on this server yet — see WALLET_SETUP.md.');
  }
  try {
    const { event, ticket, error, status } = await resolveWalletTicket(req.params.token, req.params.ticketIndex);
    if (error) return res.status(status).send(error);
    const buffer = await buildApplePass(event, ticket, req.params.token, req.params.ticketIndex);
    res.set('Content-Type', 'application/vnd.apple.pkpass');
    res.set('Content-Disposition', 'attachment; filename="ticket.pkpass"');
    res.send(buffer);
  } catch (err) {
    console.error('Apple Wallet pass error:', err);
    res.status(500).send('Could not generate this pass right now.');
  }
});

// PassKit can't render our custom card design (no HTML engine in Wallet —
// see wallet.js), so this is the bridge: the pass links here (a backField
// URL, auto-linked by Wallet), opening the exact TicketBarcode.css design
// in the browser instead. Same token pattern as the routes above.
app.get('/api/wallet-card/:token/:ticketIndex', async (req, res) => {
  try {
    const { event, ticket, error, status } = await resolveWalletTicket(req.params.token, req.params.ticketIndex);
    if (error) return res.status(status).send(error);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(buildWalletCardPageHtml({ event, ticket }));
  } catch (err) {
    console.error('Wallet card page error:', err);
    res.status(500).send('Could not load this ticket right now.');
  }
});

app.get('/api/wallet/google/:token/:ticketIndex', async (req, res) => {
  if (!isGoogleWalletConfigured()) {
    return res.status(503).send('Add to Google Wallet isn\'t set up on this server yet — see WALLET_SETUP.md.');
  }
  try {
    const { event, ticket, error, status } = await resolveWalletTicket(req.params.token, req.params.ticketIndex);
    if (error) return res.status(status).send(error);
    const saveUrl = await buildGoogleWalletSaveUrl(event, ticket, req.params.token, req.params.ticketIndex);
    res.redirect(saveUrl);
  } catch (err) {
    console.error('Google Wallet pass error:', err);
    res.status(500).send('Could not generate this pass right now.');
  }
});

// Public — marks the transfer accepted. Idempotent: accepting twice just
// returns the original acceptance time rather than erroring.
app.post('/api/ticket-access/:token/accept', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ticket_access WHERE token = ? LIMIT 1', [req.params.token]);
    const record = rows[0];
    if (!record) return res.status(404).json({ error: 'This ticket link is no longer valid.' });
    if (!record.accepted) {
      await pool.query('UPDATE ticket_access SET accepted = 1, accepted_at = NOW() WHERE token = ?', [req.params.token]);
    }
    const [updated] = await pool.query('SELECT accepted_at FROM ticket_access WHERE token = ? LIMIT 1', [req.params.token]);
    res.json({ success: true, acceptedAt: updated[0].accepted_at });
  } catch (err) {
    console.error('Accept ticket transfer error:', err);
    res.status(500).json({ error: 'Server error accepting transfer' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Serve the built frontend (single-service deploy) ─────────────────────────
// The Railway build step runs `vite build` at the repo root, producing
// dist/. Static assets are fingerprinted by Vite so they're safe to cache
// aggressively; index.html itself must never be cached, since it's the one
// file that tells returning clients a new deploy exists at all.
const FRONTEND_DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST, {
    index: false,
    setHeaders: (res, filePath) => {
      if (path.basename(filePath) === 'index.html' || path.extname(filePath) === '') return;
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
  // SPA fallback — anything that isn't an API/uploads route and isn't a real
  // static file resolves to index.html so client-side routing (react-router)
  // works on a hard refresh of e.g. /admin or /firstfee.
  app.get(/^(?!\/api|\/uploads|\/health).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.json({ status: 'ok', note: 'frontend not built — dist/ missing' }));
}

// ── Global error handler ──────────────────────────────────────────────────────
// Must be registered last. Without this, any error thrown/passed to next()
// anywhere above (including the CORS middleware's origin check) falls through
// to Express's default handler, which renders a generic HTML error page
// instead of JSON — breaking every frontend fetch() that expects JSON back,
// no matter which route the error came from.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Only start accepting requests once the DB schema migration above has
// actually finished — dbReady's own .catch already exits the process on
// failure, so this .then only ever runs after a successful migration.
dbReady.then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ticketmaster backend (MySQL) running on port ${PORT}`);
  });

  process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
});

process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));
