-- Adds event-level "hold" support: an admin can hold an entire event so it
-- stops appearing in the public events list (nothing is deleted). server.js
-- also adds these columns defensively on every boot (see the dbReady
-- block), so this file is mainly documentation / a fast path for an
-- existing database that hasn't restarted the app yet.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS held    TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS held_at TIMESTAMP  NULL;
