const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/dashboard - returns summary stats
router.get('/', auth, async (req, res) => {
  try {
    // Run all queries in parallel
    const [
      customersResult,
      activeLeaksResult,
      pendingWorkOrdersResult,
      complianceResult,
      recentAlertsResult,
      upcomingForecastsResult,
      reservoirStatusResult,
      pumpStatusResult,
      anomalyCountResult,
      treatmentStatusResult
    ] = await Promise.all([
      // Total customers
      db.query('SELECT COUNT(*) as total FROM customers WHERE status = $1', ['active']),

      // Active leak alerts
      db.query(
        "SELECT COUNT(*) as total FROM leak_detections WHERE status IN ('confirmed', 'investigating')"
      ),

      // Pending work orders
      db.query(
        "SELECT COUNT(*) as total FROM work_orders WHERE status IN ('open', 'scheduled', 'in-progress')"
      ),

      // Water quality compliance rate
      db.query(
        "SELECT COUNT(*) FILTER (WHERE compliance_status = 'compliant') as compliant, COUNT(*) as total FROM water_quality"
      ),

      // Recent alerts (leak detections + anomalies)
      db.query(
        `(SELECT 'leak' as type, id, zone_name as title, severity, status, created_at
          FROM leak_detections WHERE status != 'resolved' ORDER BY created_at DESC LIMIT 5)
         UNION ALL
         (SELECT 'anomaly' as type, id, customer_name as title, anomaly_type as severity, status, created_at
          FROM anomaly_detection WHERE status != 'resolved' ORDER BY created_at DESC LIMIT 5)
         ORDER BY created_at DESC LIMIT 10`
      ),

      // Upcoming forecasts
      db.query(
        'SELECT * FROM demand_forecasts WHERE forecast_date >= CURRENT_DATE ORDER BY forecast_date ASC LIMIT 10'
      ),

      // Reservoir status summary
      db.query(
        "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'low') as low_level, ROUND(AVG(level_pct)::numeric, 1) as avg_level_pct FROM reservoirs"
      ),

      // Pump station status
      db.query(
        "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'operational') as operational, COUNT(*) FILTER (WHERE status = 'offline') as offline, COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance FROM pump_stations"
      ),

      // Active anomalies count
      db.query(
        "SELECT COUNT(*) as total FROM anomaly_detection WHERE status IN ('detected', 'investigating', 'confirmed')"
      ),

      // Treatment optimization pending
      db.query(
        "SELECT COUNT(*) as total FROM treatment_optimization WHERE optimization_status = 'pending'"
      )
    ]);

    const complianceData = complianceResult.rows[0];
    const complianceRate = complianceData.total > 0
      ? ((complianceData.compliant / complianceData.total) * 100).toFixed(1)
      : 100;

    res.json({
      summary: {
        total_customers: parseInt(customersResult.rows[0].total),
        active_leak_alerts: parseInt(activeLeaksResult.rows[0].total),
        pending_work_orders: parseInt(pendingWorkOrdersResult.rows[0].total),
        compliance_rate: parseFloat(complianceRate),
        active_anomalies: parseInt(anomalyCountResult.rows[0].total),
        pending_optimizations: parseInt(treatmentStatusResult.rows[0].total),
      },
      reservoir_status: {
        total: parseInt(reservoirStatusResult.rows[0].total),
        low_level: parseInt(reservoirStatusResult.rows[0].low_level),
        avg_level_pct: parseFloat(reservoirStatusResult.rows[0].avg_level_pct),
      },
      pump_status: {
        total: parseInt(pumpStatusResult.rows[0].total),
        operational: parseInt(pumpStatusResult.rows[0].operational),
        offline: parseInt(pumpStatusResult.rows[0].offline),
        maintenance: parseInt(pumpStatusResult.rows[0].maintenance),
      },
      recent_alerts: recentAlertsResult.rows,
      upcoming_forecasts: upcomingForecastsResult.rows,
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
