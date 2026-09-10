const express = require('express');
const db = require('../db');
const { analyzeConsumable, todayISO } = require('../utils/predictive');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.post('/', authorize('command', 'logistics'), (req, res) => {
  const { camp_id, category, name, unit, current_stock, safety_buffer_days } = req.body;
  if (!camp_id || !category || !name || !unit || current_stock == null) {
    return res.status(400).json({ error: 'camp_id, category, name, unit, current_stock are required' });
  }
  const info = db
    .prepare(
      `INSERT INTO consumables (camp_id, category, name, unit, current_stock, safety_buffer_days)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(camp_id, category, name, unit, current_stock, safety_buffer_days || 3);
  res.status(201).json(db.prepare('SELECT * FROM consumables WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', authorize('command', 'logistics'), (req, res) => {
  const item = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Consumable not found' });

  const fields = ['category', 'name', 'unit', 'current_stock', 'safety_buffer_days'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  const setClause = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(', ');
  if (setClause) {
    db.prepare(`UPDATE consumables SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  }
  res.json(db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authorize('command', 'logistics'), (req, res) => {
  db.prepare('DELETE FROM consumables WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// Log a consumption event (amount used on a given day) - feeds the predictive model
router.post('/:id/log', authorize('command', 'logistics', 'field'), (req, res) => {
  const item = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Consumable not found' });

  const { amount_used, log_date } = req.body;
  if (amount_used == null) return res.status(400).json({ error: 'amount_used is required' });

  const date = log_date || todayISO();
  db.prepare('INSERT INTO consumption_logs (consumable_id, log_date, amount_used) VALUES (?, ?, ?)').run(
    item.id,
    date,
    amount_used
  );

  const newStock = Math.max(0, item.current_stock - amount_used);
  db.prepare('UPDATE consumables SET current_stock = ? WHERE id = ?').run(newStock, item.id);

  const camp = db.prepare('SELECT * FROM camps WHERE id = ?').get(item.camp_id);
  const logs = db.prepare('SELECT * FROM consumption_logs WHERE consumable_id = ? ORDER BY log_date').all(item.id);
  const updatedItem = db.prepare('SELECT * FROM consumables WHERE id = ?').get(item.id);
  const analysis = analyzeConsumable(updatedItem, logs, camp?.next_resupply_date);

  res.json(analysis);
});

router.get('/:id/history', (req, res) => {
  const logs = db
    .prepare('SELECT * FROM consumption_logs WHERE consumable_id = ? ORDER BY log_date')
    .all(req.params.id);
  res.json(logs);
});

module.exports = router;
