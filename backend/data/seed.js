const bcrypt = require('bcryptjs');
const db = require('../db');
const { addDaysISO, todayISO } = require('../utils/predictive');

function clearAll() {
  const tables = ['hazards', 'consumption_logs', 'consumables', 'assets', 'personnel', 'users', 'camps'];
  tables.forEach((t) => db.prepare(`DELETE FROM ${t}`).run());
}

function insertCamp(c) {
  const info = db
    .prepare(
      `INSERT INTO camps (name, type, lat, lng, status, personnel_count, next_resupply_date, notes)
       VALUES (@name, @type, @lat, @lng, @status, @personnel_count, @next_resupply_date, @notes)`
    )
    .run(c);
  return info.lastInsertRowid;
}

// Generates `days` days of history ending yesterday, following baseline with
// an optional daily drift (trend) plus random noise, so the predictive engine
// has something realistic to project from.
function genLogs(consumableId, days, baseline, driftPerDay, noisePct) {
  const insert = db.prepare(
    'INSERT INTO consumption_logs (consumable_id, log_date, amount_used) VALUES (?, ?, ?)'
  );
  for (let i = days; i >= 1; i--) {
    const date = addDaysISO(todayISO(), -i);
    const trendValue = baseline + driftPerDay * (days - i);
    const noise = trendValue * noisePct * (Math.random() * 2 - 1);
    const amount = Math.max(0, Number((trendValue + noise).toFixed(2)));
    insert.run(consumableId, date, amount);
  }
}

function insertConsumable(camp_id, category, name, unit, current_stock, safety_buffer_days) {
  const info = db
    .prepare(
      `INSERT INTO consumables (camp_id, category, name, unit, current_stock, safety_buffer_days)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(camp_id, category, name, unit, current_stock, safety_buffer_days);
  return info.lastInsertRowid;
}

function run() {
  clearAll();

  // --- Users ---
  const users = [
    { username: 'command1', password: 'polar123', full_name: 'Dr. Elena Voss', role: 'command', camp_id: null },
    { username: 'logistics1', password: 'polar123', full_name: 'Marcus Webb', role: 'logistics', camp_id: null },
    { username: 'field1', password: 'polar123', full_name: 'Priya Nair', role: 'field', camp_id: null },
  ];
  const insertUser = db.prepare(
    `INSERT INTO users (username, password_hash, full_name, role, camp_id) VALUES (?, ?, ?, ?, ?)`
  );
  users.forEach((u) => {
    const hash = bcrypt.hashSync(u.password, 10);
    insertUser.run(u.username, hash, u.full_name, u.role, u.camp_id);
  });

  // --- Camps ---
  const amundsen = insertCamp({
    name: 'Amundsen-Ross Base',
    type: 'main_station',
    lat: -77.85,
    lng: 166.66,
    status: 'active',
    personnel_count: 42,
    next_resupply_date: addDaysISO(todayISO(), 21),
    notes: 'Primary coastal station, airstrip and harbor access.',
  });

  const shackleton = insertCamp({
    name: 'Shackleton Ridge Camp',
    type: 'field_camp',
    lat: -79.5,
    lng: -155.0,
    status: 'active',
    personnel_count: 11,
    next_resupply_date: addDaysISO(todayISO(), 9),
    notes: 'Glaciology field camp, resupply by fixed-wing aircraft only.',
  });

  const frosthaven = insertCamp({
    name: 'Frosthaven Field Camp',
    type: 'field_camp',
    lat: -75.1,
    lng: -60.0,
    status: 'active',
    personnel_count: 7,
    next_resupply_date: addDaysISO(todayISO(), 14),
    notes: 'Seismic survey team, remote inland location.',
  });

  const polaris = insertCamp({
    name: 'Polaris Point Outpost',
    type: 'outpost',
    lat: -82.3,
    lng: 100.0,
    status: 'active',
    personnel_count: 4,
    next_resupply_date: addDaysISO(todayISO(), 5),
    notes: 'Deep-field outpost, weather-dependent resupply window.',
  });

  db.prepare('UPDATE users SET camp_id = ? WHERE username = ?').run(shackleton, 'field1');

  // --- Consumables + history ---
  // Amundsen-Ross: large, well-stocked, stable consumption -> should read OK
  let id = insertConsumable(amundsen, 'fuel', 'Diesel', 'liters', 9000, 5);
  genLogs(id, 14, 180, 0, 0.1);
  id = insertConsumable(amundsen, 'food', 'Food Rations', 'kg', 3200, 5);
  genLogs(id, 14, 85, 0, 0.08);
  id = insertConsumable(amundsen, 'medical', 'Medical Kits', 'kits', 60, 3);
  genLogs(id, 14, 0.5, 0, 0.3);

  // Shackleton Ridge: fuel consumption trending UP sharply (storm season) -> should trip CRITICAL
  id = insertConsumable(shackleton, 'fuel', 'Diesel', 'liters', 620, 4);
  genLogs(id, 14, 30, 4.5, 0.12);
  id = insertConsumable(shackleton, 'food', 'Food Rations', 'kg', 240, 4);
  genLogs(id, 14, 18, 0.3, 0.1);
  id = insertConsumable(shackleton, 'propane', 'Propane', 'kg', 150, 3);
  genLogs(id, 14, 9, 0.6, 0.15);

  // Frosthaven: moderate, slightly increasing -> should trip WARNING
  id = insertConsumable(frosthaven, 'fuel', 'Diesel', 'liters', 480, 4);
  genLogs(id, 14, 22, 1.1, 0.1);
  id = insertConsumable(frosthaven, 'food', 'Food Rations', 'kg', 210, 4);
  genLogs(id, 14, 14, 0.15, 0.1);
  id = insertConsumable(frosthaven, 'medical', 'Medical Kits', 'kits', 12, 2);
  genLogs(id, 14, 0.2, 0, 0.4);

  // Polaris Point: tiny outpost, resupply very soon but stock already thin -> CRITICAL
  id = insertConsumable(polaris, 'fuel', 'Diesel', 'liters', 95, 3);
  genLogs(id, 14, 14, 0.8, 0.15);
  id = insertConsumable(polaris, 'food', 'Food Rations', 'kg', 55, 3);
  genLogs(id, 14, 8, 0.2, 0.1);

  // --- Assets ---
  const assets = [
    [amundsen, 'Ski-Doo Expedition 900', 'vehicle', 'SD-1001', 'operational', 'Transport Pool', addDaysISO(todayISO(), -20)],
    [amundsen, 'Diesel Generator 20kW', 'power', 'GEN-2201', 'operational', 'Power Team', addDaysISO(todayISO(), -10)],
    [amundsen, 'Satellite Comms Terminal', 'communications', 'SAT-330', 'operational', 'Comms Room', addDaysISO(todayISO(), -45)],
    [shackleton, 'Ski-Doo Expedition 900', 'vehicle', 'SD-1004', 'needs_maintenance', 'Priya Nair', addDaysISO(todayISO(), -70)],
    [shackleton, 'Ice Core Drill Rig', 'scientific', 'ICR-77', 'operational', 'Glaciology Team', addDaysISO(todayISO(), -5)],
    [frosthaven, 'Seismic Sensor Array', 'scientific', 'SEIS-14', 'operational', 'Survey Team', addDaysISO(todayISO(), -15)],
    [frosthaven, 'Tracked Cargo Sled', 'vehicle', 'TCS-09', 'operational', 'Logistics', addDaysISO(todayISO(), -30)],
    [polaris, 'Backup Satellite Phone', 'communications', 'SATP-5', 'operational', 'Outpost Team', addDaysISO(todayISO(), -60)],
    [polaris, 'Portable Heater Unit', 'power', 'PH-22', 'degraded', 'Outpost Team', addDaysISO(todayISO(), -90)],
  ];
  const insertAsset = db.prepare(
    `INSERT INTO assets (camp_id, name, category, serial_no, condition, assigned_to, last_maintenance)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  assets.forEach((a) => insertAsset.run(...a));

  // --- Personnel ---
  const personnel = [
    [amundsen, 'Dr. Elena Voss', 'Expedition Commander', 'Wilderness First Responder', 'fit', addDaysISO(todayISO(), 0)],
    [amundsen, 'Marcus Webb', 'Logistics Officer', 'Cold Weather Ops', 'fit', addDaysISO(todayISO(), 0)],
    [amundsen, 'Dr. Aiko Tanaka', 'Medical Officer', 'Remote Medicine', 'fit', addDaysISO(todayISO(), -1)],
    [shackleton, 'Priya Nair', 'Field Team Lead', 'Glaciology, Crevasse Rescue', 'fit', addDaysISO(todayISO(), 0)],
    [shackleton, 'Tom Reilly', 'Field Technician', 'Cold Weather Ops', 'fatigued', addDaysISO(todayISO(), -1)],
    [frosthaven, 'Dr. Lars Bergman', 'Survey Lead', 'Seismology', 'fit', addDaysISO(todayISO(), 0)],
    [frosthaven, 'Nia Osei', 'Field Technician', 'Cold Weather Ops', 'fit', addDaysISO(todayISO(), -2)],
    [polaris, 'Jonas Kristiansen', 'Outpost Lead', 'Wilderness First Responder', 'fit', addDaysISO(todayISO(), 0)],
  ];
  const insertPerson = db.prepare(
    `INSERT INTO personnel (camp_id, full_name, role, certification, health_status, last_checkin)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  personnel.forEach((p) => insertPerson.run(...p));

  // --- Hazards ---
  const insertHazard = db.prepare(
    `INSERT INTO hazards (lat, lng, type, severity, reported_by, description) VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertHazard.run(-79.1, -154.2, 'crevasse_field', 'high', 'Priya Nair', 'Newly opened crevasse field along the southern approach route.');
  insertHazard.run(-76.9, 165.8, 'whiteout_risk', 'moderate', 'Dr. Elena Voss', 'Frequent whiteout conditions reported near the ridge line.');

  console.log('Seed complete:');
  console.log(`  Camps: ${db.prepare('SELECT COUNT(*) c FROM camps').get().c}`);
  console.log(`  Users: ${db.prepare('SELECT COUNT(*) c FROM users').get().c}`);
  console.log(`  Consumables: ${db.prepare('SELECT COUNT(*) c FROM consumables').get().c}`);
  console.log(`  Consumption logs: ${db.prepare('SELECT COUNT(*) c FROM consumption_logs').get().c}`);
  console.log(`  Assets: ${db.prepare('SELECT COUNT(*) c FROM assets').get().c}`);
  console.log(`  Personnel: ${db.prepare('SELECT COUNT(*) c FROM personnel').get().c}`);
  console.log('Login with: command1 / logistics1 / field1, password: polar123');
}

module.exports = { run };

if (require.main === module) {
  run();
}
