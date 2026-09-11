require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const db = require('./db'); // ensures schema is created

// First boot on a fresh deploy (e.g. Render's ephemeral disk) has no data yet -
// seed it automatically so the demo always has something to show.
const campCount = db.prepare('SELECT COUNT(*) c FROM camps').get().c;
if (campCount === 0) {
  console.log('No data found — seeding database with demo data...');
  require('./data/seed').run();
}

const authRoutes = require('./routes/auth');
const campRoutes = require('./routes/camps');
const inventoryRoutes = require('./routes/inventory');
const alertRoutes = require('./routes/alerts');
const assetRoutes = require('./routes/assets');
const personnelRoutes = require('./routes/personnel');
const hazardRoutes = require('./routes/hazards');
const simulateRoutes = require('./routes/simulate');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/consumables', inventoryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/simulate', simulateRoutes);

// Serve the built frontend when it's sitting next to the backend (single-
// service deploys, e.g. Render). On Vercel the frontend is built and served
// separately as static output, and this function's bundle won't contain
// frontend/dist anyway, so this block is skipped there.
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (!process.env.VERCEL && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// On Vercel this module is required by api/index.js and invoked per-request
// instead of listening on a port.
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Polar logistics API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
