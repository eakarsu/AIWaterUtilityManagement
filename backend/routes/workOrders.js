const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/work-orders - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM work_orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching work orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/work-orders/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM work_orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching work order:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/work-orders - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      work_order_number, title, description, category,
      priority, status, assigned_to, location,
      estimated_hours, actual_hours, due_date, completed_date, cost
    } = req.body;

    const result = await db.query(
      `INSERT INTO work_orders (work_order_number, title, description, category,
        priority, status, assigned_to, location,
        estimated_hours, actual_hours, due_date, completed_date, cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [work_order_number, title, description, category,
       priority || 'medium', status || 'open', assigned_to, location,
       estimated_hours, actual_hours, due_date, completed_date, cost]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating work order:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/work-orders/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      work_order_number, title, description, category,
      priority, status, assigned_to, location,
      estimated_hours, actual_hours, due_date, completed_date, cost
    } = req.body;

    const result = await db.query(
      `UPDATE work_orders SET
        work_order_number = COALESCE($1, work_order_number),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        priority = COALESCE($5, priority),
        status = COALESCE($6, status),
        assigned_to = COALESCE($7, assigned_to),
        location = COALESCE($8, location),
        estimated_hours = COALESCE($9, estimated_hours),
        actual_hours = COALESCE($10, actual_hours),
        due_date = COALESCE($11, due_date),
        completed_date = COALESCE($12, completed_date),
        cost = COALESCE($13, cost)
       WHERE id = $14 RETURNING *`,
      [work_order_number, title, description, category,
       priority, status, assigned_to, location,
       estimated_hours, actual_hours, due_date, completed_date, cost, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating work order:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/work-orders/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM work_orders WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    res.json({ message: 'Work order deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting work order:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
