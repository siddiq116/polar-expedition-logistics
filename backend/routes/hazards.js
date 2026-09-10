const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM hazards ORDER BY reported_at DESC').all());
});

router.post('/', (req, res) => {
  const { lat, lng, type, severity, description } = req.body;
  if (lat == null || lng == null || !type) {
    return res.status(400).json({ error: 'lat, lng, type are required' });
  }
  const info = db
    .prepare(
      `INSERT INTO hazards (lat, lng, type, severity, reported_by, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(lat, lng, type, severity || 'moderate', req.user.full_name, description || null);
  res.status(201).json(db.prepare('SELECT * FROM hazards WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM hazards WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
