const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, 'data', 'polar.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('command','logistics','field')),
  camp_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS camps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  personnel_count INTEGER NOT NULL DEFAULT 0,
  next_resupply_date TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS consumables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camp_id INTEGER NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock REAL NOT NULL,
  safety_buffer_days INTEGER NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS consumption_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consumable_id INTEGER NOT NULL REFERENCES consumables(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  amount_used REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camp_id INTEGER REFERENCES camps(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  serial_no TEXT,
  condition TEXT NOT NULL DEFAULT 'operational',
  assigned_to TEXT,
  last_maintenance TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS personnel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camp_id INTEGER REFERENCES camps(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  certification TEXT,
  health_status TEXT NOT NULL DEFAULT 'fit',
  last_checkin TEXT
);

CREATE TABLE IF NOT EXISTS hazards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  reported_by TEXT,
  reported_at TEXT DEFAULT (datetime('now')),
  description TEXT
);
`);

module.exports = db;
