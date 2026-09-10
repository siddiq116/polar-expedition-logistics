const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT personnel.*, camps.name AS camp_name
       FROM personnel LEFT JOIN camps ON personnel.camp_id = camps.id
       ORDER BY personnel.full_name`
    )
    .all();
  res.json(rows);
});

router.post('/', authorize('command', 'logistics'), (req, res) => {
  const { camp_id, full_name, role, certification, health_status, last_checkin } = req.body;
  if (!full_name || !role) return res.status(400).json({ error: 'full_name and role are required' });

  const info = db
    .prepare(
      `INSERT INTO personnel (camp_id, full_name, role, certification, health_status, last_checkin)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(camp_id || null, full_name, role, certification || null, health_status || 'fit', last_checkin || null);
  res.status(201).json(db.prepare('SELECT * FROM personnel WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', authorize('command', 'logistics'), (req, res) => {
  const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Personnel not found' });

  const fields = ['camp_id', 'full_name', 'role', 'certification', 'health_status', 'last_checkin'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  const setClause = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(', ');
  if (setClause) {
    db.prepare(`UPDATE personnel SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  }
  res.json(db.prepare('SELECT * FROM personnel WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authorize('command', 'logistics'), (req, res) => {
  db.prepare('DELETE FROM personnel WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
