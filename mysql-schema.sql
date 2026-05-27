-- MySQL schema for the Ticketmaster multi-admin system
-- Run this once in your MySQL client (MySQL Workbench, CLI, etc.):
--   mysql -u root -p < mysql-schema.sql
-- or paste it into a query tab and execute.

CREATE DATABASE IF NOT EXISTS ticketmaster
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ticketmaster;

-- Admins -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,          -- bcrypt hash ONLY, never plaintext
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Events -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  admin_id   CHAR(36)     NOT NULL,
  name       VARCHAR(255) NOT NULL,
  state      VARCHAR(50)  NOT NULL,
  city       VARCHAR(100) NOT NULL,
  stadium    VARCHAR(255) NOT NULL,
  `day`      VARCHAR(10)  NOT NULL,          -- MON, TUE, ...
  `date`     VARCHAR(20)  NOT NULL,          -- "JUN 28, 2026"
  `time`     VARCHAR(20)  NOT NULL,          -- "7:00 PM"
  order_num  VARCHAR(50)  NOT NULL,
  tickets    JSON         NOT NULL,
  image_url  TEXT         NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_events_admin_id (admin_id),
  INDEX idx_events_created_at (created_at)
) ENGINE=InnoDB;
