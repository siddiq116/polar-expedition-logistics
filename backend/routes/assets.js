const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT assets.*, camps.name AS camp_name
       FROM assets LEFT JOIN camps ON assets.camp_id = camps.id
       ORDER BY assets.name`
    )
    .all();
  res.json(rows);
});

router.post('/', authorize('command', 'logistics'), (req, res) => {
  const { camp_id, name, category, serial_no, condition, assigned_to, last_maintenance, notes } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category are required' });

  const info = db
    .prepare(
      `INSERT INTO assets (camp_id, name, category, serial_no, condition, assigned_to, last_maintenance, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      camp_id || null,
      name,
      category,
      serial_no || null,
      condition || 'operational',
      assigned_to || null,
      last_maintenance || null,
      notes || null
    );
  res.status(201).json(db.prepare('SELECT * FROM assets WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', authorize('command', 'logistics'), (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const fields = ['camp_id', 'name', 'category', 'serial_no', 'condition', 'assigned_to', 'last_maintenance', 'notes'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  const setClause = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(', ');
  if (setClause) {
    db.prepare(`UPDATE assets SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  }
  res.json(db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authorize('command', 'logistics'), (req, res) => {
  db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
