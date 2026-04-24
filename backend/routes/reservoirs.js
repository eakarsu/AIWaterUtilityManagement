const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/reservoirs - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reservoirs ORDER BY reservoir_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reservoirs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reservoirs/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reservoirs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservoir not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching reservoir:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reservoirs - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      reservoir_name, reservoir_id, location, capacity_mg,
      current_level_mg, level_pct, inflow_gpm, outflow_gpm,
      water_temp_f, status, last_inspection
    } = req.body;

    const result = await db.query(
      `INSERT INTO reservoirs (reservoir_name, reservoir_id, location, capacity_mg,
        current_level_mg, level_pct, inflow_gpm, outflow_gpm,
        water_temp_f, status, last_inspection)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [reservoir_name, reservoir_id, location, capacity_mg,
       current_level_mg, level_pct, inflow_gpm, outflow_gpm,
       water_temp_f, status || 'normal', last_inspection]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating reservoir:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/reservoirs/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      reservoir_name, reservoir_id, location, capacity_mg,
      current_level_mg, level_pct, inflow_gpm, outflow_gpm,
      water_temp_f, status, last_inspection
    } = req.body;

    const result = await db.query(
      `UPDATE reservoirs SET
        reservoir_name = COALESCE($1, reservoir_name),
        reservoir_id = COALESCE($2, reservoir_id),
        location = COALESCE($3, location),
        capacity_mg = COALESCE($4, capacity_mg),
        current_level_mg = COALESCE($5, current_level_mg),
        level_pct = COALESCE($6, level_pct),
        inflow_gpm = COALESCE($7, inflow_gpm),
        outflow_gpm = COALESCE($8, outflow_gpm),
        water_temp_f = COALESCE($9, water_temp_f),
        status = COALESCE($10, status),
        last_inspection = COALESCE($11, last_inspection)
       WHERE id = $12 RETURNING *`,
      [reservoir_name, reservoir_id, location, capacity_mg,
       current_level_mg, level_pct, inflow_gpm, outflow_gpm,
       water_temp_f, status, last_inspection, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservoir not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating reservoir:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/reservoirs/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM reservoirs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservoir not found' });
    }
    res.json({ message: 'Reservoir deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting reservoir:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
