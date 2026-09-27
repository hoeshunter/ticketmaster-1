require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const app = express();
// Use a dedicated port — never fall back to Railway's PORT (that belongs to the main server)
const PORT = process.env.RESELL_PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET;
// Frontend URL for shareable resell listing links (not the backend URL).
// Normalize: Railway sometimes has this set without a protocol prefix.
let PUBLIC_DOMAIN = process.env.PUBLIC_DOMAIN || 'http://localhost:5173';
if (PUBLIC_DOMAIN && !PUBLIC_DOMAIN.startsWith('http')) {
  PUBLIC_DOMAIN = 'https://' + PUBLIC_DOMAIN;
}

console.log('=== RESELL BACKEND STARTUP ===');
console.log(`PORT: ${PORT}`);
console.log(`JWT_SECRET set: ${!!JWT_SECRET}`);
console.log(`PUBLIC_DOMAIN: ${PUBLIC_DOMAIN}`);
console.log('==============================');

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET not set.');
  process.exit(1);
}

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Database initialization
const initDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected');

    // Resell listings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resell_listings (
        id CHAR(36) NOT NULL PRIMARY KEY,
        admin_id CHAR(36) NOT NULL,
        unique_link VARCHAR(255) NOT NULL UNIQUE,
        event_name VARCHAR(255) NOT NULL,
        event_date VARCHAR(64) NULL,
        event_time VARCHAR(64) NULL,
        event_location VARCHAR(255) NULL,
        tickets JSON NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        payment_methods JSON NOT NULL,
        barcode_data JSON NULL,
        status ENUM('active', 'pending_payment', 'paid', 'delivered', 'cancelled') NOT NULL DEFAULT 'active',
        buyer_email VARCHAR(255) NULL,
        buyer_name VARCHAR(255) NULL,
        payment_confirmed_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_admin_id (admin_id),
        KEY idx_unique_link (unique_link),
        KEY idx_status (status)
      ) ENGINE=InnoDB
    `);

    // Payment verifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_verifications (
        id CHAR(36) NOT NULL PRIMARY KEY,
        listing_id CHAR(36) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        proof_url VARCHAR(1024) NULL,
        transaction_id VARCHAR(255) NULL,
        verified TINYINT(1) NOT NULL DEFAULT 0,
        verified_at TIMESTAMP NULL,
        verified_by CHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_listing_id (listing_id),
        CONSTRAINT fk_payment_listing
          FOREIGN KEY (listing_id) REFERENCES resell_listings(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    conn.release();
    console.log('Database tables initialized');
  } catch (err) {
    console.error('FATAL: Database initialization failed');
    console.error(err);
    process.exit(1);
  }
};

// CORS Configuration
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === 'null') return cb(null, true);
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.PUBLIC_ORIGIN, // e.g. https://verifiedfanpresale.com — set in Railway vars
      PUBLIC_DOMAIN,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ].filter(Boolean);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|192\.168\.|10\.)/.test(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json());

// Auth middleware
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.admin = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS - Create and manage resell listings
// ══════════════════════════════════════════════════════════════════════════════

// Create a new resell listing
app.post('/api/admin/resell/create', auth, async (req, res) => {
  const {
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    tickets,
    totalPrice,
    paymentMethods,
    barcodeData
  } = req.body;

  if (!eventName || !tickets || !totalPrice || !paymentMethods) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const listingId = crypto.randomUUID();
    const uniqueLink = crypto.randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO resell_listings
       (id, admin_id, unique_link, event_name, event_date, event_time, event_location,
        tickets, total_price, payment_methods, barcode_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listingId,
        req.admin.id,
        uniqueLink,
        eventName,
        eventDate || null,
        eventTime || null,
        eventLocation || null,
        JSON.stringify(tickets),
        totalPrice,
        JSON.stringify(paymentMethods),
        barcodeData ? JSON.stringify(barcodeData) : null
      ]
    );

    const publicUrl = `${PUBLIC_DOMAIN}/resell/${uniqueLink}`;

    res.status(201).json({
      success: true,
      listingId,
      uniqueLink,
      publicUrl
    });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Get all listings for an admin
app.get('/api/admin/resell/listings', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM resell_listings
       WHERE admin_id = ?
       ORDER BY created_at DESC`,
      [req.admin.id]
    );

    const listings = rows.map(row => ({
      id: row.id,
      uniqueLink: row.unique_link,
      publicUrl: `${PUBLIC_DOMAIN}/resell/${row.unique_link}`,
      eventName: row.event_name,
      eventDate: row.event_date,
      eventTime: row.event_time,
      eventLocation: row.event_location,
      tickets: typeof row.tickets === 'string' ? JSON.parse(row.tickets) : row.tickets,
      totalPrice: parseFloat(row.total_price),
      paymentMethods: typeof row.payment_methods === 'string'
        ? JSON.parse(row.payment_methods)
        : row.payment_methods,
      status: row.status,
      buyerEmail: row.buyer_email,
      buyerName: row.buyer_name,
      paymentConfirmedAt: row.payment_confirmed_at,
      deliveredAt: row.delivered_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(listings);
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ error: 'Failed to load listings' });
  }
});

// Update listing status
app.put('/api/admin/resell/listings/:id/status', auth, async (req, res) => {
  const { status } = req.body;

  if (!['active', 'pending_payment', 'paid', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM resell_listings WHERE id = ? AND admin_id = ?',
      [req.params.id, req.admin.id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await pool.query(
      'UPDATE resell_listings SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Manually confirm payment
app.post('/api/admin/resell/listings/:id/confirm-payment', auth, async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM resell_listings WHERE id = ? AND admin_id = ?',
      [req.params.id, req.admin.id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await pool.query(
      `UPDATE resell_listings
       SET status = 'paid', payment_confirmed_at = NOW()
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({ success: true, message: 'Payment confirmed' });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Delete listing
app.delete('/api/admin/resell/listings/:id', auth, async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM resell_listings WHERE id = ? AND admin_id = ?',
      [req.params.id, req.admin.id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await pool.query('DELETE FROM resell_listings WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC BUYER ENDPOINTS - View and purchase tickets
// ══════════════════════════════════════════════════════════════════════════════

// Get listing details by unique link (public)
app.get('/api/resell/:uniqueLink', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM resell_listings WHERE unique_link = ? LIMIT 1',
      [req.params.uniqueLink]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = rows[0];

    if (listing.status === 'cancelled') {
      return res.status(410).json({ error: 'This listing is no longer available' });
    }

    res.json({
      id: listing.id,
      eventName: listing.event_name,
      eventDate: listing.event_date,
      eventTime: listing.event_time,
      eventLocation: listing.event_location,
      tickets: typeof listing.tickets === 'string' ? JSON.parse(listing.tickets) : listing.tickets,
      totalPrice: parseFloat(listing.total_price),
      paymentMethods: typeof listing.payment_methods === 'string'
        ? JSON.parse(listing.payment_methods)
        : listing.payment_methods,
      status: listing.status
    });
  } catch (err) {
    console.error('Get public listing error:', err);
    res.status(500).json({ error: 'Failed to load listing' });
  }
});

// Submit payment proof
app.post('/api/resell/:uniqueLink/submit-payment', async (req, res) => {
  const { paymentMethod, amount, transactionId, buyerEmail, buyerName } = req.body;

  if (!paymentMethod || !amount) {
    return res.status(400).json({ error: 'Missing payment information' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM resell_listings WHERE unique_link = ? LIMIT 1',
      [req.params.uniqueLink]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = rows[0];

    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'This listing is not available for purchase' });
    }

    // Create payment verification record
    const verificationId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO payment_verifications
       (id, listing_id, payment_method, amount, transaction_id)
       VALUES (?, ?, ?, ?, ?)`,
      [verificationId, listing.id, paymentMethod, amount, transactionId || null]
    );

    // Update listing status and buyer info
    await pool.query(
      `UPDATE resell_listings
       SET status = 'pending_payment', buyer_email = ?, buyer_name = ?
       WHERE id = ?`,
      [buyerEmail || null, buyerName || null, listing.id]
    );

    res.json({
      success: true,
      message: 'Payment submitted. Awaiting confirmation from seller.',
      verificationId
    });
  } catch (err) {
    console.error('Submit payment error:', err);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Check payment status (buyer polling endpoint)
app.get('/api/resell/:uniqueLink/payment-status', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT status, payment_confirmed_at FROM resell_listings WHERE unique_link = ? LIMIT 1',
      [req.params.uniqueLink]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = rows[0];

    res.json({
      status: listing.status,
      paymentConfirmed: listing.status === 'paid' || listing.status === 'delivered',
      paymentConfirmedAt: listing.payment_confirmed_at
    });
  } catch (err) {
    console.error('Check payment status error:', err);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Generate Apple Wallet pass (after payment confirmed)
app.get('/api/resell/:uniqueLink/wallet/apple', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM resell_listings
       WHERE unique_link = ? AND status IN ('paid', 'delivered')
       LIMIT 1`,
      [req.params.uniqueLink]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'Payment not confirmed yet' });
    }

    const listing = rows[0];

    // TODO: Integrate with Apple Wallet pass generation
    // For now, return a placeholder response
    res.json({
      message: 'Apple Wallet pass generation - to be implemented',
      listingId: listing.id,
      eventName: listing.event_name
    });
  } catch (err) {
    console.error('Apple Wallet error:', err);
    res.status(500).json({ error: 'Failed to generate wallet pass' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'resell' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server after DB initialization
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Resell backend running on port ${PORT}`);
  });
});

process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));
