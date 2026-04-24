const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));

// AI Feature routes
app.use('/api/leak-detection', require('./routes/leakDetection'));
app.use('/api/demand-forecast', require('./routes/demandForecast'));
app.use('/api/water-quality', require('./routes/waterQuality'));
app.use('/api/infrastructure-aging', require('./routes/infrastructureAging'));
app.use('/api/anomaly-detection', require('./routes/anomalyDetection'));
app.use('/api/treatment-optimization', require('./routes/treatmentOptimization'));

// Non-AI Feature routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/meter-readings', require('./routes/meterReadings'));
app.use('/api/work-orders', require('./routes/workOrders'));
app.use('/api/pipe-inventory', require('./routes/pipeInventory'));
app.use('/api/pump-stations', require('./routes/pumpStations'));
app.use('/api/reservoirs', require('./routes/reservoirs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.BACKEND_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Water Utility Management API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
