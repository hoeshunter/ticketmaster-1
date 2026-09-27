// Standalone "your tickets" HTML page, attached to outbound emails as
// your-tickets.html. Carries no ticket data itself — only a random token
// (capability-URL pattern, same trust model as the real ACCEPT TICKETS
// email link) — /api/ticket-access/:token resolves it to the actual
// event/seat details. Opens straight into the ticket view (no separate
// email+access-code gate) since this file is served to real recipients,
// often from a file:// context, so it needs a real absolute API URL.

const buildTicketsPageHtml = ({ token, apiBase }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your Tickets — Ticketmaster</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 16px 40px; background:#f0f2f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; color:#111; }
  .wrap { max-width:420px; margin:0 auto; }
  .brand { text-align:center; margin-bottom:24px; }
  .brand span { color:#024DDF; font-size:21px; font-weight:800; font-style:italic; letter-spacing:-0.02em; }
  .state { text-align:center; padding:60px 20px; color:#6b7680; font-size:13.5px; }
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
  .accept-btn { width:100%; padding:14px; margin-top:8px; background: #024DDF; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:800; letter-spacing:0.02em; font-family:inherit; cursor:pointer; }
  .accept-btn:disabled { background: #024DDF; color: #fff }
  .accept-note { text-align:center; font-size:11px; color:#9aa5ac; line-height:1.5; margin-top:12px; }

  /* Loading overlay — shown while the accept request is in flight */
  .loading-overlay { position:fixed; inset:0; background:rgba(240,242,245,0.97); display:none; align-items:center; justify-content:center; flex-direction:column; z-index:999; }
  .loading-overlay.active { display:flex; }
  .spinner { width:40px; height:40px; border:4px solid #d8e2f7; border-top-color:#024DDF; border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:18px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .loading-overlay p { font-size:14px; font-weight:700; color:#353c42; }

  /* Complete state */
  .complete-wrap { text-align:center; padding:20px 12px; }
  .complete-check { width:64px; height:64px; border-radius:50%; background:#1a9e5c; color:#fff; font-size:32px; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; animation:pop 0.35s ease; }
  @keyframes pop { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }
  .complete-wrap h1 { font-size:19px; margin:0 0 8px; }
  .complete-wrap p { font-size:13.5px; color:#6b7680; line-height:1.5; margin:0 0 24px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand"><span>ticketmaster<sup style="font-size:10px;">&reg;</sup></span></div>
    <div id="loading-state" class="state">Loading your tickets&hellip;</div>
    <div id="app" style="display:none;"></div>
  </div>

  <div id="loading-overlay" class="loading-overlay">
    <div class="spinner"></div>
    <p>Accepting your tickets&hellip;</p>
  </div>

  <script>
    var TOKEN = ${JSON.stringify(token)};
    var API_BASE = ${JSON.stringify(apiBase)};

    function esc(s) {
      var d = document.createElement('div');
      d.textContent = s == null ? '' : String(s);
      return d.innerHTML;
    }

    function renderComplete(recipientFirstName) {
      document.getElementById('app').innerHTML =
        '<div class="complete-wrap">' +
          '<div class="complete-check">&#10003;</div>' +
          '<h1>Transfer Complete!</h1>' +
          '<p>' + (recipientFirstName ? esc(recipientFirstName) + ', your' : 'Your') + ' tickets have been added to your Ticketmaster account. See you at the show!</p>' +
        '</div>';
    }

    function renderTickets(data) {
      var event = data.event, tickets = data.tickets || [];
      var html = '';
      html += '<div class="event-card"><h1>' + esc(event.name) + '</h1>';
      html += '<p>' + esc(event.day) + ' ' + esc(event.date) + ' &bull; ' + esc(event.time) + '</p>';
      html += '<p>' + esc(event.stadium) + ', ' + esc(event.city) + ', ' + esc(event.state) + '</p></div>';
      if (data.recipientFirstName) {
        html += '<p class="recipient-note">Prepared for ' + esc(data.recipientFirstName) + '</p>';
      }
      tickets.forEach(function (t) {
        html += '<div class="ticket"><div class="ticket-main">';
        html += '<div class="tlabel">SECTION</div><div class="tvalue">' + esc(t.section) + '</div>';
        html += '<div class="sub-row"><div><div class="tlabel">ROW</div><div class="tvalue tvalue--sm">' + esc(t.row) + '</div></div>';
        html += '<div><div class="tlabel">SEAT</div><div class="tvalue tvalue--sm">' + esc(t.seat) + '</div></div></div>';
        html += '</div><div class="ticket-perf"></div><div class="ticket-stub">&#127915;</div></div>';
      });
      html += '<button type="button" class="accept-btn" id="accept-btn">ACCEPT TICKETS</button>';
      html += '<p class="accept-note">By clicking "ACCEPT TICKETS", these tickets are added to your Ticketmaster account.</p>';
      html += '<p class="footer-note">Ticket details prepared by Ticketmaster.<br>&copy; ' + new Date().getFullYear() + ' Ticketmaster. All rights reserved.</p>';

      document.getElementById('app').innerHTML = html;

      document.getElementById('accept-btn').addEventListener('click', function () {
        var btn = document.getElementById('accept-btn');
        var overlay = document.getElementById('loading-overlay');
        btn.disabled = true;
        overlay.classList.add('active');

        fetch(API_BASE + '/ticket-access/' + TOKEN + '/accept', { method: 'POST' })
          .then(function (res) {
            return res.json().then(function (body) { return { ok: res.ok, body: body }; });
          })
          .then(function (r) {
            if (!r.ok) throw new Error(r.body.error || 'Failed to accept transfer.');
            // Keep the loading screen up briefly so the transition doesn't
            // feel abrupt, then swap to the complete state.
            setTimeout(function () {
              overlay.classList.remove('active');
              renderComplete(data.recipientFirstName);
            }, 900);
          })
          .catch(function (err) {
            overlay.classList.remove('active');
            btn.disabled = false;
            alert(err.message);
          });
      });
    }

    fetch(API_BASE + '/ticket-access/' + TOKEN)
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (r) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        if (!r.ok) {
          document.getElementById('app').innerHTML = '<div class="state">' + esc(r.data.error || 'This ticket link is no longer valid.') + '</div>';
          return;
        }
        if (r.data.accepted) {
          renderComplete(r.data.recipientFirstName);
        } else {
          renderTickets(r.data);
        }
      })
      .catch(function () {
        document.getElementById('loading-state').textContent = 'Could not load your tickets. Please check your connection and try again.';
      });
  </script>
</body>
</html>`;

module.exports = { buildTicketsPageHtml };
