const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/ai/results - list AI results with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const featureType = req.query.feature_type;

    let where = 'WHERE user_id = $1';
    const params = [req.user.id];
    let paramIdx = 2;

    if (featureType) {
      where += ` AND feature_type = $${paramIdx++}`;
      params.push(featureType);
    }

    const countResult = await db.query(`SELECT COUNT(*) FROM ai_results ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT * FROM ai_results ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Error fetching AI results:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ai/results/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ai_results WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'AI result not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching AI result:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
