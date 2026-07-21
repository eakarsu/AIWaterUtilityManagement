'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const auth = require('./middleware/auth');
const governanceRouter = require('./governance');

for (const name of ['DATABASE_URL', 'GOVERNANCE_TENANT_ID']) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;
const generatedRoutesEnabled = process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production';

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

app.use('/api/auth', require('./routes/auth'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', generatedRoutesEnabled, timestamp: new Date().toISOString() });
});

app.use('/api', auth);
app.use('/api/governance', governanceRouter);

const operationalRoutes = [
  ['/api/dashboard', './routes/dashboard'], ['/api/customers', './routes/customers'],
  ['/api/meter-readings', './routes/meterReadings'], ['/api/work-orders', './routes/workOrders'],
  ['/api/pipe-inventory', './routes/pipeInventory'], ['/api/pump-stations', './routes/pumpStations'],
  ['/api/reservoirs', './routes/reservoirs']
];
operationalRoutes.forEach(([mount, modulePath]) => app.use(mount, require(modulePath)));

if (generatedRoutesEnabled) {
  const generatedRoutes = [
    ['/api/leak-detection', './routes/leakDetection'], ['/api/demand-forecast', './routes/demandForecast'],
    ['/api/water-quality', './routes/waterQuality'], ['/api/infrastructure-aging', './routes/infrastructureAging'],
    ['/api/anomaly-detection', './routes/anomalyDetection'], ['/api/treatment-optimization', './routes/treatmentOptimization'],
    ['/api/ai/leak-analyzer', './routes/aiLeakAnalyzer'], ['/api/ai/demand-forecasting', './routes/aiDemandForecasting'],
    ['/api/ai/water-quality-risk', './routes/aiWaterQualityRisk'], ['/api/ai/infrastructure-aging', './routes/aiInfrastructureAging'],
    ['/api/ai/emergency-response', './routes/aiEmergencyResponse'], ['/api/ai/treatment-optimization', './routes/aiTreatmentOptimization'],
    ['/api/ai/anomaly-analyzer', './routes/aiAnomalyAnalyzer'], ['/api/ai/results', './routes/aiResults'],
    ['/api/custom', './routes/customFeatures'], ['/api/custom-views', './routes/customViews']
  ];
  generatedRoutes.forEach(([mount, modulePath]) => app.use(mount, require(modulePath)));
}

app.use((req, res) => res.status(404).json({ error: 'not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled request error:', err.message);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => console.log(`Water Utility Management API running on port ${PORT}`));

module.exports = app;
