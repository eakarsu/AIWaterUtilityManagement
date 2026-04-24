const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/pipe-inventory - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pipe_inventory ORDER BY install_year ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pipe inventory:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/pipe-inventory/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pipe_inventory WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pipe record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching pipe record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/pipe-inventory - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      pipe_id, material, diameter_inches, length_feet,
      install_year, zone, street_name, condition_rating,
      pressure_class, last_inspection, notes
    } = req.body;

    const result = await db.query(
      `INSERT INTO pipe_inventory (pipe_id, material, diameter_inches, length_feet,
        install_year, zone, street_name, condition_rating,
        pressure_class, last_inspection, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [pipe_id, material, diameter_inches, length_feet,
       install_year, zone, street_name, condition_rating || 'good',
       pressure_class, last_inspection, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating pipe record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/pipe-inventory/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      pipe_id, material, diameter_inches, length_feet,
      install_year, zone, street_name, condition_rating,
      pressure_class, last_inspection, notes
    } = req.body;

    const result = await db.query(
      `UPDATE pipe_inventory SET
        pipe_id = COALESCE($1, pipe_id),
        material = COALESCE($2, material),
        diameter_inches = COALESCE($3, diameter_inches),
        length_feet = COALESCE($4, length_feet),
        install_year = COALESCE($5, install_year),
        zone = COALESCE($6, zone),
        street_name = COALESCE($7, street_name),
        condition_rating = COALESCE($8, condition_rating),
        pressure_class = COALESCE($9, pressure_class),
        last_inspection = COALESCE($10, last_inspection),
        notes = COALESCE($11, notes)
       WHERE id = $12 RETURNING *`,
      [pipe_id, material, diameter_inches, length_feet,
       install_year, zone, street_name, condition_rating,
       pressure_class, last_inspection, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pipe record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating pipe record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/pipe-inventory/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM pipe_inventory WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pipe record not found' });
    }
    res.json({ message: 'Pipe record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting pipe record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
