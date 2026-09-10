const express = require('express');
const db = require('../db');
const { todayISO } = require('../utils/predictive');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Advances the simulated clock by one day: generates a plausible consumption
// entry for every consumable (based on recent history plus randomness/weather
// jitter) and decrements stock. Lets the demo show the predictive engine
// react to live-looking data without waiting for real days to pass.
router.post('/advance-day', authorize('command', 'logistics'), (req, res) => {
  const consumables = db.prepare('SELECT * FROM consumables').all();
  const date = todayISO();
  const weatherJitter = 0.85 + Math.random() * 0.5; // 0.85x - 1.35x, simulates storm/calm days

  consumables.forEach((c) => {
    const logs = db
      .prepare('SELECT amount_used FROM consumption_logs WHERE consumable_id = ? ORDER BY log_date DESC LIMIT 5')
      .all(c.id);
    const baseline = logs.length
      ? logs.reduce((s, l) => s + l.amount_used, 0) / logs.length
      : c.current_stock * 0.05;

    const amount = Math.max(0, Number((baseline * weatherJitter).toFixed(2)));

    db.prepare('INSERT INTO consumption_logs (consumable_id, log_date, amount_used) VALUES (?, ?, ?)').run(
      c.id,
      date,
      amount
    );

    const newStock = Math.max(0, Number((c.current_stock - amount).toFixed(2)));
    db.prepare('UPDATE consumables SET current_stock = ? WHERE id = ?').run(newStock, c.id);
  });

  res.json({ advanced: true, date, consumables_updated: consumables.length });
});

module.exports = router;
