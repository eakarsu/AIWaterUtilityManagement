const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/customers - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/customers/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/customers - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      account_number, name, email, phone, address,
      service_type, meter_id, status, monthly_avg_gallons,
      balance, join_date
    } = req.body;

    const result = await db.query(
      `INSERT INTO customers (account_number, name, email, phone, address,
        service_type, meter_id, status, monthly_avg_gallons, balance, join_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [account_number, name, email, phone, address,
       service_type || 'residential', meter_id, status || 'active',
       monthly_avg_gallons, balance || 0, join_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/customers/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      account_number, name, email, phone, address,
      service_type, meter_id, status, monthly_avg_gallons,
      balance, join_date
    } = req.body;

    const result = await db.query(
      `UPDATE customers SET
        account_number = COALESCE($1, account_number),
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        service_type = COALESCE($6, service_type),
        meter_id = COALESCE($7, meter_id),
        status = COALESCE($8, status),
        monthly_avg_gallons = COALESCE($9, monthly_avg_gallons),
        balance = COALESCE($10, balance),
        join_date = COALESCE($11, join_date)
       WHERE id = $12 RETURNING *`,
      [account_number, name, email, phone, address,
       service_type, meter_id, status, monthly_avg_gallons,
       balance, join_date, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/customers/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
