-- Initial schema for the Ticketmaster clone backend (MySQL).
-- Run this once against a fresh database. server.js also creates/repairs
-- these tables defensively on every boot (see the dbReady block), so this
-- file is mainly for: (a) documentation of the real schema, since
-- ticket_access was the only table previously auto-created in code while
-- admins/events existed only as tribal knowledge, and (b) a fast path to
-- provision a brand-new database (e.g. after a Railway account migration)
-- without waiting on the app's own bootstrap logic.

CREATE TABLE IF NOT EXISTS admins (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  username   VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  admin_id   CHAR(36)     NOT NULL,
  name       VARCHAR(255) NOT NULL,
  state      VARCHAR(255) NULL,
  city       VARCHAR(255) NULL,
  stadium    VARCHAR(255) NULL,
  `time`     VARCHAR(64)  NULL,
  `date`     VARCHAR(64)  NULL,
  `day`      VARCHAR(64)  NULL,
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket_access (
  token                 CHAR(48)     NOT NULL PRIMARY KEY,
  event_data            JSON         NOT NULL,
  tickets               JSON         NOT NULL,
  sender_name           VARCHAR(255) NULL,
  recipient_first_name  VARCHAR(255) NULL,
  accepted              TINYINT(1)   NOT NULL DEFAULT 0,
  accepted_at           TIMESTAMP    NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
