const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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

// New AI feature routes
app.use('/api/ai/leak-analyzer', require('./routes/aiLeakAnalyzer'));
app.use('/api/ai/demand-forecasting', require('./routes/aiDemandForecasting'));
app.use('/api/ai/water-quality-risk', require('./routes/aiWaterQualityRisk'));
app.use('/api/ai/infrastructure-aging', require('./routes/aiInfrastructureAging'));
app.use('/api/ai/emergency-response', require('./routes/aiEmergencyResponse'));
app.use('/api/ai/treatment-optimization', require('./routes/aiTreatmentOptimization'));
app.use('/api/ai/anomaly-analyzer', require('./routes/aiAnomalyAnalyzer'));
app.use('/api/ai/results', require('./routes/aiResults'));
app.use('/api/custom', require('./routes/customFeatures'));

// Custom Views (2 VIZ + 2 NON-VIZ) — must be registered BEFORE the 404 handler.
app.use('/api/custom-views', require('./routes/customViews'));

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

// // === Batch 09 Gaps & Frontend Mounts ===
app.use('/api/gap-ai-aiwaterutilitymanagement', require('./routes/batch09GapAi')); // // === Batch 09 Gaps & Frontend Mounts ===
app.use('/api/gap-nonai-aiwaterutilitymanagement', require('./routes/batch09GapNonai')); // // === Batch 09 Gaps & Frontend Mounts ===

app.listen(PORT, () => {
  console.log(`Water Utility Management API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;


