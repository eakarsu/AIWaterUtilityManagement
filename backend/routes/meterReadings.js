const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/meter-readings - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM meter_readings ORDER BY reading_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching meter readings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/meter-readings/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM meter_readings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meter reading not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching meter reading:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/meter-readings - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      meter_id, customer_name, reading_value, previous_reading,
      consumption, reading_date, read_by, status, notes
    } = req.body;

    const result = await db.query(
      `INSERT INTO meter_readings (meter_id, customer_name, reading_value, previous_reading,
        consumption, reading_date, read_by, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [meter_id, customer_name, reading_value, previous_reading,
       consumption, reading_date, read_by, status || 'verified', notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating meter reading:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/meter-readings/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      meter_id, customer_name, reading_value, previous_reading,
      consumption, reading_date, read_by, status, notes
    } = req.body;

    const result = await db.query(
      `UPDATE meter_readings SET
        meter_id = COALESCE($1, meter_id),
        customer_name = COALESCE($2, customer_name),
        reading_value = COALESCE($3, reading_value),
        previous_reading = COALESCE($4, previous_reading),
        consumption = COALESCE($5, consumption),
        reading_date = COALESCE($6, reading_date),
        read_by = COALESCE($7, read_by),
        status = COALESCE($8, status),
        notes = COALESCE($9, notes)
       WHERE id = $10 RETURNING *`,
      [meter_id, customer_name, reading_value, previous_reading,
       consumption, reading_date, read_by, status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meter reading not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating meter reading:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/meter-readings/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM meter_readings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meter reading not found' });
    }
    res.json({ message: 'Meter reading deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting meter reading:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
