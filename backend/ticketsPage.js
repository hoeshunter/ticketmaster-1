// Standalone "verify then view tickets" HTML page, attached to outbound
// emails as tickets.html. Unlike the old version, this embeds NO ticket
// data — only a token. Opening the file shows an email + access-code form;
// the code itself is shown only in the email body, not this attachment, so
// having the file alone isn't enough. The actual event/ticket details are
// fetched from /api/verify-ticket-access only after both match what's on
// record for that token server-side. This file is served to real
// recipients (opened outside the app entirely, often from a file://
// context), so it needs a real absolute API URL.

const buildTicketsPageHtml = ({ token, apiBase }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Verify — Your Tickets</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 16px 40px; background:#f0f2f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; color:#111; }
  .wrap { max-width:420px; margin:0 auto; }
  .brand { text-align:center; margin-bottom:24px; }
  .brand span { color:#024DDF; font-size:21px; font-weight:800; font-style:italic; letter-spacing:-0.02em; }
  .card { background:#fff; border-radius:14px; box-shadow:0 6px 18px rgba(17,17,17,0.08); padding:24px 22px; }
  .card h1 { font-size:16px; margin:0 0 6px; }
  .card p { font-size:13px; color:#6b7680; margin:0 0 18px; line-height:1.5; }
  label { display:block; font-size:12px; font-weight:700; color:#333; margin-bottom:6px; }
  input { width:100%; padding:11px 12px; border:1px solid #d8d8d8; border-radius:8px; font-size:14px; font-family:inherit; margin-bottom:14px; }
  button { width:100%; padding:12px; background:#024DDF; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:700; font-family:inherit; cursor:pointer; }
  button:disabled { background:#9dc4ee; }
  .error { color:#b3261e; font-size:12.5px; margin:-6px 0 14px; }
  .event-card { background:#024DDF; color:#fff; border-radius:14px; padding:22px 20px; margin-bottom:6px; box-shadow:0 8px 24px rgba(2,77,223,0.25); }
  .event-card h1 { margin:0 0 8px; font-size:19px; line-height:1.3; }
  .event-card p { margin:2px 0; font-size:13px; opacity:0.9; color:#fff; }
  .recipient-note { text-align:center; font-size:12.5px; color:#6b7680; margin:16px 0 18px; }
  .ticket { position:relative; background:#fff; border-radius:14px; box-shadow:0 6px 18px rgba(17,17,17,0.08); margin-bottom:14px; display:flex; overflow:hidden; }
  .ticket-main { flex:1; padding:18px 20px; }
  .tlabel { font-size:10.5px; letter-spacing:0.08em; color:#9aa5ac; font-weight:700; margin-bottom:3px; }
  .tvalue { font-size:22px; font-weight:800; color:#111; letter-spacing:-0.01em; }
  .tvalue--sm { font-size:16px; }
  .sub-row { display:flex; gap:28px; margin-top:12px; }
  .ticket-perf { width:0; border-left:2px dashed #e2e6ea; }
  .ticket-stub { width:64px; flex-shrink:0; background:#024DDF; display:flex; align-items:center; justify-content:center; font-size:22px; }
  .footer-note { text-align:center; font-size:11px; color:#9aa5ac; line-height:1.6; margin-top:22px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand"><span>ticketmaster<sup style="font-size:10px;">&reg;</sup></span></div>

    <div id="gate" class="card">
      <h1>Verify it's you</h1>
      <p>For your security, enter the email these tickets were sent to and the access code from that email before we show your ticket details.</p>
      <form id="verify-form">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required>
        <label for="password">Access code</label>
        <input id="password" name="password" type="password" autocomplete="off" required>
        <div id="error" class="error" style="display:none;"></div>
        <button type="submit" id="submit-btn">View My Tickets</button>
      </form>
    </div>

    <div id="result" style="display:none;"></div>
  </div>

  <script>
    var TOKEN = ${JSON.stringify(token)};
    var API_BASE = ${JSON.stringify(apiBase)};

    function esc(s) {
      var d = document.createElement('div');
      d.textContent = s == null ? '' : String(s);
      return d.innerHTML;
    }

    function renderTickets(event, tickets, recipientFirstName) {
      var html = '';
      html += '<div class="event-card"><h1>' + esc(event.name) + '</h1>';
      html += '<p>' + esc(event.day) + ' ' + esc(event.date) + ' &bull; ' + esc(event.time) + '</p>';
      html += '<p>' + esc(event.stadium) + ', ' + esc(event.city) + ', ' + esc(event.state) + '</p></div>';
      if (recipientFirstName) {
        html += '<p class="recipient-note">Prepared for ' + esc(recipientFirstName) + '</p>';
      }
      (tickets || []).forEach(function (t) {
        html += '<div class="ticket"><div class="ticket-main">';
        html += '<div class="tlabel">SECTION</div><div class="tvalue">' + esc(t.section) + '</div>';
        html += '<div class="sub-row"><div><div class="tlabel">ROW</div><div class="tvalue tvalue--sm">' + esc(t.row) + '</div></div>';
        html += '<div><div class="tlabel">SEAT</div><div class="tvalue tvalue--sm">' + esc(t.seat) + '</div></div></div>';
        html += '</div><div class="ticket-perf"></div><div class="ticket-stub">&#127915;</div></div>';
      });
      html += '<p class="footer-note">Ticket details prepared by Ticketmaster.<br>&copy; ' + new Date().getFullYear() + ' Ticketmaster. All rights reserved.</p>';

      document.getElementById('result').innerHTML = html;
      document.getElementById('result').style.display = 'block';
      document.getElementById('gate').style.display = 'none';
    }

    document.getElementById('verify-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('submit-btn');
      var errorEl = document.getElementById('error');
      var email = document.getElementById('email').value.trim();
      var password = document.getElementById('password').value;
      errorEl.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Verifying…';

      fetch(API_BASE + '/verify-ticket-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: TOKEN, email: email, password: password })
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          if (!r.ok) throw new Error(r.data.error || 'Verification failed.');
          renderTickets(r.data.event, r.data.tickets, r.data.recipientFirstName);
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = 'View My Tickets';
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
        });
    });
  </script>
</body>
</html>`;

module.exports = { buildTicketsPageHtml };
