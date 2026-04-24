const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/pump-stations - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pump_stations ORDER BY station_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pump stations:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/pump-stations/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pump_stations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pump station not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching pump station:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/pump-stations - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      station_name, station_id, location, capacity_gpm,
      current_flow_gpm, pressure_psi, power_kw, status,
      last_maintenance, pump_count, runtime_hours, efficiency_pct
    } = req.body;

    const result = await db.query(
      `INSERT INTO pump_stations (station_name, station_id, location, capacity_gpm,
        current_flow_gpm, pressure_psi, power_kw, status,
        last_maintenance, pump_count, runtime_hours, efficiency_pct)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [station_name, station_id, location, capacity_gpm,
       current_flow_gpm, pressure_psi, power_kw, status || 'operational',
       last_maintenance, pump_count || 1, runtime_hours, efficiency_pct]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating pump station:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/pump-stations/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      station_name, station_id, location, capacity_gpm,
      current_flow_gpm, pressure_psi, power_kw, status,
      last_maintenance, pump_count, runtime_hours, efficiency_pct
    } = req.body;

    const result = await db.query(
      `UPDATE pump_stations SET
        station_name = COALESCE($1, station_name),
        station_id = COALESCE($2, station_id),
        location = COALESCE($3, location),
        capacity_gpm = COALESCE($4, capacity_gpm),
        current_flow_gpm = COALESCE($5, current_flow_gpm),
        pressure_psi = COALESCE($6, pressure_psi),
        power_kw = COALESCE($7, power_kw),
        status = COALESCE($8, status),
        last_maintenance = COALESCE($9, last_maintenance),
        pump_count = COALESCE($10, pump_count),
        runtime_hours = COALESCE($11, runtime_hours),
        efficiency_pct = COALESCE($12, efficiency_pct)
       WHERE id = $13 RETURNING *`,
      [station_name, station_id, location, capacity_gpm,
       current_flow_gpm, pressure_psi, power_kw, status,
       last_maintenance, pump_count, runtime_hours, efficiency_pct, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pump station not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating pump station:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/pump-stations/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM pump_stations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pump station not found' });
    }
    res.json({ message: 'Pump station deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting pump station:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
