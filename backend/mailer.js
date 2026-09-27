// SMTP transporter for /api/send-email. Config comes entirely from env vars
// (see .env.example) so no mailbox credentials ever live in source control.
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false', // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Without these, a stalled TCP handshake or unresponsive SMTP greeting
  // (both seen intermittently against GoDaddy's relay) leaves sendMail()
  // pending indefinitely. The /api/send-email request then just hangs
  // until Railway's own proxy eventually kills the connection — which
  // the browser surfaces as "NetworkError when attempting to fetch
  // resource" instead of a proper JSON error response. Failing fast here
  // means the route's existing try/catch can return a real 500 instead.
  connectionTimeout: 10000, // time to establish the TCP connection
  greetingTimeout: 10000,   // time to wait for the SMTP greeting after connecting
  socketTimeout: 20000      // time to wait for any response once connected
});

module.exports = transporter;
