const express = require('express');
const db = require('../db');
const { analyzeConsumable } = require('../utils/predictive');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function analyzedConsumablesForCamp(camp) {
  const consumables = db.prepare('SELECT * FROM consumables WHERE camp_id = ?').all(camp.id);
  return consumables.map((c) => {
    const logs = db
      .prepare('SELECT * FROM consumption_logs WHERE consumable_id = ? ORDER BY log_date')
      .all(c.id);
    return analyzeConsumable(c, logs, camp.next_resupply_date);
  });
}

router.get('/', (req, res) => {
  const camps = db.prepare('SELECT * FROM camps ORDER BY name').all();
  const enriched = camps.map((camp) => {
    const analyzed = analyzedConsumablesForCamp(camp);
    const critical = analyzed.filter((a) => a.level === 'critical').length;
    const warning = analyzed.filter((a) => a.level === 'warning').length;
    return { ...camp, alert_summary: { critical, warning, ok: analyzed.length - critical - warning } };
  });
  res.json(enriched);
});

router.get('/:id', (req, res) => {
  const camp = db.prepare('SELECT * FROM camps WHERE id = ?').get(req.params.id);
  if (!camp) return res.status(404).json({ error: 'Camp not found' });

  const consumables = analyzedConsumablesForCamp(camp);
  const assets = db.prepare('SELECT * FROM assets WHERE camp_id = ?').all(camp.id);
  const personnel = db.prepare('SELECT * FROM personnel WHERE camp_id = ?').all(camp.id);

  res.json({ ...camp, consumables, assets, personnel });
});

router.post('/', authorize('command'), (req, res) => {
  const { name, type, lat, lng, personnel_count, next_resupply_date, notes } = req.body;
  if (!name || !type || lat == null || lng == null) {
    return res.status(400).json({ error: 'name, type, lat, lng are required' });
  }
  const info = db
    .prepare(
      `INSERT INTO camps (name, type, lat, lng, personnel_count, next_resupply_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, type, lat, lng, personnel_count || 0, next_resupply_date || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM camps WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', authorize('command', 'logistics'), (req, res) => {
  const camp = db.prepare('SELECT * FROM camps WHERE id = ?').get(req.params.id);
  if (!camp) return res.status(404).json({ error: 'Camp not found' });

  const fields = ['name', 'type', 'lat', 'lng', 'status', 'personnel_count', 'next_resupply_date', 'notes'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const setClause = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(', ');
  if (setClause) {
    db.prepare(`UPDATE camps SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  }
  res.json(db.prepare('SELECT * FROM camps WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authorize('command'), (req, res) => {
  db.prepare('DELETE FROM camps WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
