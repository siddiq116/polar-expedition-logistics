require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db'); // ensures schema is created

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Polar logistics API running on http://localhost:${PORT}`);
});
