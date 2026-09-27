// Railway GitHub deployment entry point.
// Both servers must start here so the main server's resell proxy (localhost:3002)
// has something to talk to. RESELL_PORT is pinned to 3002 so the resell server
// never accidentally grabs Railway's public PORT (which belongs to server.js).
process.env.RESELL_PORT = '3002';
require('./backend/server.js');
require('./backend/resell-server.js');
