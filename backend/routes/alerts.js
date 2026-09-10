const express = require('express');
const db = require('../db');
const { analyzeConsumable } = require('../utils/predictive');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const LEVEL_RANK = { critical: 0, warning: 1, ok: 2 };

router.get('/', (req, res) => {
  const camps = db.prepare('SELECT * FROM camps').all();
  const results = [];

  camps.forEach((camp) => {
    const consumables = db.prepare('SELECT * FROM consumables WHERE camp_id = ?').all(camp.id);
    consumables.forEach((c) => {
      const logs = db
        .prepare('SELECT * FROM consumption_logs WHERE consumable_id = ? ORDER BY log_date')
        .all(c.id);
      const analysis = analyzeConsumable(c, logs, camp.next_resupply_date);
      if (analysis.level !== 'ok') {
        results.push({ ...analysis, camp_id: camp.id, camp_name: camp.name });
      }
    });
  });

  results.sort((a, b) => {
    const rankDiff = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
    if (rankDiff !== 0) return rankDiff;
    return (a.days_remaining ?? Infinity) - (b.days_remaining ?? Infinity);
  });

  res.json(results);
});

module.exports = router;
