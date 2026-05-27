require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('=== STARTUP DEBUG ===');
console.log(`Using PORT = ${PORT}`);
console.log(`JWT_SECRET set: ${!!JWT_SECRET}`);
console.log(`MYSQL_HOST set: ${!!process.env.MYSQL_HOST}`);
console.log(`MYSQL_DATABASE set: ${!!process.env.MYSQL_DATABASE}`);
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

// Verify DB connectivity at startup
pool.getConnection()
  .then(conn => { console.log('MySQL connected'); conn.release(); })
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

app.use(cors({
  origin: ['https://ticketmaster-twlj.vercel.app', 'https://ticketmaster-tau-tawny.vercel.app', 'http://localhost:5173', 'https://jimcooks211.github.io'],
  credentials: true
}));
app.use(express.json());

// Serve uploaded images at /uploads/<file>
app.use('/uploads', express.static(UPLOAD_DIR));

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
  const { name, state, city, stadium, time, date, day, orderNum, tickets = [], image_url } = req.body || {};
  try {
    const [existing] = await pool.query('SELECT id FROM events WHERE id = ? AND admin_id = ? LIMIT 1', [req.params.id, req.admin.id]);
    if (!existing.length) return res.status(404).json({ error: 'Event not found' });
    const fields = ['name = ?', 'state = ?', 'city = ?', 'stadium = ?', '`time` = ?', '`date` = ?', '`day` = ?', 'order_num = ?', 'tickets = ?'];
    const values = [name, state, city, stadium, time, date, day, orderNum, JSON.stringify(tickets)];
    if (image_url !== undefined) { fields.push('image_url = ?'); values.push(image_url); }
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
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.*, a.username AS createdBy FROM events e LEFT JOIN admins a ON a.id = e.admin_id ORDER BY e.created_at DESC'
    );
    res.json(rows.map(formatEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'ok' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ticketmaster backend (MySQL) running on port ${PORT}`);
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));
